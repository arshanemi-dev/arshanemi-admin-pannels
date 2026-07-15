-- Migration: Coin-Wallet Billing System (Razorpay)
-- Run this in the Supabase SQL Editor. See plan/my-payment-management.md for
-- the full design — this file implements §1 of that plan.
--
-- Adds three new tables (coin_packages, wallet_topups, tools_usage_history)
-- and two Postgres functions (deduct_wallet_coins, credit_wallet_topup) that
-- perform atomic, race-safe balance changes against the existing
-- users.wallet_credits_total / users.wallet_credits_used columns (unchanged,
-- real, already in production — not renamed).

-- 1. coin_packages — admin-configurable buy packs
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coin_packages (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  coins          INTEGER      NOT NULL CHECK (coins > 0),
  price_paise    INTEGER      NOT NULL CHECK (price_paise > 0),
  badge          VARCHAR(100),
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  display_order  INTEGER      NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- CREATE UNIQUE INDEX (not an inline UNIQUE column constraint) so this line
-- is safe to run standalone against a database where coin_packages already
-- exists without it (CREATE TABLE IF NOT EXISTS above is a no-op in that
-- case, so an inline UNIQUE would never retroactively apply) — this is also
-- what scripts/seed.mjs's `ON CONFLICT (name)` upsert requires to work.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_packages_name ON coin_packages(name);
CREATE INDEX IF NOT EXISTS idx_coin_packages_is_active ON coin_packages(is_active);

ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages coin_packages"
  ON coin_packages FOR ALL
  USING (auth.role() = 'service_role');

-- 2. wallet_topups — one row per purchase attempt (payment history)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_topups (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coin_package_id     UUID         REFERENCES coin_packages(id) ON DELETE SET NULL,
  package_name        VARCHAR(255) NOT NULL,           -- snapshot, survives package edits/deletes
  amount_paise        INTEGER      NOT NULL CHECK (amount_paise > 0),
  coins_granted       INTEGER      NOT NULL CHECK (coins_granted > 0),
  status              VARCHAR(20)  NOT NULL DEFAULT 'created', -- created | paid | failed | cancelled
  razorpay_order_id   VARCHAR(255) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(255) UNIQUE,
  razorpay_signature  VARCHAR(500),
  failure_reason      TEXT,
  credited_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_topups_user_id  ON wallet_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topups_status    ON wallet_topups(status);
CREATE INDEX IF NOT EXISTS idx_wallet_topups_order_id  ON wallet_topups(razorpay_order_id);

ALTER TABLE wallet_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages wallet_topups"
  ON wallet_topups FOR ALL
  USING (auth.role() = 'service_role');

-- 3. tools_usage_history — every billable API fire
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tools_usage_history (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id                 TEXT         REFERENCES tools(id) ON DELETE SET NULL,
  tool_slug               VARCHAR(255) NOT NULL,        -- snapshot, survives tool edits/deletes
  feature_id              TEXT,
  feature_api_identifier  VARCHAR(255) NOT NULL,
  feature_title           VARCHAR(255),                 -- snapshot
  coins_cost              INTEGER      NOT NULL CHECK (coins_cost > 0), -- price at time of firing, never re-looked-up
  idempotency_key         VARCHAR(255),
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_tools_usage_history_user_id    ON tools_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tools_usage_history_tool_slug  ON tools_usage_history(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tools_usage_history_created_at ON tools_usage_history(created_at);

ALTER TABLE tools_usage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages tools_usage_history"
  ON tools_usage_history FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Atomic balance functions
-- ──────────────────────────────────────────────────────────────────────────────
-- deduct_wallet_coins: single guarded UPDATE (WHERE total - used >= amount) so
-- concurrent callers serialize on the row lock instead of racing a
-- SELECT-then-write. Idempotency key makes retried calls from the external
-- tool apps safe from double-charging.
CREATE OR REPLACE FUNCTION deduct_wallet_coins(
  p_user_id UUID, p_amount INTEGER, p_tool_id TEXT, p_tool_slug VARCHAR,
  p_feature_id TEXT, p_feature_api_identifier VARCHAR, p_feature_title VARCHAR,
  p_idempotency_key VARCHAR DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_existing tools_usage_history%ROWTYPE;
  v_row      users%ROWTYPE;
  v_remaining INTEGER;
  v_usage_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM tools_usage_history
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                                 'coinsCost', v_existing.coins_cost, 'remaining', v_remaining);
    END IF;
  END IF;

  UPDATE users
  SET wallet_credits_used = wallet_credits_used + p_amount, updated_at = NOW()
  WHERE id = p_user_id AND (wallet_credits_total - wallet_credits_used) >= p_amount
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins', 'remaining', v_remaining);
    ELSE
      RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
    END IF;
  END IF;

  BEGIN
    INSERT INTO tools_usage_history (user_id, tool_id, tool_slug, feature_id, feature_api_identifier, feature_title, coins_cost, idempotency_key)
    VALUES (p_user_id, p_tool_id, p_tool_slug, p_feature_id, p_feature_api_identifier, p_feature_title, p_amount, p_idempotency_key)
    RETURNING id INTO v_usage_id;
  EXCEPTION WHEN unique_violation THEN
    -- Lost a race to a concurrent call with the SAME idempotency key that
    -- committed first: undo our own deduction and return its row instead.
    UPDATE users SET wallet_credits_used = wallet_credits_used - p_amount, updated_at = NOW() WHERE id = p_user_id;
    SELECT * INTO v_existing FROM tools_usage_history WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                               'coinsCost', v_existing.coins_cost, 'remaining', v_remaining);
  END;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'usageId', v_usage_id,
                             'coinsCost', p_amount, 'remaining', v_row.wallet_credits_total - v_row.wallet_credits_used);
END;
$$;

-- credit_wallet_topup: idempotent, safe to call from both the client-verify
-- route and the webhook — whichever lands first wins, the second is a no-op
-- 'duplicate: true'.
CREATE OR REPLACE FUNCTION credit_wallet_topup(
  p_razorpay_order_id VARCHAR, p_razorpay_payment_id VARCHAR, p_razorpay_signature VARCHAR
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_topup wallet_topups%ROWTYPE;
  v_total INTEGER;
BEGIN
  UPDATE wallet_topups
  SET status = 'paid', razorpay_payment_id = p_razorpay_payment_id,
      razorpay_signature = p_razorpay_signature, credited_at = NOW(), updated_at = NOW()
  WHERE razorpay_order_id = p_razorpay_order_id AND status = 'created'
  RETURNING * INTO v_topup;

  IF NOT FOUND THEN
    SELECT * INTO v_topup FROM wallet_topups WHERE razorpay_order_id = p_razorpay_order_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'order_not_found'); END IF;
    IF v_topup.status = 'paid' THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'topupId', v_topup.id, 'coinsGranted', v_topup.coins_granted);
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'topup_not_payable', 'status', v_topup.status);
  END IF;

  UPDATE users SET wallet_credits_total = wallet_credits_total + v_topup.coins_granted, updated_at = NOW()
  WHERE id = v_topup.user_id RETURNING wallet_credits_total INTO v_total;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'topupId', v_topup.id,
                             'coinsGranted', v_topup.coins_granted, 'newTotal', v_total);
END;
$$;

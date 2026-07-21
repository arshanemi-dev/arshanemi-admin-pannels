-- Migration: Storage usage tracking + metered monthly billing, and
-- quantity-aware coin deductions (N files in one batch = N coins in one call).
-- Run this in the Supabase SQL Editor AFTER scripts/tool_fee_migration.sql.
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE throughout).
--
-- Link Generator (tools-1) reports storage deltas (+bytes on upload, -bytes
-- on delete) as they happen; a separate standalone cron script
-- (scripts/cron-storage-billing.mjs) reads the running total once daily and
-- bills 1 month at a time, independent of user action.

-- ── 1. Running per-(user, provider) storage total ──────────────────────────
CREATE TABLE IF NOT EXISTS user_storage_usage (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider      VARCHAR(20) NOT NULL CHECK (provider IN ('dropbox', 'bunny')),
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  next_bill_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, provider)
);

-- ── 2. Insert-only event log — gives the report endpoint real idempotency ──
-- (a bare running-total column can't safely dedupe a retried delta; this
-- mirrors how tools_usage_history + users.wallet_credits_used already pair
-- an event log with a derived aggregate).
CREATE TABLE IF NOT EXISTS storage_usage_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(20) NOT NULL CHECK (provider IN ('dropbox', 'bunny')),
  delta_bytes     BIGINT NOT NULL,
  idempotency_key VARCHAR(255),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_user_storage_usage_next_bill_at ON user_storage_usage(next_bill_at);

-- ── 3. report_storage_usage() — atomic insert-event + upsert-aggregate ─────
-- Same idempotency shape as deduct_wallet_coins: select-first short-circuit
-- on a duplicate idempotency key, unconditional insert otherwise.
CREATE OR REPLACE FUNCTION report_storage_usage(
  p_user_id UUID, p_provider VARCHAR, p_delta_bytes BIGINT,
  p_idempotency_key VARCHAR DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_bytes BIGINT;
BEGIN
  IF p_idempotency_key IS NOT NULL AND EXISTS (
    SELECT 1 FROM storage_usage_events WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  ) THEN
    SELECT storage_bytes INTO v_bytes FROM user_storage_usage WHERE user_id = p_user_id AND provider = p_provider;
    RETURN jsonb_build_object('ok', true, 'duplicate', true, 'storageBytes', COALESCE(v_bytes, 0));
  END IF;

  INSERT INTO storage_usage_events (user_id, provider, delta_bytes, idempotency_key)
  VALUES (p_user_id, p_provider, p_delta_bytes, p_idempotency_key);

  INSERT INTO user_storage_usage (user_id, provider, storage_bytes, next_bill_at)
  VALUES (p_user_id, p_provider, GREATEST(0, p_delta_bytes), NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id, provider) DO UPDATE
    SET storage_bytes = GREATEST(0, user_storage_usage.storage_bytes + p_delta_bytes),
        updated_at = NOW()
  RETURNING storage_bytes INTO v_bytes;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'storageBytes', v_bytes);
END;
$$;

-- ── 4. tools_usage_history.quantity — pure audit value ──────────────────────
-- coins_cost already reflects the multiplied total (coinCost × quantity);
-- this just makes "5 images uploaded" visible distinct from "5 coins spent".
ALTER TABLE tools_usage_history ADD COLUMN IF NOT EXISTS quantity INTEGER;

-- ── 5. deduct_wallet_coins — re-defined (CREATE OR REPLACE, same function) ──
-- to add p_allow_negative. Default false preserves current behavior for
-- every existing caller (runBillingGate's per-feature deducts). When true,
-- the balance-sufficiency WHERE clause is skipped, allowing
-- wallet_credits_used to exceed wallet_credits_total (debt) — used ONLY by
-- the storage-billing cron's direct RPC call, never exposed through
-- lib/db.js's deductWalletCoins() wrapper or /api/wallet/deduct's request
-- body, so no user-facing path can ever set it.
CREATE OR REPLACE FUNCTION deduct_wallet_coins(
  p_user_id UUID, p_amount INTEGER, p_tool_id TEXT, p_tool_slug VARCHAR,
  p_feature_id TEXT, p_feature_api_identifier VARCHAR, p_feature_title VARCHAR,
  p_idempotency_key VARCHAR DEFAULT NULL, p_allow_negative BOOLEAN DEFAULT false,
  p_quantity INTEGER DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_existing tools_usage_history%ROWTYPE;
  v_row      users%ROWTYPE;
  v_remaining INTEGER;
  v_usage_id UUID;
  v_latest_expiry TIMESTAMPTZ;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_amount');
  END IF;

  -- Idempotency short-circuit: same (user_id, idempotency_key) → return the
  -- prior result instead of deducting again.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM tools_usage_history
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
    IF FOUND THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'usageId', v_existing.id,
                                 'coinsCost', v_existing.coins_cost, 'remaining', v_remaining);
    END IF;
  END IF;

  -- Expiry check: latest PAID topup's expires_at; NULL (never bought coins) skips the check
  SELECT MAX(expires_at) INTO v_latest_expiry FROM wallet_topups WHERE user_id = p_user_id AND status = 'paid';
  IF v_latest_expiry IS NOT NULL AND v_latest_expiry < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'coins_expired', 'expiredAt', v_latest_expiry);
  END IF;

  -- Guarded UPDATE — balance can never go negative UNLESS p_allow_negative,
  -- in which case the WHERE clause drops the sufficiency check entirely.
  IF p_allow_negative THEN
    UPDATE users
    SET wallet_credits_used = wallet_credits_used + p_amount, updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_row;
  ELSE
    UPDATE users
    SET wallet_credits_used = wallet_credits_used + p_amount, updated_at = NOW()
    WHERE id = p_user_id AND (wallet_credits_total - wallet_credits_used) >= p_amount
    RETURNING * INTO v_row;
  END IF;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM users WHERE id = p_user_id) THEN
      SELECT (wallet_credits_total - wallet_credits_used) INTO v_remaining FROM users WHERE id = p_user_id;
      RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins', 'remaining', v_remaining);
    ELSE
      RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
    END IF;
  END IF;

  BEGIN
    INSERT INTO tools_usage_history (user_id, tool_id, tool_slug, feature_id, feature_api_identifier, feature_title, coins_cost, idempotency_key, quantity)
    VALUES (p_user_id, p_tool_id, p_tool_slug, p_feature_id, p_feature_api_identifier, p_feature_title, p_amount, p_idempotency_key, p_quantity)
    RETURNING id INTO v_usage_id;
  EXCEPTION WHEN unique_violation THEN
    -- Race: concurrent call w/ same idempotency key committed first — undo our deduction, return theirs
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

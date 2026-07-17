-- Migration: Fix-Fee tool billing (one-time flat ₹ unlock per feature)
-- Run this in the Supabase SQL Editor AFTER scripts/wallet_system_migration.sql,
-- scripts/coin_expiry_migration.sql, and scripts/payment_reconciliation_migration.sql.
-- See plan/tools-pricing-cut-paln.md — this implements §1 of that plan.
--
-- No new table. A fee purchase is just a wallet_topups row with
-- purchase_type='tool_fee' and coins_granted=0 — it reuses the exact
-- Razorpay order/payment audit trail, webhook, and reconciliation sweep
-- already built for coin top-ups.

ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS purchase_type VARCHAR(20) NOT NULL DEFAULT 'coin_topup',
  ADD COLUMN IF NOT EXISTS tool_slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS feature_api_identifier VARCHAR(255);
-- coin_package_id/package_name/coins_granted/validity_days/expires_at all
-- already exist; package_name is reused as-is for fee rows (holds the
-- feature's title as a human-readable snapshot label — same purpose it
-- already serves for coin packages).

ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_purchase_type_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_purchase_type_check
  CHECK (purchase_type IN ('coin_topup', 'tool_fee'));

-- coins_granted must be >0 for a coin topup, exactly 0 for a fee purchase
ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_coins_granted_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_coins_granted_check CHECK (
  (purchase_type = 'coin_topup' AND coins_granted > 0) OR
  (purchase_type = 'tool_fee' AND coins_granted = 0)
);

-- validity_days is coin-topup-only concept now — make it optional
ALTER TABLE wallet_topups ALTER COLUMN validity_days DROP NOT NULL;
ALTER TABLE wallet_topups DROP CONSTRAINT IF EXISTS wallet_topups_validity_days_check;
ALTER TABLE wallet_topups ADD CONSTRAINT wallet_topups_validity_days_check
  CHECK (validity_days IS NULL OR validity_days > 0);

CREATE INDEX IF NOT EXISTS idx_wallet_topups_purchase_type ON wallet_topups(purchase_type);

-- At most one PAID fee purchase per (user, tool, feature). Coin-topup rows
-- have NULL tool_slug/feature_api_identifier and this index is scoped to
-- purchase_type='tool_fee' anyway, so they never interact with it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_topups_paid_feature_fee
  ON wallet_topups(user_id, tool_slug, feature_api_identifier)
  WHERE purchase_type = 'tool_fee' AND status = 'paid';

-- credit_wallet_topup: re-defined (CREATE OR REPLACE, same existing function,
-- no new one) to branch on purchase_type. Forcing expires_at = NULL for fee
-- rows is what keeps them invisible to getLatestWalletExpiry() and the new
-- expiry check below (both already filter on `expires_at IS NOT NULL` /
-- use MAX(), which ignores NULLs).
CREATE OR REPLACE FUNCTION credit_wallet_topup(
  p_razorpay_order_id VARCHAR, p_razorpay_payment_id VARCHAR, p_razorpay_signature VARCHAR
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_topup wallet_topups%ROWTYPE;
  v_total INTEGER;
BEGIN
  UPDATE wallet_topups
  SET status = 'paid', razorpay_payment_id = p_razorpay_payment_id,
      razorpay_signature = p_razorpay_signature, credited_at = NOW(), updated_at = NOW(),
      expires_at = CASE WHEN purchase_type = 'coin_topup'
                        THEN NOW() + (validity_days || ' days')::interval
                        ELSE NULL END          -- fee unlocks never expire
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

  IF v_topup.purchase_type = 'coin_topup' THEN
    UPDATE users SET wallet_credits_total = wallet_credits_total + v_topup.coins_granted, updated_at = NOW()
    WHERE id = v_topup.user_id RETURNING wallet_credits_total INTO v_total;
  END IF;

  RETURN jsonb_build_object('ok', true, 'duplicate', false, 'topupId', v_topup.id,
                             'coinsGranted', v_topup.coins_granted, 'newTotal', v_total,
                             'expiresAt', v_topup.expires_at);
END;
$$;

-- deduct_wallet_coins: re-defined (CREATE OR REPLACE, same existing function)
-- to add expiry enforcement — inserted right after the idempotency
-- short-circuit, before the guarded balance UPDATE. If the user has never
-- completed a paid coin top-up, v_latest_expiry is NULL and the check is
-- skipped (no fabricated expiry).
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
  v_latest_expiry TIMESTAMPTZ;
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

  SELECT MAX(expires_at) INTO v_latest_expiry FROM wallet_topups WHERE user_id = p_user_id AND status = 'paid';
  IF v_latest_expiry IS NOT NULL AND v_latest_expiry < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'coins_expired', 'expiredAt', v_latest_expiry);
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

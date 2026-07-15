-- Migration: Coin expiry (validity period per package + per-purchase snapshot)
-- Run this in the Supabase SQL Editor AFTER scripts/wallet_system_migration.sql.
-- See plan/my-payment-management.md — this adds the "how long do coins from
-- this package stay valid" concept that was previously just a UI placeholder.
--
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS, not an edit to the original
-- CREATE TABLE statements — those already ran once, so CREATE TABLE IF NOT
-- EXISTS is a no-op against the live database and would never add these
-- columns retroactively. (scripts/wallet_system_migration.sql has ALSO been
-- updated in place with these same columns, so a *fresh* install gets them
-- from the start — this file is only for a database that already ran the
-- old version of that file.)

ALTER TABLE coin_packages
  ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 365 CHECK (validity_days > 0);

ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS validity_days INTEGER NOT NULL DEFAULT 365 CHECK (validity_days > 0),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wallet_topups_expires_at ON wallet_topups(expires_at);

-- credit_wallet_topup: re-defined (CREATE OR REPLACE, safe to re-run) to also
-- stamp expires_at = credited_at + validity_days when a topup is credited.
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
      expires_at = NOW() + (validity_days || ' days')::interval
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
                             'coinsGranted', v_topup.coins_granted, 'newTotal', v_total,
                             'expiresAt', v_topup.expires_at);
END;
$$;

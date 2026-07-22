-- Migration: Coin-based recurring feature activation — replaces the Razorpay
-- Fix-Fee mechanism (scripts/tool_fee_migration.sql) entirely. A feature can
-- require being "activated": a monthly subscription paid in coins (not
-- rupees), toggled on/off per user, auto-renewed monthly by
-- scripts/cron-feature-renewals.mjs, and auto-deactivated if the user's coin
-- balance can't cover a renewal (never goes into debt — unlike the storage
-- billing cron, insufficient coins here deactivates rather than allowing
-- negative balance).
-- Run this in the Supabase SQL Editor AFTER scripts/tool_fee_migration.sql
-- and scripts/storage_billing_migration.sql. Safe to re-run.
--
-- wallet_topups' purchase_type='tool_fee' columns/constraints are left in
-- place (inert, unused going forward) — dropping them is a separate, riskier
-- migration with no functional benefit once the code stops writing them.

CREATE TABLE IF NOT EXISTS feature_activations (
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_slug               VARCHAR(255) NOT NULL,
  feature_api_identifier  VARCHAR(255) NOT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  next_renewal_at         TIMESTAMPTZ NOT NULL,
  activated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at          TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tool_slug, feature_api_identifier)
);

CREATE INDEX IF NOT EXISTS idx_feature_activations_renewal
  ON feature_activations(next_renewal_at) WHERE is_active = true;

-- activate_feature() — composes the EXISTING deduct_wallet_coins (reused
-- as-is, not duplicated) with the activation upsert, atomic in one function
-- call. p_allow_negative is omitted (defaults to false) — activation always
-- requires a real, sufficient balance, same as any other coin deduction.
CREATE OR REPLACE FUNCTION activate_feature(
  p_user_id UUID, p_tool_id TEXT, p_tool_slug VARCHAR, p_feature_id TEXT,
  p_feature_api_identifier VARCHAR, p_feature_title VARCHAR,
  p_coins INTEGER, p_idempotency_key VARCHAR DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
BEGIN
  v_result := deduct_wallet_coins(
    p_user_id, p_coins, p_tool_id, p_tool_slug, p_feature_id,
    p_feature_api_identifier, p_feature_title, p_idempotency_key,
    false, 1
  );
  IF NOT (v_result->>'ok')::boolean THEN
    RETURN v_result;
  END IF;

  INSERT INTO feature_activations (user_id, tool_slug, feature_api_identifier, next_renewal_at)
  VALUES (p_user_id, p_tool_slug, p_feature_api_identifier, NOW() + INTERVAL '1 month')
  ON CONFLICT (user_id, tool_slug, feature_api_identifier) DO UPDATE
    SET is_active = true,
        next_renewal_at = NOW() + INTERVAL '1 month',
        activated_at = NOW(),
        deactivated_at = NULL,
        updated_at = NOW();

  RETURN v_result;
END;
$$;

-- deactivate_feature() — user-initiated (Settings toggle-off) or
-- cron-initiated (failed renewal). No refund — standard
-- subscription-cancellation semantics, no partial-month credit.
CREATE OR REPLACE FUNCTION deactivate_feature(
  p_user_id UUID, p_tool_slug VARCHAR, p_feature_api_identifier VARCHAR
) RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
  UPDATE feature_activations
  SET is_active = false, deactivated_at = NOW(), updated_at = NOW()
  WHERE user_id = p_user_id AND tool_slug = p_tool_slug AND feature_api_identifier = p_feature_api_identifier;

  RETURN jsonb_build_object('ok', true);
END;
$$;

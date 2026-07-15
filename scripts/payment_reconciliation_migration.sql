-- Migration: Payment reconciliation (pending top-up sweep)
-- Run this in the Supabase SQL Editor AFTER scripts/wallet_system_migration.sql
-- (and scripts/coin_expiry_migration.sql if that hasn't been run yet either).
-- See plan/my-payment-management.md — backs lib/paymentReconciliation.js.
--
-- Why this exists: the primary path for confirming a payment is the Razorpay
-- webhook (app/api/wallet/webhook/route.js) plus the client-side verify call
-- fired right after Razorpay Checkout succeeds. Neither is bulletproof (a
-- webhook can be delayed, a browser tab can close before verify fires) —
-- this adds a server-side reconciliation sweep for orders stuck in 'created'
-- status, which re-checks Razorpay's own Fetch-Payments-for-an-Order API
-- directly (authoritative, not a client-supplied signature) rather than
-- trusting an in-memory timer that wouldn't survive a serverless
-- request/instance boundary.

ALTER TABLE wallet_topups
  ADD COLUMN IF NOT EXISTS reconcile_attempts INTEGER NOT NULL DEFAULT 0;

-- ══════════════════════════════════════════════════════════════════════════════
-- Arshanemi — PostgreSQL Schema (Supabase)
-- Run this in your Supabase SQL Editor to set up all tables.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. layout_settings — key/value JSON store for all site content & settings
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS layout_settings (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(255) UNIQUE NOT NULL,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_layout_settings_key ON layout_settings(key);

-- 2. users — admin and regular user accounts
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE,
  mobile        VARCHAR(20)  UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);

-- 3. user_otp — one-time passwords for password reset (60 s TTL)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_otp (
  id         SERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,   -- email or mobile number
  otp_code   VARCHAR(10)  NOT NULL,
  type       VARCHAR(20)  NOT NULL,   -- 'email' | 'mobile'
  purpose    VARCHAR(50)  NOT NULL DEFAULT 'reset_password',
  expires_at TIMESTAMPTZ  NOT NULL,   -- NOW() + 60 seconds
  used       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_otp_identifier ON user_otp(identifier);
CREATE INDEX IF NOT EXISTS idx_user_otp_expires    ON user_otp(expires_at);

-- Auto-delete expired OTP rows (runs every minute in Supabase via pg_cron)
-- If pg_cron is enabled, uncomment the block below:
-- SELECT cron.schedule(
--   'delete-expired-otps',
--   '* * * * *',
--   $$ DELETE FROM user_otp WHERE expires_at < NOW() $$
-- );

-- ══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — enable after setup
-- ══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE layout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_otp         ENABLE ROW LEVEL SECURITY;

-- layout_settings: public read, service-role write
CREATE POLICY "Public can read layout_settings"
  ON layout_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Service role can write layout_settings"
  ON layout_settings FOR ALL
  USING (auth.role() = 'service_role');

-- users: service-role full access only (sensitive data)
CREATE POLICY "Service role manages users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');

-- user_otp: service-role full access only
CREATE POLICY "Service role manages user_otp"
  ON user_otp FOR ALL
  USING (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════════════════════════════
-- Seed default admin user (password: Admin@1234  — change after first login)
-- Run: SELECT crypt('Admin@1234', gen_salt('bf')) to get the hash, then insert.
-- Or use the npm run seed command which does this automatically via bcryptjs.
-- ══════════════════════════════════════════════════════════════════════════════

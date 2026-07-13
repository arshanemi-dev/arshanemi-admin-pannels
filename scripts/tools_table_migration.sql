-- Migration: add dedicated tools table
-- Run this in the Supabase SQL Editor if you have an existing deployment.
--
-- The tools catalog previously lived as a single JSONB blob under
-- layout_settings (key='tools') — every create/update/delete rewrote the
-- entire array. This table replaces that storage. After running this, run
-- `node --env-file=.env scripts/migrate_tools_to_table.mjs` once to copy the
-- existing layout_settings blob into these rows (preserves existing ids).

CREATE TABLE IF NOT EXISTS tools (
  id             TEXT         PRIMARY KEY,          -- nanoid, carried over from the old JSONB items
  slug           VARCHAR(255) UNIQUE NOT NULL,
  title          VARCHAR(255) NOT NULL,
  icon           VARCHAR(100),
  short_desc     TEXT,
  category       VARCHAR(50),
  badge          VARCHAR(100),
  tool_url       VARCHAR(500),
  requires_login BOOLEAN      NOT NULL DEFAULT FALSE,
  content        JSONB        NOT NULL DEFAULT '{}', -- { features, hero, stats, steps, advantages, faqs }
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_slug     ON tools(slug);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages tools"
  ON tools FOR ALL
  USING (auth.role() = 'service_role');

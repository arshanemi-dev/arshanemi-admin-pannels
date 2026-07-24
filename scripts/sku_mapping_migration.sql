-- Migration: Per-user Master SKU + SKU→Master mapping storage for the PDF
-- Tools app (tools/arshanemi-tools-2, toolSlug 'pdf-cropper'). Backs the new
-- GET/POST/DELETE /api/sku/master and /api/sku/map routes, used only when
-- that app runs with NEXT_PUBLIC_IS_CONNECT=true — replaces its previous
-- global/shared Vercel Blob JSON store (lib/blobStore.js there) with
-- per-user_id rows here, matching every other /api/wallet/* route's
-- Bearer-JWT + user_id contract. Safe to re-run.

CREATE TABLE IF NOT EXISTS sku_masters (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku         VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_sku_masters_user ON sku_masters(user_id);

CREATE TABLE IF NOT EXISTS sku_mappings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sku         VARCHAR(255) NOT NULL,
  master_sku  VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_sku_mappings_user   ON sku_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_sku_mappings_master ON sku_mappings(user_id, master_sku);

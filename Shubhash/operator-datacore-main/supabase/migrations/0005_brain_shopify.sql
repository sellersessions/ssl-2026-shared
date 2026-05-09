-- ============================================================================
-- 0005_brain_shopify.sql
-- Shopify tables. SCAFFOLDED in v1 — schemas exist, connector is inert
-- until you activate it via docs/runbooks/connect-shopify.md.
--
-- Source API: Shopify Admin API (REST + GraphQL). Use the Admin API access
-- token from a custom app, never an OAuth-provisioned partner app, for
-- single-store operator workflows.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- brain.shopify_orders   — scaffolded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.shopify_orders (
    store_domain                    TEXT NOT NULL,
    order_id                        BIGINT NOT NULL,                            -- Shopify numeric ID
    name                            TEXT,                                       -- "#1234"
    created_at                      TIMESTAMPTZ NOT NULL,
    updated_at_shopify              TIMESTAMPTZ,
    processed_at                    TIMESTAMPTZ,
    cancelled_at                    TIMESTAMPTZ,
    closed_at                       TIMESTAMPTZ,
    financial_status                TEXT,                                       -- pending, paid, refunded, etc.
    fulfillment_status              TEXT,
    currency_code                   CHAR(3) NOT NULL,
    presentment_currency            CHAR(3),
    -- Money (shop currency)
    subtotal_price                  NUMERIC(18, 2),
    total_discounts                 NUMERIC(18, 2),
    total_shipping                  NUMERIC(18, 2),
    total_tax                       NUMERIC(18, 2),
    total_price                     NUMERIC(18, 2),
    -- No PII (email, name, full address) in the brain. If you need PII for
    -- shipping, store it in a separate pii.* schema with RLS + TTL.
    customer_id                     BIGINT,                                     -- Shopify customer ID, not PII
    ship_to_country                 CHAR(2),
    ship_to_state                   TEXT,
    ship_to_city                    TEXT,
    ship_to_zip                     TEXT,
    tags                            TEXT[],
    raw_id                          BIGINT REFERENCES raw.shopify_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (store_domain, order_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_orders_created
    ON brain.shopify_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_updated
    ON brain.shopify_orders (updated_at_shopify DESC);

-- ----------------------------------------------------------------------------
-- brain.shopify_line_items   — scaffolded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.shopify_line_items (
    order_id                        BIGINT NOT NULL,
    line_item_id                    BIGINT NOT NULL,
    product_id                      BIGINT,
    variant_id                      BIGINT,
    sku                             TEXT,
    title                           TEXT,
    variant_title                   TEXT,
    vendor                          TEXT,
    quantity                        INTEGER NOT NULL,
    price                           NUMERIC(18, 2),
    total_discount                  NUMERIC(18, 2),
    fulfillment_status              TEXT,
    raw_id                          BIGINT REFERENCES raw.shopify_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, line_item_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_line_items_sku
    ON brain.shopify_line_items (sku) WHERE sku IS NOT NULL;

-- ----------------------------------------------------------------------------
-- brain.shopify_products / brain.shopify_variants   — scaffolded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.shopify_products (
    store_domain                    TEXT NOT NULL,
    product_id                      BIGINT NOT NULL,
    title                           TEXT,
    handle                          TEXT,
    product_type                    TEXT,
    vendor                          TEXT,
    status                          TEXT,
    tags                            TEXT[],
    body_html                       TEXT,
    raw_id                          BIGINT REFERENCES raw.shopify_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (store_domain, product_id)
);

CREATE TABLE IF NOT EXISTS brain.shopify_variants (
    product_id                      BIGINT NOT NULL,
    variant_id                      BIGINT NOT NULL,
    sku                             TEXT,
    barcode                         TEXT,
    title                           TEXT,
    price                           NUMERIC(18, 2),
    compare_at_price                NUMERIC(18, 2),
    inventory_quantity              INTEGER,
    weight_grams                    NUMERIC(10, 2),
    raw_id                          BIGINT REFERENCES raw.shopify_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_variants_sku
    ON brain.shopify_variants (sku) WHERE sku IS NOT NULL;

-- ----------------------------------------------------------------------------
-- brain.shopify_inventory_levels   — scaffolded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.shopify_inventory_levels (
    snapshot_at                     TIMESTAMPTZ NOT NULL,
    location_id                     BIGINT NOT NULL,
    inventory_item_id               BIGINT NOT NULL,
    available                       INTEGER,
    raw_id                          BIGINT REFERENCES raw.shopify_payload(raw_id) ON DELETE SET NULL,
    PRIMARY KEY (snapshot_at, location_id, inventory_item_id)
);

INSERT INTO meta.migration_history (filename) VALUES ('0005_brain_shopify.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

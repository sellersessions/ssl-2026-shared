-- ============================================================================
-- 0004_brain_tiktok.sql
-- TikTok Shop tables. SCAFFOLDED in v1 — schemas exist, connector is inert
-- until you activate it via docs/runbooks/connect-tiktok.md.
--
-- Hard-earned gotchas baked in (from memory: feedback_tiktok_no_per_order_attribution.md
-- and tiktok-specific deployment lessons):
--   1. Orders API silently truncates windows > ~30 days. Chunk to 7 days.
--   2. Orders API returns one line_item per UNIT (so SUM(qty) = units sold).
--   3. Products API returns price as nested {currency, tax_exclusive_price}.
--   4. Some size SKUs come back as "-5-6" in Products but "-56" in Orders.
--      Build alias tolerance into every SKU lookup.
--   5. There is NO per-order ad attribution. Marketing API only goes down to
--      AUCTION_AD level (campaign × day). For per-order attribution you need
--      Pixel/CAPI on a separate storefront.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- brain.tiktok_orders   — scaffolded
-- Source: TikTok Shop Open API → Order/202309/getOrderList
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.tiktok_orders (
    shop_id                         TEXT NOT NULL,
    order_id                        TEXT NOT NULL,
    create_time                     TIMESTAMPTZ NOT NULL,
    update_time                     TIMESTAMPTZ,
    paid_time                       TIMESTAMPTZ,
    order_status                    TEXT,                                       -- UNPAID, PARTIALLY_SHIPPING, etc.
    fulfillment_type                TEXT,                                       -- FULFILLMENT_BY_TIKTOK_SHOP, FULFILLMENT_BY_SELLER
    payment_method_name             TEXT,
    -- Money fields all native currency
    currency_code                   CHAR(3) NOT NULL,
    sub_total                       NUMERIC(18, 2),                             -- product subtotal
    shipping_fee                    NUMERIC(18, 2),
    seller_discount                 NUMERIC(18, 2),
    platform_discount               NUMERIC(18, 2),
    payment_total                   NUMERIC(18, 2),                             -- buyer paid
    tax_amount                      NUMERIC(18, 2),
    -- Geography (no PII)
    buyer_uid                       TEXT,                                       -- TikTok-internal anonymous ID, not PII
    ship_to_country                 CHAR(2),
    ship_to_state                   TEXT,
    ship_to_city                    TEXT,
    ship_to_zip                     TEXT,
    raw_id                          BIGINT REFERENCES raw.tiktok_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_tt_orders_create_time
    ON brain.tiktok_orders (create_time DESC);

COMMENT ON TABLE brain.tiktok_orders IS
'TikTok Shop order header. Source: Order/202309/getOrderList. Chunk pulls to 7 days; longer windows truncate silently.';

-- ----------------------------------------------------------------------------
-- brain.tiktok_order_line_items   — scaffolded
-- Source: same API. ONE ROW PER UNIT (TikTok denormalises this way).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.tiktok_order_line_items (
    order_id                        TEXT NOT NULL,
    line_item_id                    TEXT NOT NULL,                              -- one per unit, NOT per quantity
    product_id                      TEXT,
    sku_id                          TEXT,
    seller_sku                      TEXT,
    product_name                    TEXT,
    sku_name                        TEXT,
    sku_image_url                   TEXT,
    sku_unit_original_price         NUMERIC(18, 2),
    sku_unit_seller_discount        NUMERIC(18, 2),
    sku_unit_platform_discount      NUMERIC(18, 2),
    sale_price                      NUMERIC(18, 2),
    currency_code                   CHAR(3),
    raw_id                          BIGINT REFERENCES raw.tiktok_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, line_item_id)
);

CREATE INDEX IF NOT EXISTS idx_tt_line_items_seller_sku
    ON brain.tiktok_order_line_items (seller_sku) WHERE seller_sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tt_line_items_product
    ON brain.tiktok_order_line_items (product_id) WHERE product_id IS NOT NULL;

COMMENT ON TABLE brain.tiktok_order_line_items IS
'TikTok Shop order line items. ONE ROW PER UNIT (qty=1 always). SUM(line_count) = units sold.';

-- ----------------------------------------------------------------------------
-- brain.tiktok_products   — scaffolded
-- Source: Product/202312/searchProducts + getProductDetail
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.tiktok_products (
    shop_id                         TEXT NOT NULL,
    product_id                      TEXT NOT NULL,
    title                           TEXT,
    description                     TEXT,
    status                          TEXT,
    category_id                     TEXT,
    brand_id                        TEXT,
    -- Free-form because TikTok evolves this shape; SKUs are nested.
    skus                            JSONB,
    images                          JSONB,
    raw_id                          BIGINT REFERENCES raw.tiktok_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, product_id)
);

-- ----------------------------------------------------------------------------
-- brain.tiktok_ads_daily   — scaffolded
-- Source: TikTok Marketing API (separate OAuth from Shop).
-- AUCTION_AD level only. There is NO per-order attribution natively.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.tiktok_ads_daily (
    metric_date                     DATE NOT NULL,
    advertiser_id                   TEXT NOT NULL,
    campaign_id                     TEXT NOT NULL,
    adgroup_id                      TEXT NOT NULL DEFAULT '',
    ad_id                           TEXT NOT NULL DEFAULT '',
    impressions                     BIGINT NOT NULL DEFAULT 0,
    clicks                          BIGINT NOT NULL DEFAULT 0,
    spend                           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    conversions                     BIGINT NOT NULL DEFAULT 0,
    conversion_value                NUMERIC(18, 2) NOT NULL DEFAULT 0,
    currency_code                   CHAR(3),
    raw_id                          BIGINT,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (metric_date, campaign_id, adgroup_id, ad_id)
);

INSERT INTO meta.migration_history (filename) VALUES ('0004_brain_tiktok.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

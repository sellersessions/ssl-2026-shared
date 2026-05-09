-- ============================================================================
-- 0003_brain_amazon.sql
-- The "brain" schema, Amazon tables. One row per source row, canonical
-- mirror of Amazon's source-of-truth reports.
--
-- Plain English: this is your data. Every row in here came directly from
-- the SP-API report that owns the metric. No reconstruction, no derivation.
--
-- v1 status: only sales_traffic_daily is actively populated by a connector.
-- Every other table is created up-front so its connector can be activated
-- as homework without another migration.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS brain;

COMMENT ON SCHEMA brain IS
'Source-of-truth mirror. One row per source row from each SP-API canonical report. Never reconstructed.';

-- ============================================================================
-- brain.sales_traffic_daily   — ACTIVE in v1
-- Source: GET_SALES_AND_TRAFFIC_REPORT (Brand Analytics)
-- The canonical revenue, units, sessions, page views report. Same numbers
-- as Seller Central → Reports → Business Reports.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.sales_traffic_daily (
    -- Primary key
    marketplace_id                  TEXT NOT NULL,
    metric_date                     DATE NOT NULL,
    parent_asin                     TEXT NOT NULL,
    child_asin                      TEXT NOT NULL,
    sku                             TEXT,                                       -- can be null if no SKU mapping at report time

    -- Currency context (per-marketplace native, see meta.marketplace)
    currency_code                   CHAR(3) NOT NULL,

    -- Revenue (ordered, before refunds)
    ordered_product_sales           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    ordered_product_sales_b2b       NUMERIC(18, 2) NOT NULL DEFAULT 0,

    -- Units
    units_ordered                   INTEGER NOT NULL DEFAULT 0,
    units_ordered_b2b               INTEGER NOT NULL DEFAULT 0,
    total_order_items               INTEGER NOT NULL DEFAULT 0,
    total_order_items_b2b           INTEGER NOT NULL DEFAULT 0,

    -- Traffic
    sessions                        INTEGER NOT NULL DEFAULT 0,
    sessions_b2b                    INTEGER NOT NULL DEFAULT 0,
    browser_sessions                INTEGER NOT NULL DEFAULT 0,
    browser_sessions_b2b            INTEGER NOT NULL DEFAULT 0,
    mobile_app_sessions             INTEGER NOT NULL DEFAULT 0,
    mobile_app_sessions_b2b         INTEGER NOT NULL DEFAULT 0,
    page_views                      INTEGER NOT NULL DEFAULT 0,
    page_views_b2b                  INTEGER NOT NULL DEFAULT 0,
    browser_page_views              INTEGER NOT NULL DEFAULT 0,
    browser_page_views_b2b          INTEGER NOT NULL DEFAULT 0,
    mobile_app_page_views           INTEGER NOT NULL DEFAULT 0,
    mobile_app_page_views_b2b       INTEGER NOT NULL DEFAULT 0,

    -- Buy Box
    buy_box_percentage              NUMERIC(7, 4),                              -- 0.0000 to 1.0000
    buy_box_percentage_b2b          NUMERIC(7, 4),

    -- Conversion (Amazon's own calculated conversion rate)
    unit_session_percentage         NUMERIC(7, 4),
    unit_session_percentage_b2b     NUMERIC(7, 4),

    -- Provenance
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (marketplace_id, metric_date, child_asin)
);

CREATE INDEX IF NOT EXISTS idx_st_daily_date
    ON brain.sales_traffic_daily (metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_st_daily_parent_asin_date
    ON brain.sales_traffic_daily (parent_asin, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_st_daily_sku_date
    ON brain.sales_traffic_daily (sku, metric_date DESC) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_st_daily_marketplace_date
    ON brain.sales_traffic_daily (marketplace_id, metric_date DESC);

COMMENT ON TABLE brain.sales_traffic_daily IS
'Canonical revenue/units/sessions per child ASIN per day per marketplace. Direct mirror of GET_SALES_AND_TRAFFIC_REPORT. Same numbers as Seller Central Business Reports.';
COMMENT ON COLUMN brain.sales_traffic_daily.ordered_product_sales IS
'Native-currency revenue Amazon shows the seller in Seller Central. The single source of truth for revenue.';

-- ============================================================================
-- brain.orders   — scaffolded, activate via homework
-- Source: GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.orders (
    marketplace_id                  TEXT NOT NULL,
    amazon_order_id                 TEXT NOT NULL,
    merchant_order_id               TEXT,
    purchase_date                   TIMESTAMPTZ,
    last_updated_date               TIMESTAMPTZ,
    order_status                    TEXT,
    fulfillment_channel             TEXT,                                       -- AFN (FBA) or MFN (FBM)
    sales_channel                   TEXT,
    order_channel                   TEXT,
    ship_service_level              TEXT,
    is_business_order               BOOLEAN,
    is_prime                        BOOLEAN,
    is_premium_order                BOOLEAN,
    is_global_express_enabled       BOOLEAN,
    is_replacement_order            BOOLEAN,
    is_sold_by_ab                   BOOLEAN,                                    -- Sold by Amazon Business
    payment_method                  TEXT,
    earliest_ship_date              TIMESTAMPTZ,
    latest_ship_date                TIMESTAMPTZ,
    earliest_delivery_date          TIMESTAMPTZ,
    latest_delivery_date            TIMESTAMPTZ,
    promise_response_due_date       TIMESTAMPTZ,
    ship_country                    CHAR(2),
    ship_state_province             TEXT,
    ship_city                       TEXT,
    ship_postal_code                TEXT,
    -- PII (buyer name, email, full address) is NEVER stored here.
    -- Use the Orders API + Restricted Data Token if you need PII, and put it
    -- in a separate pii.* schema with row-level security and a TTL.
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, amazon_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_purchase_date
    ON brain.orders (purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_last_updated
    ON brain.orders (last_updated_date DESC);

COMMENT ON TABLE brain.orders IS
'Canonical order header. Source: GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL. PII deliberately excluded.';

-- ============================================================================
-- brain.order_items   — scaffolded
-- Source: same Orders Report (one row per item)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.order_items (
    amazon_order_id                 TEXT NOT NULL,
    order_item_id                   TEXT NOT NULL,
    asin                            TEXT,
    sku                             TEXT,
    product_name                    TEXT,
    quantity                        INTEGER NOT NULL DEFAULT 0,
    quantity_shipped                INTEGER NOT NULL DEFAULT 0,
    item_price                      NUMERIC(18, 2),
    item_tax                        NUMERIC(18, 2),
    shipping_price                  NUMERIC(18, 2),
    shipping_tax                    NUMERIC(18, 2),
    gift_wrap_price                 NUMERIC(18, 2),
    gift_wrap_tax                   NUMERIC(18, 2),
    item_promotion_discount         NUMERIC(18, 2),
    ship_promotion_discount         NUMERIC(18, 2),
    currency_code                   CHAR(3),
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (amazon_order_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_asin
    ON brain.order_items (asin);
CREATE INDEX IF NOT EXISTS idx_order_items_sku
    ON brain.order_items (sku);

-- ============================================================================
-- brain.financial_events   — scaffolded
-- Source: Finances API → listFinancialEvents
--
-- IMPORTANT GOTCHAS (memory: feedback_sp_api_financial_events_quirks.md)
--   1. Fees come back NEGATIVE. We flip signs at parse time so downstream
--      queries don't have to remember. original_amount preserves the raw value.
--   2. Event type names sometimes drop the 'EventList' suffix in payloads.
--      Normalise at parse time: ShipmentEventList → ShipmentEvent.
--   3. Refunds reduce the original sale, not a separate refund total.
--      Direction-guard the credit-note rule explicitly in rollups.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.financial_events (
    event_id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id                  TEXT NOT NULL,
    event_type                      TEXT NOT NULL,                              -- ShipmentEvent, ServiceFeeEvent, RefundEvent, AdjustmentEvent, etc.
    event_subtype                   TEXT,                                       -- specific fee type within the event
    posted_date                     TIMESTAMPTZ NOT NULL,
    amazon_order_id                 TEXT,
    seller_order_id                 TEXT,
    sku                             TEXT,
    asin                            TEXT,
    -- Amounts: we ALWAYS store the absolute value in `amount`, with the
    -- direction (debit/credit) encoded in `direction`. This is the rule that
    -- prevents the 30-40% under-counting incidents.
    amount                          NUMERIC(18, 2) NOT NULL,                    -- absolute value (always positive)
    direction                       TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    original_amount                 NUMERIC(18, 2) NOT NULL,                    -- the raw value Amazon sent (may be negative)
    currency_code                   CHAR(3) NOT NULL,
    fee_description                 TEXT,
    -- Hash for idempotency (the same event can appear in multiple Finances API
    -- pages; we de-dupe on a deterministic hash of event content).
    event_hash                      TEXT NOT NULL,
    raw_id                          BIGINT REFERENCES raw.sp_api_event(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (marketplace_id, event_type, posted_date, event_hash)
);

CREATE INDEX IF NOT EXISTS idx_fin_events_order
    ON brain.financial_events (amazon_order_id) WHERE amazon_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fin_events_posted
    ON brain.financial_events (posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_events_type_posted
    ON brain.financial_events (event_type, posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_events_sku
    ON brain.financial_events (sku) WHERE sku IS NOT NULL;

COMMENT ON TABLE brain.financial_events IS
'Every fee, refund, adjustment, charge, and credit. amount is always positive; direction encodes credit/debit. original_amount preserves Amazon''s raw sign.';

-- A view for refund events, joined to orders for convenience
CREATE OR REPLACE VIEW brain.refund_events AS
    SELECT
        fe.*,
        o.purchase_date AS original_purchase_date
    FROM brain.financial_events fe
    LEFT JOIN brain.orders o
      ON o.amazon_order_id = fe.amazon_order_id
     AND o.marketplace_id = fe.marketplace_id
    WHERE fe.event_type IN ('RefundEvent', 'GuaranteeClaimEvent', 'ChargebackEvent');

COMMENT ON VIEW brain.refund_events IS
'Refund-flavoured financial events joined to their original order. Memory: refunds reduce gross sales (Box 1), not net total (Box 4).';

-- ============================================================================
-- brain.settlements   — scaffolded
-- Source: GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2
-- IMPORTANT: settlement reports CANNOT be requested. Amazon auto-schedules
-- them every ~14 days. The connector polls listReports for new ones.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.settlements (
    settlement_id                   TEXT PRIMARY KEY,
    marketplace_id                  TEXT NOT NULL,
    settlement_start_date           TIMESTAMPTZ NOT NULL,
    settlement_end_date             TIMESTAMPTZ NOT NULL,
    deposit_date                    TIMESTAMPTZ,
    total_amount                    NUMERIC(18, 2) NOT NULL,
    currency_code                   CHAR(3) NOT NULL,
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brain.settlement_lines (
    settlement_id                   TEXT NOT NULL REFERENCES brain.settlements(settlement_id) ON DELETE CASCADE,
    line_hash                       TEXT NOT NULL,
    transaction_type                TEXT,
    posted_date                     TIMESTAMPTZ,
    amazon_order_id                 TEXT,
    sku                             TEXT,
    description                     TEXT,
    amount                          NUMERIC(18, 2),
    currency_code                   CHAR(3),
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    PRIMARY KEY (settlement_id, line_hash)
);

CREATE INDEX IF NOT EXISTS idx_settlement_lines_order
    ON brain.settlement_lines (amazon_order_id) WHERE amazon_order_id IS NOT NULL;

-- ============================================================================
-- brain.fba_inventory_snapshot   — scaffolded
-- Source: GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.fba_inventory_snapshot (
    snapshot_date                   DATE NOT NULL,
    marketplace_id                  TEXT NOT NULL,
    sku                             TEXT NOT NULL,
    fnsku                           TEXT,
    asin                            TEXT,
    product_name                    TEXT,
    condition                       TEXT,
    -- Amazon's inventory state buckets
    afn_listing_exists              BOOLEAN,
    afn_warehouse_quantity          INTEGER NOT NULL DEFAULT 0,
    afn_fulfillable_quantity        INTEGER NOT NULL DEFAULT 0,
    afn_unsellable_quantity         INTEGER NOT NULL DEFAULT 0,
    afn_reserved_quantity           INTEGER NOT NULL DEFAULT 0,
    afn_total_quantity              INTEGER NOT NULL DEFAULT 0,
    afn_inbound_working_quantity    INTEGER NOT NULL DEFAULT 0,
    afn_inbound_shipped_quantity    INTEGER NOT NULL DEFAULT 0,
    afn_inbound_receiving_quantity  INTEGER NOT NULL DEFAULT 0,
    afn_researching_quantity        INTEGER NOT NULL DEFAULT 0,
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snapshot_date, marketplace_id, sku)
);

-- ============================================================================
-- brain.fba_reserved_inventory   — scaffolded
-- Source: GET_RESERVED_INVENTORY_DATA
-- Three buckets reported separately: customer orders, FC transfers, FC processing.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.fba_reserved_inventory (
    snapshot_at                     TIMESTAMPTZ NOT NULL,
    marketplace_id                  TEXT NOT NULL,
    sku                             TEXT NOT NULL,
    fnsku                           TEXT,
    asin                            TEXT,
    reserved_qty_customer_orders    INTEGER NOT NULL DEFAULT 0,
    reserved_qty_fc_transfers       INTEGER NOT NULL DEFAULT 0,
    reserved_qty_fc_processing      INTEGER NOT NULL DEFAULT 0,
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (snapshot_at, marketplace_id, sku)
);

-- ============================================================================
-- brain.inventory_ledger_detail   — scaffolded
-- Source: GET_LEDGER_DETAIL_VIEW_DATA (18-month lookback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.inventory_ledger_detail (
    event_date                      DATE NOT NULL,
    marketplace_id                  TEXT NOT NULL,
    fnsku                           TEXT,
    asin                            TEXT,
    sku                             TEXT NOT NULL,
    title                           TEXT,
    event_type                      TEXT NOT NULL,                              -- Receipts, CustomerShipments, CustomerReturns, etc.
    reference_id                    TEXT NOT NULL,                              -- shipment ID / order ID / etc.
    quantity                        INTEGER NOT NULL,
    fulfillment_center              TEXT,
    disposition                     TEXT,
    reason                          TEXT,
    country                         CHAR(2),
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_date, marketplace_id, sku, event_type, reference_id)
);

-- ============================================================================
-- brain.fba_returns   — scaffolded
-- Source: GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA
-- Physical returns. Does not 1:1 reconcile with refund events.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.fba_returns (
    return_date                     DATE NOT NULL,
    order_id                        TEXT NOT NULL,
    sku                             TEXT NOT NULL,
    fnsku                           TEXT NOT NULL,
    asin                            TEXT,
    product_name                    TEXT,
    quantity                        INTEGER NOT NULL,
    fulfillment_center_id           TEXT,
    detailed_disposition            TEXT,                                       -- Sellable, Defective, CustomerDamaged, etc.
    reason                          TEXT,
    status                          TEXT,
    license_plate_number            TEXT,
    customer_comments               TEXT,
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (return_date, order_id, sku, fnsku)
);

-- ============================================================================
-- brain.catalog_items   — scaffolded
-- Source: getCatalogItem (Catalog Items API v2022-04-01)
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.catalog_items (
    marketplace_id                  TEXT NOT NULL,
    asin                            TEXT NOT NULL,
    item_name                       TEXT,
    brand                           TEXT,
    manufacturer                    TEXT,
    classification                  TEXT,
    item_classification             TEXT,
    main_image_url                  TEXT,
    -- Free-form attributes captured as JSONB so we don't lose anything.
    attributes                      JSONB,
    relationships                   JSONB,
    sales_ranks                     JSONB,
    raw_id                          BIGINT REFERENCES raw.sp_api_event(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, asin)
);

-- ============================================================================
-- brain.listings_items   — scaffolded
-- Source: getListingsItem (Listings Items API)
-- Your offers, including the SKU↔ASIN mapping.
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.listings_items (
    marketplace_id                  TEXT NOT NULL,
    seller_sku                      TEXT NOT NULL,
    asin                            TEXT,
    item_name                       TEXT,
    listing_status                  TEXT,
    fulfillment_availability        JSONB,
    issues                          JSONB,
    attributes                      JSONB,
    raw_id                          BIGINT REFERENCES raw.sp_api_event(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, seller_sku)
);

CREATE INDEX IF NOT EXISTS idx_listings_asin
    ON brain.listings_items (asin) WHERE asin IS NOT NULL;

-- ============================================================================
-- brain.search_query_performance   — scaffolded
-- Source: GET_BRAND_ANALYTICS_SEARCH_QUERY_PERFORMANCE_REPORT
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.search_query_performance (
    period_type                     TEXT NOT NULL CHECK (period_type IN ('WEEK', 'MONTH', 'QUARTER')),
    period_start                    DATE NOT NULL,
    period_end                      DATE NOT NULL,
    asin                            TEXT NOT NULL,
    search_query                    TEXT NOT NULL,
    search_query_score              NUMERIC(10, 4),
    search_query_volume             BIGINT,
    impressions                     BIGINT,
    clicks                          BIGINT,
    cart_adds                       BIGINT,
    purchases                       BIGINT,
    impression_share                NUMERIC(7, 4),
    click_share                     NUMERIC(7, 4),
    cart_add_share                  NUMERIC(7, 4),
    purchase_share                  NUMERIC(7, 4),
    raw_id                          BIGINT REFERENCES raw.sp_api_report(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (period_type, period_start, asin, search_query)
);

-- ============================================================================
-- brain.subscribe_save_offers   — scaffolded
-- Source: Replenishment API
-- ============================================================================
CREATE TABLE IF NOT EXISTS brain.subscribe_save_offers (
    marketplace_id                  TEXT NOT NULL,
    offer_id                        TEXT NOT NULL,
    snapshot_date                   DATE NOT NULL,
    asin                            TEXT,
    sku                             TEXT,
    is_active                       BOOLEAN,
    eligibility_status              TEXT,
    discount_percent                NUMERIC(5, 2),
    metrics                         JSONB,
    raw_id                          BIGINT REFERENCES raw.sp_api_event(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, offer_id, snapshot_date)
);

-- ============================================================================
-- brain.ads_sp_daily / sb_daily / sd_daily   — scaffolded
-- Source: Amazon Ads API v3 (separate OAuth from SP-API)
-- ============================================================================
-- ads_*_daily tables use a deterministic `entity_key` column for the PK
-- because Postgres doesn't allow expressions inside PRIMARY KEY constraints.
-- entity_key is set at insert time as: COALESCE(target_id, keyword_id, asin, sku, 'campaign')
CREATE TABLE IF NOT EXISTS brain.ads_sp_daily (
    metric_date                     DATE NOT NULL,
    profile_id                      TEXT NOT NULL,
    campaign_id                     TEXT NOT NULL,
    ad_group_id                     TEXT NOT NULL DEFAULT '',
    entity_key                      TEXT NOT NULL,                              -- target_id, keyword_id, asin, sku, or 'campaign'
    keyword_id                      TEXT,
    target_id                       TEXT,
    asin                            TEXT,
    sku                             TEXT,
    impressions                     BIGINT NOT NULL DEFAULT 0,
    clicks                          BIGINT NOT NULL DEFAULT 0,
    cost                            NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sales_1d                        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sales_7d                        NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sales_14d                       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    sales_30d                       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    units_sold_1d                   INTEGER NOT NULL DEFAULT 0,
    units_sold_7d                   INTEGER NOT NULL DEFAULT 0,
    units_sold_14d                  INTEGER NOT NULL DEFAULT 0,
    units_sold_30d                  INTEGER NOT NULL DEFAULT 0,
    currency_code                   CHAR(3),
    raw_id                          BIGINT,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (metric_date, campaign_id, ad_group_id, entity_key)
);

CREATE INDEX IF NOT EXISTS idx_ads_sp_asin ON brain.ads_sp_daily (asin) WHERE asin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ads_sp_sku  ON brain.ads_sp_daily (sku)  WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS brain.ads_sb_daily (LIKE brain.ads_sp_daily INCLUDING ALL);
CREATE TABLE IF NOT EXISTS brain.ads_sd_daily (LIKE brain.ads_sp_daily INCLUDING ALL);

INSERT INTO meta.migration_history (filename) VALUES ('0003_brain_amazon.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

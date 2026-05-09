-- ============================================================================
-- 0001_meta_schema.sql
-- The operator-datacore "meta" schema: connection profiles, sync state,
-- error log, FX rates, attendee config, migration history.
--
-- Plain English: this schema is the wiring diagram for the database.
-- Nothing here is your business data; everything here describes how your
-- business data flows in.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS meta;

COMMENT ON SCHEMA meta IS
'Wiring diagram: connection profiles, sync state, error log, FX rates, migration history. No business data.';

-- Required extensions ---------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- for gen_random_uuid + secret hashing
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ----------------------------------------------------------------------------
-- meta.migration_history
-- Tracks which migrations have been applied. Idempotent.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.migration_history (
    id              SERIAL PRIMARY KEY,
    filename        TEXT NOT NULL UNIQUE,
    checksum        TEXT,
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by      TEXT NOT NULL DEFAULT CURRENT_USER
);

COMMENT ON TABLE meta.migration_history IS
'Which migration files have been applied to this database, when, and by whom.';

-- ----------------------------------------------------------------------------
-- meta.config
-- Single-row table for attendee-level configuration. Keep it small.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.config (
    id                      INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    operator_name           TEXT,
    operator_email          TEXT,
    reporting_currency      CHAR(3) NOT NULL DEFAULT 'USD',
    rollup_timezone         TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    backfill_months_default INTEGER NOT NULL DEFAULT 24 CHECK (backfill_months_default BETWEEN 1 AND 36),
    installed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes                   TEXT
);

INSERT INTO meta.config (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMENT ON TABLE meta.config IS
'Single-row attendee configuration. The reporting currency, rollup timezone, and default backfill window live here.';

-- ----------------------------------------------------------------------------
-- meta.connection
-- One row per connected source (Amazon SP-API per region, TikTok per shop,
-- Shopify per store, Google Workspace per OAuth grant).
--
-- Secrets are NEVER stored in plaintext here. The actual refresh token /
-- access token / client secret lives in your .env file (or, in production,
-- in Supabase Vault / a secret manager). We store a hash for audit only.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.connection (
    connection_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source              TEXT NOT NULL CHECK (source IN ('amazon_sp_api', 'tiktok_shop', 'shopify', 'google_workspace', 'amazon_ads')),
    label               TEXT NOT NULL,                              -- 'amazon-us', 'amazon-uk', 'shopify-craftikit', etc.
    region              TEXT,                                       -- 'na', 'eu', 'fe' for Amazon; null otherwise
    marketplace_ids     TEXT[],                                     -- Amazon marketplace IDs covered by this connection
    auth_method         TEXT NOT NULL DEFAULT 'lwa_refresh_token',
    refresh_token_hash  TEXT,                                       -- sha256 of the refresh token, for rotation audit only
    expires_at          TIMESTAMPTZ,                                -- LWA refresh tokens are ~12 months
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'error')),
    last_health_check_at TIMESTAMPTZ,
    last_health_check_ok BOOLEAN,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source, label)
);

CREATE INDEX IF NOT EXISTS idx_connection_source_status
    ON meta.connection (source, status);

COMMENT ON TABLE meta.connection IS
'One row per connected data source. Refresh tokens are hashed for audit only — actual secrets live in .env or Supabase Vault.';

-- ----------------------------------------------------------------------------
-- meta.sync_run
-- One row per sync attempt. Captures what was synced, what window, what
-- happened, and how to retry.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.sync_run (
    sync_run_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id   UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    source          TEXT NOT NULL,
    object          TEXT NOT NULL,                                  -- 'sales_traffic_report', 'orders', 'financial_events', etc.
    mode            TEXT NOT NULL CHECK (mode IN ('backfill', 'incremental', 'manual', 'verification')),
    window_start    TIMESTAMPTZ,
    window_end      TIMESTAMPTZ,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed', 'cancelled')),
    rows_fetched    BIGINT,
    rows_upserted   BIGINT,
    error_message   TEXT,
    error_payload   JSONB,
    next_cursor     JSONB,                                          -- whatever you need to resume (report_id, last_updated_after, etc.)
    duration_ms     INTEGER GENERATED ALWAYS AS (
                        CASE
                            WHEN finished_at IS NULL THEN NULL
                            ELSE (EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000)::INTEGER
                        END
                    ) STORED
);

CREATE INDEX IF NOT EXISTS idx_sync_run_connection_started
    ON meta.sync_run (connection_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_run_object_status
    ON meta.sync_run (object, status, started_at DESC);

COMMENT ON TABLE meta.sync_run IS
'One row per sync attempt. The single source of truth for "is my data fresh?" and "did the last run fail?".';

-- ----------------------------------------------------------------------------
-- meta.sync_log
-- Verbose, line-level events from a sync run. Truncate aggressively (90 day
-- retention is fine for most operators).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.sync_log (
    log_id          BIGSERIAL PRIMARY KEY,
    sync_run_id     UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE CASCADE,
    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level           TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message         TEXT NOT NULL,
    payload         JSONB
);

CREATE INDEX IF NOT EXISTS idx_sync_log_run_logged
    ON meta.sync_log (sync_run_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_level_logged
    ON meta.sync_log (level, logged_at DESC) WHERE level IN ('warn', 'error');

COMMENT ON TABLE meta.sync_log IS
'Verbose log lines from each sync run. Useful when debugging; safe to truncate to 90 days.';

-- ----------------------------------------------------------------------------
-- meta.fx_rates
-- Daily exchange rates from each marketplace native currency to the
-- reporting currency. Populated by a homework Edge Function (see
-- docs/homework/fx-rates.md). v1 ships the table + a manual seed for USD.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.fx_rates (
    rate_date       DATE NOT NULL,
    base_currency   CHAR(3) NOT NULL,
    quote_currency  CHAR(3) NOT NULL,
    rate            NUMERIC(18, 8) NOT NULL,
    source          TEXT NOT NULL DEFAULT 'manual',
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (rate_date, base_currency, quote_currency)
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_quote_date
    ON meta.fx_rates (quote_currency, rate_date DESC);

COMMENT ON TABLE meta.fx_rates IS
'Daily FX rates. base_currency=USD, quote_currency=USD, rate=1 is seeded so analytics views never return null for US-only sellers.';

INSERT INTO meta.fx_rates (rate_date, base_currency, quote_currency, rate, source)
SELECT d::date, 'USD', 'USD', 1.0, 'seed'
FROM generate_series(
    (CURRENT_DATE - INTERVAL '36 months')::date,
    CURRENT_DATE,
    '1 day'::interval
) d
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- meta.marketplace
-- Reference table for Amazon marketplaces. Pre-populated.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.marketplace (
    marketplace_id      TEXT PRIMARY KEY,
    region              TEXT NOT NULL,
    country_code        CHAR(2) NOT NULL,
    country_name        TEXT NOT NULL,
    native_currency     CHAR(3) NOT NULL,
    accounting_timezone TEXT NOT NULL,
    seller_central_url  TEXT
);

INSERT INTO meta.marketplace (marketplace_id, region, country_code, country_name, native_currency, accounting_timezone, seller_central_url) VALUES
    ('ATVPDKIKX0DER', 'na', 'US', 'United States',     'USD', 'America/Los_Angeles', 'https://sellercentral.amazon.com'),
    ('A2EUQ1WTGCTBG2', 'na', 'CA', 'Canada',           'CAD', 'America/Los_Angeles', 'https://sellercentral.amazon.ca'),
    ('A1AM78C64UM0Y8', 'na', 'MX', 'Mexico',           'MXN', 'America/Los_Angeles', 'https://sellercentral.amazon.com.mx'),
    ('A2Q3Y263D00KWC', 'na', 'BR', 'Brazil',           'BRL', 'America/Sao_Paulo',   'https://sellercentral.amazon.com.br'),
    ('A1F83G8C2ARO7P', 'eu', 'GB', 'United Kingdom',   'GBP', 'Europe/London',       'https://sellercentral.amazon.co.uk'),
    ('A1PA6795UKMFR9', 'eu', 'DE', 'Germany',          'EUR', 'Europe/Berlin',       'https://sellercentral.amazon.de'),
    ('A13V1IB3VIYZZH', 'eu', 'FR', 'France',           'EUR', 'Europe/Paris',        'https://sellercentral.amazon.fr'),
    ('APJ6JRA9NG5V4',  'eu', 'IT', 'Italy',            'EUR', 'Europe/Rome',         'https://sellercentral.amazon.it'),
    ('A1RKKUPIHCS9HS', 'eu', 'ES', 'Spain',            'EUR', 'Europe/Madrid',       'https://sellercentral.amazon.es'),
    ('A1805IZSGTT6HS', 'eu', 'NL', 'Netherlands',      'EUR', 'Europe/Amsterdam',    'https://sellercentral.amazon.nl'),
    ('A2NODRKZP88ZB9', 'eu', 'SE', 'Sweden',           'SEK', 'Europe/Stockholm',    'https://sellercentral.amazon.se'),
    ('A1C3SOZRARQ6R3', 'eu', 'PL', 'Poland',           'PLN', 'Europe/Warsaw',       'https://sellercentral.amazon.pl'),
    ('A33AVAJ2PDY3EV', 'eu', 'TR', 'Turkey',           'TRY', 'Europe/Istanbul',     'https://sellercentral.amazon.com.tr'),
    ('A2VIGQ35RCS4UG', 'eu', 'AE', 'United Arab Emirates', 'AED', 'Asia/Dubai',      'https://sellercentral.amazon.ae'),
    ('A21TJRUUN4KGV',  'eu', 'IN', 'India',            'INR', 'Asia/Kolkata',        'https://sellercentral.amazon.in'),
    ('ARBP9OOSHTCHU',  'eu', 'EG', 'Egypt',            'EGP', 'Africa/Cairo',        'https://sellercentral.amazon.eg'),
    ('A17E79C6D8DWNP', 'eu', 'SA', 'Saudi Arabia',     'SAR', 'Asia/Riyadh',         'https://sellercentral.amazon.sa'),
    ('A1VC38T7YXB528', 'fe', 'JP', 'Japan',            'JPY', 'Asia/Tokyo',          'https://sellercentral.amazon.co.jp'),
    ('A39IBJ37TRP1C6', 'fe', 'AU', 'Australia',        'AUD', 'Australia/Sydney',    'https://sellercentral.amazon.com.au'),
    ('A19VAU5U5O7RUS', 'fe', 'SG', 'Singapore',        'SGD', 'Asia/Singapore',      'https://sellercentral.amazon.sg')
ON CONFLICT (marketplace_id) DO UPDATE SET
    native_currency = EXCLUDED.native_currency,
    accounting_timezone = EXCLUDED.accounting_timezone,
    seller_central_url = EXCLUDED.seller_central_url;

COMMENT ON TABLE meta.marketplace IS
'Reference table: every Amazon marketplace ID, region, native currency, and accounting timezone. Pre-seeded.';

-- ----------------------------------------------------------------------------
-- meta.report_catalog
-- Maps every metric we care about to the SP-API report that owns it
-- canonically. This is the in-database version of docs/canonical-reports.md.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.report_catalog (
    metric_name             TEXT PRIMARY KEY,
    canonical_source        TEXT NOT NULL,                          -- 'sp_api_report', 'sp_api_endpoint', 'ads_api_report'
    canonical_identifier    TEXT NOT NULL,                          -- e.g. 'GET_SALES_AND_TRAFFIC_REPORT'
    landing_table           TEXT,                                   -- e.g. 'brain.sales_traffic_daily'
    refresh_cadence         TEXT NOT NULL,                          -- 'daily', 'hourly', '15m', etc.
    typical_lag             TEXT,
    activated_in_v1         BOOLEAN NOT NULL DEFAULT FALSE,
    notes                   TEXT
);

INSERT INTO meta.report_catalog (metric_name, canonical_source, canonical_identifier, landing_table, refresh_cadence, typical_lag, activated_in_v1, notes) VALUES
    ('revenue_units_sessions',  'sp_api_report',  'GET_SALES_AND_TRAFFIC_REPORT',                                'brain.sales_traffic_daily',     'daily',   '24-48h',  TRUE,  'Brand Analytics required. The canonical revenue source. Same numbers as Seller Central Business Reports.'),
    ('orders',                  'sp_api_report',  'GET_FLAT_FILE_ALL_ORDERS_DATA_BY_LAST_UPDATE_GENERAL',        'brain.orders',                  'hourly',  '30-60min', FALSE, 'Use BY_LAST_UPDATE for ingestion to catch status changes. PII stripped — use Orders API + RDT for buyer info.'),
    ('financial_events',        'sp_api_endpoint','listFinancialEvents',                                          'brain.financial_events',        'hourly',  '24-48h',  FALSE, 'Fees arrive negative — flip signs at parser. Chunk to 7-day windows; longer windows truncate silently.'),
    ('settlements',             'sp_api_report',  'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2',                  'brain.settlements',             'on_amazon_schedule', '14d rolling', FALSE, 'Cannot be requested. Listed and pulled as Amazon generates them.'),
    ('fba_inventory_snapshot',  'sp_api_report',  'GET_FBA_MYI_UNSUPPRESSED_INVENTORY_DATA',                     'brain.fba_inventory_snapshot',  '6h',      '6h',      FALSE, 'Pair with the inventory ledger for reconciliation.'),
    ('fba_reserved_inventory',  'sp_api_report',  'GET_RESERVED_INVENTORY_DATA',                                  'brain.fba_reserved_inventory',  '30m',     '15-60min',FALSE, 'Three buckets: customer orders, FC transfers, FC processing. Don''t sum.'),
    ('inventory_ledger_detail', 'sp_api_report',  'GET_LEDGER_DETAIL_VIEW_DATA',                                  'brain.inventory_ledger_detail', 'daily',   '24h',     FALSE, '18-month lookback ceiling.'),
    ('fba_returns',             'sp_api_report',  'GET_FBA_FULFILLMENT_CUSTOMER_RETURNS_DATA',                    'brain.fba_returns',             'daily',   '24h',     FALSE, 'Physical returns. Does not 1:1 reconcile with refund events.'),
    ('catalog_items',           'sp_api_endpoint','getCatalogItem',                                               'brain.catalog_items',           'on_demand','realtime', FALSE, 'Cache aggressively, 24-72h TTL.'),
    ('listings_items',          'sp_api_endpoint','getListingsItem',                                              'brain.listings_items',          'daily',   'realtime', FALSE, 'Your offers, your SKU↔ASIN mapping.'),
    ('search_query_performance','sp_api_report',  'GET_BRAND_ANALYTICS_SEARCH_QUERY_PERFORMANCE_REPORT',         'brain.search_query_performance','weekly',  '1 week',  FALSE, '17-month monthly lookback. JSON output. One period per call.'),
    ('subscribe_save',          'sp_api_endpoint','listOffers (Replenishment)',                                    'brain.subscribe_save_offers',   'daily',   '24h',     FALSE, 'Not in Reports API. Separate REST endpoint.'),
    ('ads_sponsored_products',  'ads_api_report', 'spAdvertisedProduct',                                          'brain.ads_sp_daily',            'daily',   '24-48h',  FALSE, 'Amazon Ads API v3, separate OAuth from SP-API. 95-day lookback ceiling.'),
    ('ads_sponsored_brands',    'ads_api_report', 'sbPurchasedProduct',                                           'brain.ads_sb_daily',            'daily',   '24-48h',  FALSE, 'Amazon Ads API v3.'),
    ('ads_sponsored_display',   'ads_api_report', 'sdAdvertisedProduct',                                          'brain.ads_sd_daily',            'daily',   '24-48h',  FALSE, 'Amazon Ads API v3.')
ON CONFLICT (metric_name) DO UPDATE SET
    canonical_identifier = EXCLUDED.canonical_identifier,
    landing_table = EXCLUDED.landing_table,
    refresh_cadence = EXCLUDED.refresh_cadence,
    activated_in_v1 = EXCLUDED.activated_in_v1,
    notes = EXCLUDED.notes;

COMMENT ON TABLE meta.report_catalog IS
'The metric ownership map: which SP-API report or endpoint is canonical for which business metric. Source of truth for "no reconstruction" rule.';

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION meta.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_updated_at ON meta.connection;
CREATE TRIGGER trg_connection_updated_at
    BEFORE UPDATE ON meta.connection
    FOR EACH ROW EXECUTE FUNCTION meta.set_updated_at();

-- ----------------------------------------------------------------------------
-- Record this migration
-- ----------------------------------------------------------------------------
INSERT INTO meta.migration_history (filename) VALUES ('0001_meta_schema.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

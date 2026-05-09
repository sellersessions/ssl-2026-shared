-- ============================================================================
-- 0002_raw_schema.sql
-- The "raw" schema: every API response lands here as JSONB before parsing.
--
-- Plain English: when the connector pulls data from Amazon (or TikTok, or
-- Shopify, or Google), the response gets stored here unchanged. We then
-- parse it into the brain.* tables. Two big benefits:
--   1. If the parser has a bug, we can re-parse without re-fetching.
--   2. There's an audit trail of exactly what Amazon sent us.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS raw;

COMMENT ON SCHEMA raw IS
'Landing zone. Every API response stored as JSONB before parsing. Re-parsable, auditable.';

-- ----------------------------------------------------------------------------
-- raw.sp_api_report
-- One row per SP-API report document successfully fetched.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw.sp_api_report (
    raw_id              BIGSERIAL PRIMARY KEY,
    connection_id       UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    sync_run_id         UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE SET NULL,
    report_type         TEXT NOT NULL,                              -- e.g. 'GET_SALES_AND_TRAFFIC_REPORT'
    report_id           TEXT NOT NULL,                              -- Amazon's report ID
    document_id         TEXT,
    marketplace_ids     TEXT[],
    data_start_time     TIMESTAMPTZ,
    data_end_time       TIMESTAMPTZ,
    processing_status   TEXT,                                       -- DONE, CANCELLED, FATAL, etc.
    payload             JSONB NOT NULL,                             -- the parsed report content (CSV → array of rows, or JSON as-is)
    payload_checksum    TEXT,
    payload_bytes       INTEGER,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at           TIMESTAMPTZ,
    parse_error         TEXT,
    UNIQUE (report_type, report_id)
);

CREATE INDEX IF NOT EXISTS idx_raw_sp_api_report_type_window
    ON raw.sp_api_report (report_type, data_start_time, data_end_time);
CREATE INDEX IF NOT EXISTS idx_raw_sp_api_report_unparsed
    ON raw.sp_api_report (report_type, fetched_at)
    WHERE parsed_at IS NULL;

COMMENT ON TABLE raw.sp_api_report IS
'One row per SP-API report document. Payload is the parsed report (CSV rows as JSON array, or JSON). Re-parsable.';

-- ----------------------------------------------------------------------------
-- raw.sp_api_event
-- One row per page of API events (Finances API, etc.) that aren't reports.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw.sp_api_event (
    raw_id              BIGSERIAL PRIMARY KEY,
    connection_id       UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    sync_run_id         UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE SET NULL,
    endpoint            TEXT NOT NULL,                              -- e.g. 'listFinancialEvents'
    request_params      JSONB,
    response_payload    JSONB NOT NULL,
    next_token          TEXT,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at           TIMESTAMPTZ,
    parse_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_raw_sp_api_event_endpoint_fetched
    ON raw.sp_api_event (endpoint, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_sp_api_event_unparsed
    ON raw.sp_api_event (endpoint, fetched_at)
    WHERE parsed_at IS NULL;

-- ----------------------------------------------------------------------------
-- raw.tiktok_payload, raw.shopify_payload, raw.google_drive_payload
-- Scaffolded for v2 connectors. Same shape: connection + endpoint + payload.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw.tiktok_payload (
    raw_id              BIGSERIAL PRIMARY KEY,
    connection_id       UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    sync_run_id         UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE SET NULL,
    endpoint            TEXT NOT NULL,
    request_params      JSONB,
    response_payload    JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at           TIMESTAMPTZ,
    parse_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_raw_tiktok_endpoint_fetched
    ON raw.tiktok_payload (endpoint, fetched_at DESC);

CREATE TABLE IF NOT EXISTS raw.shopify_payload (
    raw_id              BIGSERIAL PRIMARY KEY,
    connection_id       UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    sync_run_id         UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE SET NULL,
    endpoint            TEXT NOT NULL,
    request_params      JSONB,
    response_payload    JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at           TIMESTAMPTZ,
    parse_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_raw_shopify_endpoint_fetched
    ON raw.shopify_payload (endpoint, fetched_at DESC);

CREATE TABLE IF NOT EXISTS raw.google_drive_payload (
    raw_id              BIGSERIAL PRIMARY KEY,
    connection_id       UUID NOT NULL REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    sync_run_id         UUID REFERENCES meta.sync_run(sync_run_id) ON DELETE SET NULL,
    endpoint            TEXT NOT NULL,
    request_params      JSONB,
    response_payload    JSONB NOT NULL,
    fetched_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    parsed_at           TIMESTAMPTZ,
    parse_error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_raw_google_drive_endpoint_fetched
    ON raw.google_drive_payload (endpoint, fetched_at DESC);

INSERT INTO meta.migration_history (filename) VALUES ('0002_raw_schema.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

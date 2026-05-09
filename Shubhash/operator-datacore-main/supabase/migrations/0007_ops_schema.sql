-- ============================================================================
-- 0007_ops_schema.sql
-- The "ops" schema: rollups, computed daily/weekly/monthly from brain.*.
--
-- HARD RULE (memory: feedback_same_day_partial_rollup.md): every rollup
-- function must filter `metric_date < CURRENT_DATE` so partial same-day
-- data never freezes as a historical total.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS ops;

COMMENT ON SCHEMA ops IS
'Operational rollups computed from brain.*. Daily/weekly/monthly. Always excludes CURRENT_DATE.';

-- ----------------------------------------------------------------------------
-- ops.amazon_daily_summary
-- One row per (marketplace, date), summing the canonical S&T metrics.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ops.amazon_daily_summary (
    marketplace_id                  TEXT NOT NULL,
    metric_date                     DATE NOT NULL,
    currency_code                   CHAR(3) NOT NULL,
    -- Revenue
    ordered_product_sales           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    ordered_product_sales_b2b       NUMERIC(18, 2) NOT NULL DEFAULT 0,
    -- Units
    units_ordered                   INTEGER NOT NULL DEFAULT 0,
    units_ordered_b2b               INTEGER NOT NULL DEFAULT 0,
    -- Traffic
    sessions                        INTEGER NOT NULL DEFAULT 0,
    sessions_b2b                    INTEGER NOT NULL DEFAULT 0,
    page_views                      INTEGER NOT NULL DEFAULT 0,
    page_views_b2b                  INTEGER NOT NULL DEFAULT 0,
    -- Conversion (weighted by sessions)
    weighted_unit_session_pct       NUMERIC(7, 4),
    -- Counts for context
    distinct_asins                  INTEGER NOT NULL DEFAULT 0,
    distinct_skus                   INTEGER NOT NULL DEFAULT 0,
    -- When this rollup was last computed
    computed_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_ops_amz_daily_date
    ON ops.amazon_daily_summary (metric_date DESC);

COMMENT ON TABLE ops.amazon_daily_summary IS
'One row per marketplace per completed day. Computed from brain.sales_traffic_daily. Never includes today.';

-- ----------------------------------------------------------------------------
-- ops.amazon_daily_by_asin
-- Rollup at child ASIN granularity (one of the most queried surfaces).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ops.amazon_daily_by_asin (
    marketplace_id                  TEXT NOT NULL,
    metric_date                     DATE NOT NULL,
    parent_asin                     TEXT NOT NULL,
    child_asin                      TEXT NOT NULL,
    currency_code                   CHAR(3) NOT NULL,
    ordered_product_sales           NUMERIC(18, 2) NOT NULL DEFAULT 0,
    units_ordered                   INTEGER NOT NULL DEFAULT 0,
    sessions                        INTEGER NOT NULL DEFAULT 0,
    page_views                      INTEGER NOT NULL DEFAULT 0,
    unit_session_percentage         NUMERIC(7, 4),
    buy_box_percentage              NUMERIC(7, 4),
    computed_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (marketplace_id, metric_date, child_asin)
);

CREATE INDEX IF NOT EXISTS idx_ops_amz_asin_date_revenue
    ON ops.amazon_daily_by_asin (metric_date DESC, ordered_product_sales DESC);
CREATE INDEX IF NOT EXISTS idx_ops_amz_asin_parent
    ON ops.amazon_daily_by_asin (parent_asin, metric_date DESC);

-- ----------------------------------------------------------------------------
-- ops.refresh_amazon_daily()
-- Idempotent rollup function. Always filters metric_date < CURRENT_DATE
-- (in the marketplace's accounting timezone, defaulted to LA).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION ops.refresh_amazon_daily(
    p_from_date DATE DEFAULT NULL,
    p_to_date   DATE DEFAULT NULL
) RETURNS TABLE (rollup_table TEXT, rows_affected BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_from DATE;
    v_to   DATE;
    v_summary_rows BIGINT;
    v_asin_rows    BIGINT;
BEGIN
    -- Default window: last 60 completed days. Caller can override.
    v_from := COALESCE(p_from_date, CURRENT_DATE - INTERVAL '60 days');
    v_to   := COALESCE(p_to_date,   CURRENT_DATE - INTERVAL '1 day');

    -- HARD GUARD: never roll up CURRENT_DATE.
    IF v_to >= CURRENT_DATE THEN
        v_to := CURRENT_DATE - INTERVAL '1 day';
    END IF;

    -- Marketplace summary
    INSERT INTO ops.amazon_daily_summary (
        marketplace_id, metric_date, currency_code,
        ordered_product_sales, ordered_product_sales_b2b,
        units_ordered, units_ordered_b2b,
        sessions, sessions_b2b,
        page_views, page_views_b2b,
        weighted_unit_session_pct,
        distinct_asins, distinct_skus,
        computed_at
    )
    SELECT
        marketplace_id,
        metric_date,
        currency_code,
        SUM(ordered_product_sales),
        SUM(ordered_product_sales_b2b),
        SUM(units_ordered),
        SUM(units_ordered_b2b),
        SUM(sessions),
        SUM(sessions_b2b),
        SUM(page_views),
        SUM(page_views_b2b),
        CASE WHEN SUM(sessions) > 0
             THEN SUM(units_ordered)::NUMERIC / NULLIF(SUM(sessions), 0)
             ELSE NULL END,
        COUNT(DISTINCT child_asin),
        COUNT(DISTINCT sku),
        NOW()
    FROM brain.sales_traffic_daily
    WHERE metric_date BETWEEN v_from AND v_to
      AND metric_date < CURRENT_DATE
    GROUP BY marketplace_id, metric_date, currency_code
    ON CONFLICT (marketplace_id, metric_date) DO UPDATE SET
        currency_code              = EXCLUDED.currency_code,
        ordered_product_sales      = EXCLUDED.ordered_product_sales,
        ordered_product_sales_b2b  = EXCLUDED.ordered_product_sales_b2b,
        units_ordered              = EXCLUDED.units_ordered,
        units_ordered_b2b          = EXCLUDED.units_ordered_b2b,
        sessions                   = EXCLUDED.sessions,
        sessions_b2b               = EXCLUDED.sessions_b2b,
        page_views                 = EXCLUDED.page_views,
        page_views_b2b             = EXCLUDED.page_views_b2b,
        weighted_unit_session_pct  = EXCLUDED.weighted_unit_session_pct,
        distinct_asins             = EXCLUDED.distinct_asins,
        distinct_skus              = EXCLUDED.distinct_skus,
        computed_at                = NOW();

    GET DIAGNOSTICS v_summary_rows = ROW_COUNT;

    -- ASIN-level
    INSERT INTO ops.amazon_daily_by_asin (
        marketplace_id, metric_date, parent_asin, child_asin, currency_code,
        ordered_product_sales, units_ordered, sessions, page_views,
        unit_session_percentage, buy_box_percentage, computed_at
    )
    SELECT
        marketplace_id, metric_date, parent_asin, child_asin, currency_code,
        SUM(ordered_product_sales),
        SUM(units_ordered),
        SUM(sessions),
        SUM(page_views),
        AVG(unit_session_percentage),
        AVG(buy_box_percentage),
        NOW()
    FROM brain.sales_traffic_daily
    WHERE metric_date BETWEEN v_from AND v_to
      AND metric_date < CURRENT_DATE
    GROUP BY marketplace_id, metric_date, parent_asin, child_asin, currency_code
    ON CONFLICT (marketplace_id, metric_date, child_asin) DO UPDATE SET
        parent_asin              = EXCLUDED.parent_asin,
        currency_code            = EXCLUDED.currency_code,
        ordered_product_sales    = EXCLUDED.ordered_product_sales,
        units_ordered            = EXCLUDED.units_ordered,
        sessions                 = EXCLUDED.sessions,
        page_views               = EXCLUDED.page_views,
        unit_session_percentage  = EXCLUDED.unit_session_percentage,
        buy_box_percentage       = EXCLUDED.buy_box_percentage,
        computed_at              = NOW();

    GET DIAGNOSTICS v_asin_rows = ROW_COUNT;

    RETURN QUERY VALUES
        ('ops.amazon_daily_summary'::TEXT, v_summary_rows),
        ('ops.amazon_daily_by_asin'::TEXT, v_asin_rows);
END;
$$;

COMMENT ON FUNCTION ops.refresh_amazon_daily(DATE, DATE) IS
'Idempotent rollup of brain.sales_traffic_daily into ops tables. Always filters metric_date < CURRENT_DATE.';

INSERT INTO meta.migration_history (filename) VALUES ('0007_ops_schema.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

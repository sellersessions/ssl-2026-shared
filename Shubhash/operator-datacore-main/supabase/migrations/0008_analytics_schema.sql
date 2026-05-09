-- ============================================================================
-- 0008_analytics_schema.sql
-- The "analytics" schema: BI views with FX conversion to a single reporting
-- currency. This is what dashboards (Metabase, Looker, Hex, your own) read.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS analytics;

COMMENT ON SCHEMA analytics IS
'BI views. Currency-converted, cross-marketplace, opinionated. Dashboards read from here.';

-- ----------------------------------------------------------------------------
-- analytics.fx_lookup(rate_date, from_currency, to_currency)
-- Returns the most recent rate at or before the requested date. Falls back
-- to 1.0 when from = to.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION analytics.fx_lookup(
    p_rate_date     DATE,
    p_from_currency CHAR(3),
    p_to_currency   CHAR(3)
) RETURNS NUMERIC
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_rate NUMERIC;
BEGIN
    IF p_from_currency = p_to_currency THEN
        RETURN 1.0;
    END IF;

    SELECT rate
    INTO v_rate
    FROM meta.fx_rates
    WHERE base_currency = p_from_currency
      AND quote_currency = p_to_currency
      AND rate_date <= p_rate_date
    ORDER BY rate_date DESC
    LIMIT 1;

    -- If we don't have a direct rate, try inverse (1 / opposite direction).
    IF v_rate IS NULL THEN
        SELECT 1.0 / NULLIF(rate, 0)
        INTO v_rate
        FROM meta.fx_rates
        WHERE base_currency = p_to_currency
          AND quote_currency = p_from_currency
          AND rate_date <= p_rate_date
        ORDER BY rate_date DESC
        LIMIT 1;
    END IF;

    RETURN v_rate;  -- may be NULL if no rate exists; caller should COALESCE.
END;
$$;

COMMENT ON FUNCTION analytics.fx_lookup(DATE, CHAR, CHAR) IS
'Most-recent FX rate on or before a date. Returns NULL if unknown — caller decides whether to surface or hide.';

-- ----------------------------------------------------------------------------
-- analytics.amazon_daily
-- The daily marketplace rollup, with native currency preserved AND a
-- reporting-currency conversion using the operator-configured currency.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.amazon_daily AS
WITH cfg AS (
    SELECT reporting_currency FROM meta.config WHERE id = 1
)
SELECT
    s.marketplace_id,
    m.country_code,
    m.country_name,
    s.metric_date,
    s.currency_code AS native_currency,
    cfg.reporting_currency,
    -- Native
    s.ordered_product_sales            AS revenue_native,
    s.ordered_product_sales_b2b        AS revenue_b2b_native,
    s.units_ordered,
    s.units_ordered_b2b,
    s.sessions,
    s.sessions_b2b,
    s.page_views,
    s.weighted_unit_session_pct        AS conversion_rate,
    -- Reporting currency (NULL if no FX rate is known — never invented)
    (s.ordered_product_sales * analytics.fx_lookup(s.metric_date, s.currency_code, cfg.reporting_currency)) AS revenue_reporting,
    (s.ordered_product_sales_b2b * analytics.fx_lookup(s.metric_date, s.currency_code, cfg.reporting_currency)) AS revenue_b2b_reporting,
    s.distinct_asins,
    s.distinct_skus,
    s.computed_at
FROM ops.amazon_daily_summary s
JOIN meta.marketplace m ON m.marketplace_id = s.marketplace_id
CROSS JOIN cfg;

COMMENT ON VIEW analytics.amazon_daily IS
'Daily Amazon rollup, native + reporting currency. NULL reporting figures mean "no FX rate available", never zero.';

-- ----------------------------------------------------------------------------
-- analytics.amazon_top_asins
-- Convenience: revenue and units by child ASIN over the last N days.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW analytics.amazon_top_asins AS
WITH cfg AS (
    SELECT reporting_currency FROM meta.config WHERE id = 1
),
last30 AS (
    SELECT *
    FROM ops.amazon_daily_by_asin
    WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
      AND metric_date < CURRENT_DATE
)
SELECT
    a.marketplace_id,
    a.parent_asin,
    a.child_asin,
    SUM(a.ordered_product_sales)                                                  AS revenue_native_30d,
    SUM(a.ordered_product_sales * analytics.fx_lookup(a.metric_date, a.currency_code, cfg.reporting_currency)) AS revenue_reporting_30d,
    SUM(a.units_ordered)                                                          AS units_30d,
    SUM(a.sessions)                                                               AS sessions_30d,
    SUM(a.page_views)                                                             AS page_views_30d,
    AVG(a.unit_session_percentage)                                                AS avg_conversion_30d,
    AVG(a.buy_box_percentage)                                                     AS avg_buy_box_30d,
    cfg.reporting_currency
FROM last30 a
CROSS JOIN cfg
GROUP BY a.marketplace_id, a.parent_asin, a.child_asin, cfg.reporting_currency;

COMMENT ON VIEW analytics.amazon_top_asins IS
'Top-line per child ASIN over the last 30 completed days. Sort and filter in your dashboard.';

INSERT INTO meta.migration_history (filename) VALUES ('0008_analytics_schema.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

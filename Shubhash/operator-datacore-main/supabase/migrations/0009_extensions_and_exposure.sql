-- ============================================================================
-- 0009_extensions_and_exposure.sql
-- Final pass: extensions used by scheduled syncs, plus a reminder note for
-- exposing schemas via PostgREST.
--
-- IMPORTANT (memory: deployment lessons): Supabase's PostgREST only sees
-- schemas listed in Settings → API → Exposed schemas. By default it sees
-- only `public`. Add `analytics` (and optionally `meta`, `ops`) so your
-- dashboards / Claude Code / scripts can read them via the REST API.
-- We do NOT expose `raw` or `brain` — those are internal.
-- ============================================================================

BEGIN;

-- pg_cron schedules the daily sync. pg_net lets cron jobs call Edge Functions
-- (or external HTTPS) without leaving the database.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Convenience: refresh_all() so the daily cron is one call.
CREATE OR REPLACE FUNCTION ops.refresh_all_daily()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM ops.refresh_amazon_daily();
    -- Future: PERFORM ops.refresh_tiktok_daily();
    -- Future: PERFORM ops.refresh_shopify_daily();
END;
$$;

COMMENT ON FUNCTION ops.refresh_all_daily() IS
'Single entry point for the daily rollup cron. Add per-source refresh_*_daily() calls here as connectors activate.';

-- Schedule: 14:30 UTC every day (after S&T data has landed).
-- Disable cleanly with: SELECT cron.unschedule('operator-datacore-daily');
SELECT cron.schedule(
    'operator-datacore-daily',
    '30 14 * * *',
    $$SELECT ops.refresh_all_daily();$$
);

-- ----------------------------------------------------------------------------
-- Schema exposure reminder (printed by `npm run smoke`)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION meta.exposed_schemas_check()
RETURNS TABLE (schema_name TEXT, recommended TEXT, currently_exposed BOOLEAN)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    -- This is best-effort: PostgREST exposure config lives in Supabase's
    -- internal settings, not in pg_catalog. We just list what *should* be
    -- exposed; the smoke test has the actual check via the REST API.
    RETURN QUERY
    SELECT 'analytics'::TEXT, 'expose'::TEXT, FALSE
    UNION ALL
    SELECT 'meta'::TEXT,      'expose'::TEXT, FALSE
    UNION ALL
    SELECT 'ops'::TEXT,       'optional'::TEXT, FALSE
    UNION ALL
    SELECT 'brain'::TEXT,     'do_not_expose'::TEXT, FALSE
    UNION ALL
    SELECT 'raw'::TEXT,       'do_not_expose'::TEXT, FALSE;
END;
$$;

INSERT INTO meta.migration_history (filename) VALUES ('0009_extensions_and_exposure.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

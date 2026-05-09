# supabase/functions/

This folder is reserved for Supabase Edge Functions, which give you scheduled outbound HTTPS from inside your Supabase project (the Postgres `pg_cron` extension can only run SQL).

**v1 deliberately ships zero Edge Functions.** Daily syncs run via:

- `npm run incremental` (manual, simplest)
- The `.github/workflows/daily-sync.yml` GitHub Actions workflow (hands-off after one-time secret setup)

If you want to deploy a Supabase Edge Function instead (e.g. to keep secrets inside your Supabase project), see the homework runbook: [docs/homework/edge-functions.md](../../docs/homework/edge-functions.md) (TBC).

## Why deferred to homework

Edge Functions add a deployment step every attendee must execute on their own Supabase project. That's another failure point during a 75-minute workshop. GitHub Actions or manual `npm run incremental` work today, are easier to debug, and don't change the data integrity guarantees.

When you've got the basics working and want zero-touch sync, this is where it lives.

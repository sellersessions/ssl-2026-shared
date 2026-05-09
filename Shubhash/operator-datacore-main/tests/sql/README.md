# tests/sql/

Lightweight integration tests for the SQL migrations.

The most useful test is built-in: `npm run check:migrations` parses each migration in a single transaction against your Supabase database, then rolls back. Your data is untouched, and any syntax / dependency / function-signature issue surfaces before you push to a live database.

It skips silently if `SUPABASE_DB_URL` is unset (so safe in CI without secrets).

## Adding tests

Prefer:
1. SQL-only tests using pgTAP (`pg_prove`) for assertions, dropped here as `*.sql` files.
2. TypeScript tests using `tsx` and a real Supabase connection, dropped under `tests/` (root).

Avoid:
- Mocking Postgres. The bugs operator-datacore cares about (canonical revenue, rollup correctness) only show up against real Postgres.
- Demo / fixture data. See `supabase/seed/README.md` — we don't ship fake data here.

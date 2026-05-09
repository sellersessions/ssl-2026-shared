# Connect Google Workspace (homework)

Google Drive schemas are scaffolded in v1 ([`brain.gdrive_*`](../../supabase/migrations/0006_brain_google_drive.sql)) but the connector is inert. This runbook activates it.

---

## Why bother

Every operator's brain spans the marketplace data AND the planning artefacts (cash flow sheets, supplier docs, SOPs, meeting notes) that live in Google Drive. Bringing them into the same database means Claude Code (or any AI agent) can answer questions across both:

> "What's our YoY revenue trend, and where did we last document the supplier negotiation that closed in February?"

That kind of cross-source query is impossible if your business data is in Postgres but your planning documents are stuck in Drive search.

---

## Prerequisites

- A Google Workspace account (workspace, not personal Gmail). Personal Gmail works for Drive API but workspaces have richer admin controls.
- Permission to create OAuth client IDs in Google Cloud Console for your domain.
- A folder structure you're willing to sync (or whitelist).

---

## What you'll end up with

Four values in `.env`:

```
GOOGLE_OAUTH_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
GOOGLE_OAUTH_REFRESH_TOKEN=1//0gxxxxxxxxxxxxxxxxxxx
GOOGLE_DRIVE_FOLDER_IDS=  # comma-separated, optional whitelist
```

If `GOOGLE_DRIVE_FOLDER_IDS` is empty, operator-datacore syncs the whole drive accessible to the OAuth-granted user. If you set it, only files inside (or descended from) those folder IDs are synced.

---

## Step 1 — Create a Google Cloud project + OAuth client

1. Go to https://console.cloud.google.com.
2. Create a new project, e.g. `operator-datacore`.
3. **APIs & Services** → **Library** → enable **Google Drive API**, **Google Docs API**, **Google Sheets API**, **Google Slides API**.
4. **APIs & Services** → **OAuth consent screen** → **Internal** (workspace only) or **External**. Submit basic info.
5. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → **Desktop application**.
6. Note your **Client ID** and **Client Secret**.

## Step 2 — Get a refresh token

The simplest way is via Google's OAuth Playground:

1. https://developers.google.com/oauthplayground.
2. Top-right gear icon → **Use your own OAuth credentials**. Paste your client ID and secret.
3. In Step 1, paste these scopes (one per line):
   ```
   https://www.googleapis.com/auth/drive.readonly
   https://www.googleapis.com/auth/documents.readonly
   https://www.googleapis.com/auth/spreadsheets.readonly
   https://www.googleapis.com/auth/presentations.readonly
   ```
4. Click **Authorize APIs**. Sign in as the workspace user whose drive you want to sync.
5. Click **Exchange authorization code for tokens**.
6. Copy the **Refresh token** value.

If your Workspace blocks third-party app access, the admin needs to whitelist your OAuth client ID in Admin Console → Security → API controls → Manage third-party app access → Trusted (memory: this is a known gotcha for `notasquare.io`-style domains).

## Step 3 — Build the connector

Strategy: **change-feed sync** (not full scan).

1. **Initial state.** Call `changes.getStartPageToken` once. Persist it in `meta.gdrive_watch_state.current_page_token`.
2. **Incremental loop.** Every N minutes:
   - `changes.list?pageToken=<current>&fields=changes(file(id,name,mimeType,modifiedTime,parents,owners,...)),newStartPageToken`
   - For each change, upsert into `brain.gdrive_files`.
   - Persist `newStartPageToken` as the new current.
3. **Full-text extraction.** For text-containing types (Docs, Sheets, Slides, plain `.txt` / `.md` / `.csv`), call the appropriate Export API and store the result in `brain.gdrive_files.content_text`. Skip binary types (images, videos) unless you specifically want them.

The schema already has fields for this. Connector lives at `src/lib/google/`.

**Folder allowlist enforcement** (if `GOOGLE_DRIVE_FOLDER_IDS` is set):

```
isInsideAllowlist(file) =
  file.parents.some(parentId =>
    parentId === any(allowlist) ||
    isInsideAllowlist(parents[parentId])  // recurse
  )
```

Cache the parent traversal so you don't re-resolve every time.

## Step 4 — Schedule

```sql
SELECT cron.schedule(
  'operator-datacore-gdrive-sync',
  '*/10 * * * *',  -- every 10 min
  $$SELECT net.http_post(
    url := '<your-edge-function-url>/sync-google-drive',
    headers := jsonb_build_object('Authorization', 'Bearer <service-role>')
  );$$
);
```

## Step 5 — Verify

Pick a file you know exists in your drive:

```sql
SELECT name, mime_type, modified_time, content_extracted_at, content_token_count
FROM brain.gdrive_files
WHERE name ILIKE '%cash flow%';
```

If the file isn't there:
- Is it inside an allowlisted folder?
- Was it modified after the last sync? (Check `meta.gdrive_watch_state.updated_at`.)
- Does the OAuth user have access to it? (Drive permissions are user-scoped.)

For text content:
- Was it a text-extractable type? (Docs, Sheets, Slides, plain text. NOT PDFs in v1 — those need OCR.)
- Did the export call succeed? Check `meta.sync_log` for errors.

---

## Privacy note

Drive content can include sensitive material: customer emails in support threads, employee data in HR sheets, financial detail in cash-flow sheets. Three best practices:

1. **Scope the OAuth user.** Use a dedicated workspace user (e.g. `data-lake@yourdomain.com`) who only has access to folders you explicitly want synced.
2. **Use the folder allowlist.** Never sync the whole drive without a reason.
3. **Don't expose `brain.gdrive_files` via PostgREST.** It contains text content. Treat as internal. Only expose via `analytics.*` views with explicit redactions.

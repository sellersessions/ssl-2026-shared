-- ============================================================================
-- 0006_brain_google_drive.sql
-- Google Drive / Workspace metadata tables. SCAFFOLDED in v1 — schemas exist,
-- connector is inert until you activate it via docs/runbooks/connect-google-drive.md.
--
-- Strategy: store file metadata + a content_text column populated lazily on
-- request. Don't sync raw bytes for every file (would explode storage).
-- The connector watches a Drive change-feed (changes.list) and upserts
-- metadata in near-real-time.
-- ============================================================================

BEGIN;

-- pg_trgm for fuzzy path search on gdrive_files.full_path
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- brain.gdrive_files   — scaffolded
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.gdrive_files (
    file_id                         TEXT PRIMARY KEY,                           -- Google's permanent file ID
    drive_id                        TEXT,                                       -- shared drive ID, or null for "My Drive"
    name                            TEXT NOT NULL,
    mime_type                       TEXT NOT NULL,
    parents                         TEXT[],
    full_path                       TEXT,                                       -- reconstructed via parent traversal
    starred                         BOOLEAN,
    trashed                         BOOLEAN NOT NULL DEFAULT FALSE,
    explicitly_trashed              BOOLEAN,
    web_view_link                   TEXT,
    icon_link                       TEXT,
    -- Google's accounting timestamps
    created_time                    TIMESTAMPTZ,
    modified_time                   TIMESTAMPTZ,
    modified_by_me_time             TIMESTAMPTZ,
    viewed_by_me_time               TIMESTAMPTZ,
    -- Ownership and permissions
    owners                          JSONB,                                      -- array of {emailAddress, displayName}
    last_modifying_user             JSONB,
    permission_summary              TEXT,                                       -- 'private', 'domain', 'anyone-with-link', etc.
    -- Body (lazily populated for text-extractable types: docs, sheets, slides, txt, csv, md)
    content_text                    TEXT,
    content_extracted_at            TIMESTAMPTZ,
    content_token_count             INTEGER,                                    -- approx, for embedding cost forecasting
    -- File-type-specific
    size_bytes                      BIGINT,
    md5_checksum                    TEXT,
    file_extension                  TEXT,
    raw_id                          BIGINT REFERENCES raw.google_drive_payload(raw_id) ON DELETE SET NULL,
    ingested_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdrive_files_modified
    ON brain.gdrive_files (modified_time DESC);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_mime
    ON brain.gdrive_files (mime_type);
CREATE INDEX IF NOT EXISTS idx_gdrive_files_path_trgm
    ON brain.gdrive_files USING gin (full_path gin_trgm_ops);

COMMENT ON TABLE brain.gdrive_files IS
'Google Drive file metadata + lazily-extracted text. Synced via changes.list watch loop. Bytes never stored.';

-- ----------------------------------------------------------------------------
-- brain.gdrive_change_log   — scaffolded
-- The Drive API returns a "page token" you persist; the connector resumes
-- from where it left off. One row per change page processed.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brain.gdrive_change_log (
    log_id                          BIGSERIAL PRIMARY KEY,
    page_token                      TEXT NOT NULL,
    new_start_page_token            TEXT,
    changes_count                   INTEGER,
    fetched_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    raw_id                          BIGINT REFERENCES raw.google_drive_payload(raw_id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- meta.gdrive_watch_state   — singleton, holds the current page token
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS meta.gdrive_watch_state (
    connection_id                   UUID PRIMARY KEY REFERENCES meta.connection(connection_id) ON DELETE CASCADE,
    current_page_token              TEXT NOT NULL,
    folder_allowlist                TEXT[],                                     -- only sync files inside these folder IDs
    last_full_resync_at             TIMESTAMPTZ,
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_gdrive_watch_state_updated ON meta.gdrive_watch_state;
CREATE TRIGGER trg_gdrive_watch_state_updated
    BEFORE UPDATE ON meta.gdrive_watch_state
    FOR EACH ROW EXECUTE FUNCTION meta.set_updated_at();

INSERT INTO meta.migration_history (filename) VALUES ('0006_brain_google_drive.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;

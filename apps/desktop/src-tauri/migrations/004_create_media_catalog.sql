CREATE TABLE IF NOT EXISTS media_assets (
    workspace_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
    format TEXT NOT NULL,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    imported_at TEXT NOT NULL,
    last_used_at TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('available', 'missing', 'corrupt')),
    sha256 TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    PRIMARY KEY (workspace_id, media_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_assets_workspace_type
    ON media_assets(workspace_id, media_type);

CREATE INDEX IF NOT EXISTS idx_media_assets_workspace_state
    ON media_assets(workspace_id, state);

CREATE TABLE IF NOT EXISTS media_references (
    workspace_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    note_id TEXT,
    block_id TEXT,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, media_id, reference_id),
    FOREIGN KEY (workspace_id, media_id)
        REFERENCES media_assets(workspace_id, media_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_media_references_workspace_note
    ON media_references(workspace_id, note_id);

CREATE INDEX IF NOT EXISTS idx_media_references_workspace_media
    ON media_references(workspace_id, media_id);

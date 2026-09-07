CREATE TABLE IF NOT EXISTS workspace_notes (
    workspace_id TEXT NOT NULL,
    note_id TEXT NOT NULL,
    note_type TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, note_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workspace_notes_workspace_updated
    ON workspace_notes(workspace_id, updated_at);

CREATE TABLE IF NOT EXISTS workspace_highlights (
    workspace_id TEXT NOT NULL,
    highlight_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    style_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, highlight_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
    CHECK (chapter > 0),
    CHECK (verse_start > 0),
    CHECK (verse_end >= verse_start)
);

CREATE INDEX IF NOT EXISTS idx_workspace_highlights_reference
    ON workspace_highlights(workspace_id, version_id, book_id, chapter, verse_start, verse_end);

CREATE TABLE IF NOT EXISTS workspace_index_state (
    workspace_id TEXT PRIMARY KEY NOT NULL,
    projection_version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'empty'
        CHECK (status IN ('empty', 'running', 'ready', 'degraded', 'error')),
    record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
    error_code TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS note_verse_ref (
    workspace_id TEXT NOT NULL,
    note_id TEXT NOT NULL,
    block_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, note_id, block_id),
    FOREIGN KEY (workspace_id, note_id)
        REFERENCES workspace_notes(workspace_id, note_id) ON DELETE CASCADE,
    CHECK (chapter > 0),
    CHECK (verse_start > 0),
    CHECK (verse_end >= verse_start)
);

CREATE INDEX IF NOT EXISTS idx_note_verse_ref_reference
    ON note_verse_ref(workspace_id, version_id, book_id, chapter, verse_start, verse_end);

CREATE TABLE IF NOT EXISTS reader_highlight (
    workspace_id TEXT NOT NULL,
    highlight_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL,
    verse_start INTEGER NOT NULL,
    verse_end INTEGER NOT NULL,
    style_id TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, highlight_id),
    FOREIGN KEY (workspace_id, highlight_id)
        REFERENCES workspace_highlights(workspace_id, highlight_id) ON DELETE CASCADE,
    CHECK (chapter > 0),
    CHECK (verse_start > 0),
    CHECK (verse_end >= verse_start)
);

CREATE INDEX IF NOT EXISTS idx_reader_highlight_reference
    ON reader_highlight(workspace_id, version_id, book_id, chapter, verse_start, verse_end);

CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered', 'opening', 'ready', 'unavailable', 'migrating', 'invalid', 'detached', 'deleted')),
    schema_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_opened_at TEXT,
    metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_workspaces_status ON workspaces(status);
CREATE INDEX IF NOT EXISTS idx_workspaces_last_opened_at ON workspaces(last_opened_at);

CREATE TABLE IF NOT EXISTS active_workspace_pointer (
    pointer_id INTEGER PRIMARY KEY CHECK (pointer_id = 1),
    workspace_id TEXT REFERENCES workspaces(workspace_id) ON DELETE SET NULL,
    generation INTEGER NOT NULL DEFAULT 0 CHECK (generation >= 0),
    updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO active_workspace_pointer(pointer_id, workspace_id, generation, updated_at)
VALUES (1, NULL, 0, '1970-01-01T00:00:00.000Z');

CREATE TABLE IF NOT EXISTS legacy_workspace_migrations (
    migration_key TEXT PRIMARY KEY NOT NULL,
    source_type TEXT NOT NULL,
    source_ref TEXT,
    workspace_id TEXT REFERENCES workspaces(workspace_id) ON DELETE SET NULL,
    state TEXT NOT NULL DEFAULT 'not_started'
        CHECK (state IN ('not_started', 'running', 'completed', 'error')),
    cursor TEXT,
    error_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legacy_workspace_migrations_workspace_id
    ON legacy_workspace_migrations(workspace_id);

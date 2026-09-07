CREATE TABLE IF NOT EXISTS sync_documents (
    workspace_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('note', 'highlight')),
    backend_record_id TEXT NOT NULL,
    export_relative_path TEXT,
    schema_version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'clean'
        CHECK (status IN ('clean', 'pending', 'converged', 'conflict')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, document_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_documents_workspace_status
    ON sync_documents(workspace_id, status);

CREATE TABLE IF NOT EXISTS sync_snapshots (
    workspace_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    snapshot_version INTEGER NOT NULL,
    state_json TEXT NOT NULL,
    heads_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, document_id, snapshot_version),
    FOREIGN KEY (workspace_id, document_id)
        REFERENCES sync_documents(workspace_id, document_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_snapshots_latest
    ON sync_snapshots(workspace_id, document_id, snapshot_version DESC);

CREATE TABLE IF NOT EXISTS sync_changes (
    workspace_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    change_id TEXT NOT NULL,
    change_blob BLOB NOT NULL,
    byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
    applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0, 1)),
    created_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, document_id, change_id),
    FOREIGN KEY (workspace_id, document_id)
        REFERENCES sync_documents(workspace_id, document_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_changes_pending
    ON sync_changes(workspace_id, document_id, applied, created_at);

CREATE TABLE IF NOT EXISTS sync_queue (
    workspace_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    pending_count INTEGER NOT NULL DEFAULT 0 CHECK (pending_count >= 0),
    bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0),
    retry_at TEXT,
    last_error_code TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, document_id),
    FOREIGN KEY (workspace_id, document_id)
        REFERENCES sync_documents(workspace_id, document_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_peers (
    workspace_id TEXT NOT NULL,
    peer_id TEXT NOT NULL,
    scope_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
    created_at TEXT NOT NULL,
    revoked_at TEXT,
    PRIMARY KEY (workspace_id, peer_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_endpoints (
    workspace_id TEXT NOT NULL,
    endpoint_id TEXT NOT NULL,
    transport TEXT NOT NULL CHECK (transport IN ('local', 'websocket')),
    url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('disabled', 'connecting', 'online', 'retrying')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, endpoint_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(workspace_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
    workspace_id TEXT NOT NULL,
    conflict_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    local_generation INTEGER NOT NULL,
    external_generation INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('needs-review', 'resolved', 'recovered')),
    recovery_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, conflict_id),
    FOREIGN KEY (workspace_id, document_id)
        REFERENCES sync_documents(workspace_id, document_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_review
    ON sync_conflicts(workspace_id, status, updated_at);

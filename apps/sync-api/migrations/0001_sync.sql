CREATE TABLE IF NOT EXISTS sync_documents (
	workspace_id TEXT NOT NULL,
	document_id TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('note', 'highlight')),
	revision INTEGER NOT NULL,
	payload_json TEXT,
	deleted_at TEXT,
	updated_at TEXT NOT NULL,
	updated_by TEXT NOT NULL,
	PRIMARY KEY (workspace_id, document_id)
);

CREATE TABLE IF NOT EXISTS sync_changes (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	workspace_id TEXT NOT NULL,
	document_id TEXT NOT NULL,
	kind TEXT NOT NULL CHECK (kind IN ('note', 'highlight')),
	revision INTEGER NOT NULL,
	operation_id TEXT NOT NULL,
	payload_json TEXT,
	deleted_at TEXT,
	updated_by TEXT NOT NULL,
	created_at TEXT NOT NULL,
	UNIQUE (workspace_id, operation_id)
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	workspace_id TEXT NOT NULL,
	document_id TEXT NOT NULL,
	operation_id TEXT NOT NULL,
	base_revision INTEGER NOT NULL,
	current_revision INTEGER NOT NULL,
	payload_json TEXT,
	deleted_at TEXT,
	device_id TEXT NOT NULL,
	created_at TEXT NOT NULL,
	UNIQUE (workspace_id, operation_id)
);

CREATE INDEX IF NOT EXISTS sync_changes_workspace_cursor
	ON sync_changes (workspace_id, id);

CREATE INDEX IF NOT EXISTS sync_conflicts_workspace_document
	ON sync_conflicts (workspace_id, document_id);

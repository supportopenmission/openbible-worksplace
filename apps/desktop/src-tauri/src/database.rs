use crate::commands::workspace::CommandError;
use rusqlite::{params, Connection, OptionalExtension};
use serde::Serialize;
use serde_json::json;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

const MIGRATION_001: &str = include_str!("../migrations/001_create_workspaces.sql");
const MIGRATION_002: &str = include_str!("../migrations/002_create_workspace_content.sql");
const MIGRATION_003: &str = include_str!("../migrations/003_create_sync_operational.sql");
pub const APP_DATABASE_FILE: &str = "app.sqlite";
pub const CURRENT_SCHEMA_VERSION: i64 = 3;

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("sqlite error")]
    Sqlite(#[from] rusqlite::Error),
    #[error("database path error")]
    Path,
    #[error("unsupported schema version: {0}")]
    UnsupportedSchema(i64),
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStatus {
    pub backend: String,
    pub database_name: String,
    pub schema_version: i64,
}

pub struct WorkspaceDatabase {
    connection: Connection,
}

impl WorkspaceDatabase {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, DatabaseError> {
        let path = path.as_ref().to_path_buf();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|_| DatabaseError::Path)?;
        }

        let connection = Connection::open(&path)?;
        let mut database = Self { connection };
        database.configure()?;
        database.ensure_schema()?;
        Ok(database)
    }

    pub fn open_app(app: &AppHandle) -> Result<Self, DatabaseError> {
        let app_data_dir = app.path().app_data_dir().map_err(|_| DatabaseError::Path)?;
        Self::open(app_data_dir.join(APP_DATABASE_FILE))
    }

    pub fn status(&self) -> DatabaseStatus {
        DatabaseStatus {
            backend: "sqlite".to_string(),
            database_name: APP_DATABASE_FILE.to_string(),
            schema_version: CURRENT_SCHEMA_VERSION,
        }
    }

    fn configure(&self) -> Result<(), DatabaseError> {
        self.connection.pragma_update(None, "foreign_keys", "ON")?;
        self.connection
            .busy_timeout(std::time::Duration::from_secs(5))?;
        Ok(())
    }

    fn ensure_schema(&mut self) -> Result<(), DatabaseError> {
        let version: i64 = self
            .connection
            .pragma_query_value(None, "user_version", |row| row.get(0))?;

        if version > CURRENT_SCHEMA_VERSION {
            return Err(DatabaseError::UnsupportedSchema(version));
        }
        let transaction = self.connection.transaction()?;
        if version < 1 {
            transaction.execute_batch(MIGRATION_001)?;
        }
        if version < 2 {
            transaction.execute_batch(MIGRATION_002)?;
        }
        if version < 3 {
            transaction.execute_batch(MIGRATION_003)?;
        }
        transaction.pragma_update(None, "user_version", CURRENT_SCHEMA_VERSION)?;
        transaction.commit()?;
        Ok(())
    }

    pub fn delete_workspace(&mut self, workspace_id: &str) -> Result<(), DatabaseError> {
        let transaction = self.connection.transaction()?;
        transaction.execute(
            "UPDATE active_workspace_pointer
             SET workspace_id = NULL, generation = generation + 1,
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE pointer_id = 1 AND workspace_id = ?1",
            params![workspace_id],
        )?;
        transaction.execute(
            "DELETE FROM legacy_workspace_migrations WHERE workspace_id = ?1",
            params![workspace_id],
        )?;
        transaction.execute(
            "DELETE FROM workspaces WHERE workspace_id = ?1",
            params![workspace_id],
        )?;
        transaction.commit()?;
        Ok(())
    }

    pub fn reset_local_data(&mut self) -> Result<(), DatabaseError> {
        let transaction = self.connection.transaction()?;
        for table in [
            "sync_queue",
            "sync_changes",
            "sync_snapshots",
            "sync_conflicts",
            "sync_peers",
            "sync_endpoints",
            "sync_documents",
            "reader_highlight",
            "note_verse_ref",
            "workspace_index_state",
            "workspace_highlights",
            "workspace_notes",
            "legacy_workspace_migrations",
            "workspaces",
        ] {
            transaction.execute(&format!("DELETE FROM {table}"), [])?;
        }
        transaction.execute(
            "UPDATE active_workspace_pointer
             SET workspace_id = NULL, generation = generation + 1,
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
             WHERE pointer_id = 1",
            [],
        )?;
        transaction.commit()?;
        Ok(())
    }

    pub fn list_workspace_content(
        &mut self,
        workspace_id: &str,
    ) -> Result<serde_json::Value, DatabaseError> {
        if workspace_id.trim().is_empty() {
            return Err(DatabaseError::Path);
        }

        let mut records = Vec::new();
        {
            let mut statement = self.connection.prepare(
                "SELECT note_id, schema_version, payload_json, created_at, updated_at
                 FROM workspace_notes
                 WHERE workspace_id = ?1
                 ORDER BY note_id",
            )?;
            let rows = statement.query_map(params![workspace_id], |row| {
                let payload_json: String = row.get(2)?;
                let payload = serde_json::from_str::<serde_json::Value>(&payload_json)
                    .unwrap_or_else(|_| json!({}));
                Ok(json!({
                    "kind": "note",
                    "id": row.get::<_, String>(0)?,
                    "workspaceId": workspace_id,
                    "schemaVersion": row.get::<_, i64>(1)?,
                    "payload": payload,
                    "createdAt": row.get::<_, String>(3)?,
                    "updatedAt": row.get::<_, String>(4)?
                }))
            })?;
            for row in rows {
                records.push(row?);
            }
        }

        {
            let mut statement = self.connection.prepare(
                "SELECT highlight_id, schema_version, payload_json, created_at, updated_at
                 FROM workspace_highlights
                 WHERE workspace_id = ?1
                 ORDER BY highlight_id",
            )?;
            let rows = statement.query_map(params![workspace_id], |row| {
                let payload_json: String = row.get(2)?;
                let payload = serde_json::from_str::<serde_json::Value>(&payload_json)
                    .unwrap_or_else(|_| json!({}));
                Ok(json!({
                    "kind": "highlight",
                    "id": row.get::<_, String>(0)?,
                    "workspaceId": workspace_id,
                    "schemaVersion": row.get::<_, i64>(1)?,
                    "payload": payload,
                    "createdAt": row.get::<_, String>(3)?,
                    "updatedAt": row.get::<_, String>(4)?
                }))
            })?;
            for row in rows {
                records.push(row?);
            }
        }

        Ok(serde_json::Value::Array(records))
    }

    pub fn write_workspace_content(
        &mut self,
        record: &serde_json::Value,
    ) -> Result<(), DatabaseError> {
        let kind = record
            .get("kind")
            .and_then(serde_json::Value::as_str)
            .ok_or(DatabaseError::Path)?;
        let workspace_id = record
            .get("workspaceId")
            .and_then(serde_json::Value::as_str)
            .filter(|value| !value.trim().is_empty())
            .ok_or(DatabaseError::Path)?;
        let id = record
            .get("id")
            .and_then(serde_json::Value::as_str)
            .filter(|value| !value.trim().is_empty())
            .ok_or(DatabaseError::Path)?;
        let schema_version = record
            .get("schemaVersion")
            .and_then(serde_json::Value::as_i64)
            .ok_or(DatabaseError::Path)?;
        let payload = record.get("payload").ok_or(DatabaseError::Path)?;
        let payload_json = serde_json::to_string(payload).map_err(|_| DatabaseError::Path)?;
        let now = "2026-09-06T00:00:00.000Z";
        let created_at = record
            .get("createdAt")
            .and_then(serde_json::Value::as_str)
            .unwrap_or(now);
        let updated_at = record
            .get("updatedAt")
            .and_then(serde_json::Value::as_str)
            .unwrap_or(created_at);
        let transaction = self.connection.transaction()?;
        transaction.execute(
            "INSERT OR IGNORE INTO workspaces
               (workspace_id, name, status, schema_version, created_at, updated_at)
             VALUES (?1, ?1, 'ready', 1, ?2, ?2)",
            params![workspace_id, created_at],
        )?;

        match kind {
            "note" => {
                transaction.execute(
                    "INSERT INTO workspace_notes
                     (workspace_id, note_id, note_type, schema_version, payload_json, created_at, updated_at)
                     VALUES (?1, ?2, 'note', ?3, ?4, ?5, ?6)
                     ON CONFLICT(workspace_id, note_id) DO UPDATE SET
                       schema_version = excluded.schema_version,
                       payload_json = excluded.payload_json,
                       updated_at = excluded.updated_at",
                    params![workspace_id, id, schema_version, payload_json, created_at, updated_at],
                )?;
            }
            "highlight" => {
                let payload_object = payload.as_object().ok_or(DatabaseError::Path)?;
                let version_id = payload_object
                    .get("versionId")
                    .and_then(serde_json::Value::as_str)
                    .ok_or(DatabaseError::Path)?;
                let book_id = payload_object
                    .get("bookId")
                    .and_then(serde_json::Value::as_i64)
                    .ok_or(DatabaseError::Path)?;
                let chapter = payload_object
                    .get("chapter")
                    .and_then(serde_json::Value::as_i64)
                    .ok_or(DatabaseError::Path)?;
                let verse_start = payload_object
                    .get("verseStart")
                    .and_then(serde_json::Value::as_i64)
                    .ok_or(DatabaseError::Path)?;
                let verse_end = payload_object
                    .get("verseEnd")
                    .and_then(serde_json::Value::as_i64)
                    .ok_or(DatabaseError::Path)?;
                let style_id = payload_object
                    .get("styleId")
                    .and_then(serde_json::Value::as_str)
                    .unwrap_or("default");
                transaction.execute(
                    "INSERT INTO workspace_highlights
                     (workspace_id, highlight_id, version_id, book_id, chapter, verse_start, verse_end,
                      style_id, schema_version, payload_json, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
                     ON CONFLICT(workspace_id, highlight_id) DO UPDATE SET
                       version_id = excluded.version_id,
                       book_id = excluded.book_id,
                       chapter = excluded.chapter,
                       verse_start = excluded.verse_start,
                       verse_end = excluded.verse_end,
                       style_id = excluded.style_id,
                       schema_version = excluded.schema_version,
                       payload_json = excluded.payload_json,
                       updated_at = excluded.updated_at",
                    params![
                        workspace_id,
                        id,
                        version_id,
                        book_id,
                        chapter,
                        verse_start,
                        verse_end,
                        style_id,
                        schema_version,
                        payload_json,
                        created_at,
                        updated_at
                    ],
                )?;
            }
            _ => return Err(DatabaseError::Path),
        }

        transaction.commit()?;
        Ok(())
    }

    pub fn delete_workspace_content(
        &mut self,
        workspace_id: &str,
        kind: &str,
        id: &str,
    ) -> Result<(), DatabaseError> {
        if workspace_id.trim().is_empty() || id.trim().is_empty() {
            return Err(DatabaseError::Path);
        }
        let transaction = self.connection.transaction()?;
        match kind {
            "note" => {
                transaction.execute(
                    "DELETE FROM workspace_notes WHERE workspace_id = ?1 AND note_id = ?2",
                    params![workspace_id, id],
                )?;
            }
            "highlight" => {
                transaction.execute(
                    "DELETE FROM workspace_highlights WHERE workspace_id = ?1 AND highlight_id = ?2",
                    params![workspace_id, id],
                )?;
            }
            _ => return Err(DatabaseError::Path),
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn sync_write_note(
        &mut self,
        workspace_id: &str,
        note_id: &str,
        schema_version: i64,
        payload: &serde_json::Value,
        created_at: Option<&str>,
        updated_at: Option<&str>,
    ) -> Result<serde_json::Value, DatabaseError> {
        validate_sync_key(workspace_id)?;
        validate_sync_key(note_id)?;
        if schema_version < 1 {
            return Err(DatabaseError::Path);
        }

        let payload_json = serde_json::to_string(payload).map_err(|_| DatabaseError::Path)?;
        let transaction = self.connection.transaction()?;
        transaction.execute(
            "INSERT OR IGNORE INTO workspaces
               (workspace_id, name, status, schema_version, created_at, updated_at)
             VALUES (?1, ?1, 'ready', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
            params![workspace_id],
        )?;
        transaction.execute(
            "INSERT INTO workspace_notes
               (workspace_id, note_id, note_type, schema_version, payload_json, created_at, updated_at)
             VALUES (?1, ?2, 'note', ?3, ?4, COALESCE(?5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), COALESCE(?6, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
             ON CONFLICT(workspace_id, note_id) DO UPDATE SET
               schema_version = excluded.schema_version,
               payload_json = excluded.payload_json,
               updated_at = excluded.updated_at",
            params![workspace_id, note_id, schema_version, payload_json, created_at, updated_at],
        )?;
        transaction.execute(
            "INSERT INTO sync_documents
               (workspace_id, document_id, kind, backend_record_id, schema_version, status, created_at, updated_at)
             VALUES (?1, ?2, 'note', ?2, ?3, 'clean', COALESCE(?4, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')), COALESCE(?5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
             ON CONFLICT(workspace_id, document_id) DO UPDATE SET
               backend_record_id = excluded.backend_record_id,
               schema_version = excluded.schema_version,
               updated_at = excluded.updated_at",
            params![workspace_id, note_id, schema_version, created_at, updated_at],
        )?;
        transaction.commit()?;

        Ok(json!({
            "backend": "sqlite",
            "databaseName": APP_DATABASE_FILE,
            "workspaceId": workspace_id,
            "documentId": note_id,
            "persisted": true
        }))
    }

    pub fn sync_write_snapshot(
        &mut self,
        workspace_id: &str,
        note_id: &str,
        snapshot_version: i64,
        state: &serde_json::Value,
        heads: &[String],
    ) -> Result<serde_json::Value, DatabaseError> {
        validate_sync_key(workspace_id)?;
        validate_sync_key(note_id)?;
        if snapshot_version < 1 {
            return Err(DatabaseError::Path);
        }

        let state_json = serde_json::to_string(state).map_err(|_| DatabaseError::Path)?;
        let heads_json = serde_json::to_string(heads).map_err(|_| DatabaseError::Path)?;
        let transaction = self.connection.transaction()?;
        transaction.execute(
            "INSERT OR IGNORE INTO workspaces
               (workspace_id, name, status, schema_version, created_at, updated_at)
             VALUES (?1, ?1, 'ready', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
            params![workspace_id],
        )?;
        transaction.execute(
            "INSERT INTO sync_documents
               (workspace_id, document_id, kind, backend_record_id, schema_version, status, created_at, updated_at)
             VALUES (?1, ?2, 'note', ?2, 1, 'clean', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
             ON CONFLICT(workspace_id, document_id) DO NOTHING",
            params![workspace_id, note_id],
        )?;
        transaction.execute(
            "INSERT INTO sync_snapshots
               (workspace_id, document_id, snapshot_version, state_json, heads_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
             ON CONFLICT(workspace_id, document_id, snapshot_version) DO UPDATE SET
               state_json = excluded.state_json,
               heads_json = excluded.heads_json",
            params![
                workspace_id,
                note_id,
                snapshot_version,
                state_json,
                heads_json
            ],
        )?;
        transaction.commit()?;

        Ok(json!({
            "backend": "sqlite",
            "databaseName": APP_DATABASE_FILE,
            "workspaceId": workspace_id,
            "documentId": note_id,
            "snapshotVersion": snapshot_version,
            "persisted": true
        }))
    }

    pub fn sync_append_change(
        &mut self,
        workspace_id: &str,
        note_id: &str,
        change_id: &str,
        change_blob: &[u8],
    ) -> Result<serde_json::Value, DatabaseError> {
        validate_sync_key(workspace_id)?;
        validate_sync_key(note_id)?;
        validate_sync_key(change_id)?;

        let transaction = self.connection.transaction()?;
        transaction.execute(
            "INSERT OR IGNORE INTO workspaces
               (workspace_id, name, status, schema_version, created_at, updated_at)
             VALUES (?1, ?1, 'ready', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
            params![workspace_id],
        )?;
        transaction.execute(
            "INSERT INTO sync_documents
               (workspace_id, document_id, kind, backend_record_id, schema_version, status, created_at, updated_at)
             VALUES (?1, ?2, 'note', ?2, 1, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
             ON CONFLICT(workspace_id, document_id) DO UPDATE SET
               status = 'pending',
               updated_at = excluded.updated_at",
            params![workspace_id, note_id],
        )?;
        let inserted = transaction.execute(
            "INSERT OR IGNORE INTO sync_changes
               (workspace_id, document_id, change_id, change_blob, byte_size, applied, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 0, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
            params![
                workspace_id,
                note_id,
                change_id,
                change_blob,
                change_blob.len() as i64
            ],
        )?;
        if inserted > 0 {
            transaction.execute(
                "INSERT INTO sync_queue
                   (workspace_id, document_id, pending_count, bytes, updated_at)
                 VALUES (?1, ?2, 1, ?3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                 ON CONFLICT(workspace_id, document_id) DO UPDATE SET
                   pending_count = sync_queue.pending_count + 1,
                   bytes = sync_queue.bytes + excluded.bytes,
                   updated_at = excluded.updated_at",
                params![workspace_id, note_id, change_blob.len() as i64],
            )?;
        }
        let queue = transaction
            .query_row(
                "SELECT pending_count, bytes FROM sync_queue WHERE workspace_id = ?1 AND document_id = ?2",
                params![workspace_id, note_id],
                |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)),
            )?;
        transaction.commit()?;

        Ok(json!({
            "backend": "sqlite",
            "databaseName": APP_DATABASE_FILE,
            "workspaceId": workspace_id,
            "documentId": note_id,
            "queue": { "pendingCount": queue.0, "bytes": queue.1 },
            "persisted": true
        }))
    }

    pub fn sync_read_state(
        &mut self,
        workspace_id: &str,
        note_id: &str,
    ) -> Result<serde_json::Value, DatabaseError> {
        validate_sync_key(workspace_id)?;
        validate_sync_key(note_id)?;

        let note = self
            .connection
            .query_row(
                "SELECT schema_version, payload_json, created_at, updated_at
                 FROM workspace_notes WHERE workspace_id = ?1 AND note_id = ?2",
                params![workspace_id, note_id],
                |row| {
                    let payload_json: String = row.get(1)?;
                    let payload = serde_json::from_str::<serde_json::Value>(&payload_json)
                        .unwrap_or_else(|_| json!({}));
                    Ok(json!({
                        "kind": "note",
                        "id": note_id,
                        "workspaceId": workspace_id,
                        "schemaVersion": row.get::<_, i64>(0)?,
                        "payload": payload,
                        "createdAt": row.get::<_, String>(2)?,
                        "updatedAt": row.get::<_, String>(3)?
                    }))
                },
            )
            .optional()?;
        let snapshot = self
            .connection
            .query_row(
                "SELECT snapshot_version, state_json, heads_json
                 FROM sync_snapshots
                 WHERE workspace_id = ?1 AND document_id = ?2
                 ORDER BY snapshot_version DESC LIMIT 1",
                params![workspace_id, note_id],
                |row| {
                    let state_json: String = row.get(1)?;
                    let heads_json: String = row.get(2)?;
                    Ok(json!({
                        "snapshotVersion": row.get::<_, i64>(0)?,
                        "state": serde_json::from_str::<serde_json::Value>(&state_json).unwrap_or_else(|_| json!({})),
                        "heads": serde_json::from_str::<serde_json::Value>(&heads_json).unwrap_or_else(|_| json!([]))
                    }))
                },
            )
            .optional()?;
        let queue = self
            .connection
            .query_row(
                "SELECT pending_count, bytes, last_error_code
                 FROM sync_queue WHERE workspace_id = ?1 AND document_id = ?2",
                params![workspace_id, note_id],
                |row| {
                    Ok(json!({
                        "pendingCount": row.get::<_, i64>(0)?,
                        "bytes": row.get::<_, i64>(1)?,
                        "lastErrorCode": row.get::<_, Option<String>>(2)?
                    }))
                },
            )
            .optional()?;

        Ok(json!({
            "backend": "sqlite",
            "databaseName": APP_DATABASE_FILE,
            "workspaceId": workspace_id,
            "documentId": note_id,
            "note": note,
            "snapshot": snapshot,
            "queue": queue
        }))
    }

    pub fn query_reader_highlights(
        &mut self,
        workspace_id: &str,
        operation: &str,
        version_id: Option<&str>,
        book_id: Option<i64>,
        chapter: Option<i64>,
        verse_start: Option<i64>,
        verse_end: Option<i64>,
        style_id: Option<&str>,
    ) -> Result<serde_json::Value, DatabaseError> {
        if workspace_id.trim().is_empty() {
            return Err(DatabaseError::Path);
        }

        match operation {
            "list_highlights" => {
                let mut statement = if version_id.unwrap_or_default().is_empty() {
                    self.connection.prepare(
                        "SELECT version_id, book_id, chapter, verse_start, verse_end, style_id
                         FROM workspace_highlights
                         WHERE workspace_id = ?1
                         ORDER BY version_id, book_id, chapter, verse_start, verse_end",
                    )?
                } else {
                    self.connection.prepare(
                        "SELECT version_id, book_id, chapter, verse_start, verse_end, style_id
                         FROM workspace_highlights
                         WHERE workspace_id = ?1 AND version_id = ?2 AND book_id = ?3 AND chapter = ?4
                         ORDER BY verse_start, verse_end",
                    )?
                };
                let rows = if version_id.unwrap_or_default().is_empty() {
                    statement.query_map(params![workspace_id], highlight_json_row)?
                } else {
                    statement.query_map(
                        params![
                            workspace_id,
                            version_id.unwrap_or_default(),
                            book_id.unwrap_or_default(),
                            chapter.unwrap_or_default()
                        ],
                        highlight_json_row,
                    )?
                };
                let values = rows.collect::<Result<Vec<_>, _>>()?;
                Ok(serde_json::Value::Array(values))
            }
            "upsert_highlight" => {
                let version_id = version_id.ok_or(DatabaseError::Path)?;
                let book_id = book_id.ok_or(DatabaseError::Path)?;
                let chapter = chapter.ok_or(DatabaseError::Path)?;
                let verse_start = verse_start.ok_or(DatabaseError::Path)?;
                let verse_end = verse_end.ok_or(DatabaseError::Path)?;
                let style_id = style_id.unwrap_or("default");
                let highlight_id =
                    format!("highlight-{version_id}-{book_id}-{chapter}-{verse_start}-{verse_end}");
                let payload_json = json!({
                    "highlightId": highlight_id,
                    "versionId": version_id,
                    "bookId": book_id,
                    "chapter": chapter,
                    "verseStart": verse_start,
                    "verseEnd": verse_end,
                    "styleId": style_id,
                    "schemaVersion": 1
                })
                .to_string();
                let transaction = self.connection.transaction()?;
                transaction.execute(
                    "INSERT OR IGNORE INTO workspaces
                       (workspace_id, name, status, schema_version, created_at, updated_at)
                     VALUES (?1, ?2, 'ready', 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))",
                    params![workspace_id, workspace_id],
                )?;
                transaction.execute(
                    "INSERT INTO workspace_highlights
                       (workspace_id, highlight_id, version_id, book_id, chapter, verse_start, verse_end,
                        style_id, schema_version, payload_json, created_at, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9,
                             strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                     ON CONFLICT(workspace_id, highlight_id) DO UPDATE SET
                       version_id = excluded.version_id,
                       book_id = excluded.book_id,
                       chapter = excluded.chapter,
                       verse_start = excluded.verse_start,
                       verse_end = excluded.verse_end,
                       style_id = excluded.style_id,
                       payload_json = excluded.payload_json,
                       updated_at = excluded.updated_at",
                    params![
                        workspace_id,
                        highlight_id,
                        version_id,
                        book_id,
                        chapter,
                        verse_start,
                        verse_end,
                        style_id,
                        payload_json
                    ],
                )?;
                transaction.execute(
                    "INSERT INTO reader_highlight
                       (workspace_id, highlight_id, version_id, book_id, chapter, verse_start, verse_end, style_id, updated_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
                     ON CONFLICT(workspace_id, highlight_id) DO UPDATE SET
                       version_id = excluded.version_id,
                       book_id = excluded.book_id,
                       chapter = excluded.chapter,
                       verse_start = excluded.verse_start,
                       verse_end = excluded.verse_end,
                       style_id = excluded.style_id,
                       updated_at = excluded.updated_at",
                    params![
                        workspace_id,
                        highlight_id,
                        version_id,
                        book_id,
                        chapter,
                        verse_start,
                        verse_end,
                        style_id
                    ],
                )?;
                transaction.commit()?;
                Ok(json!({ "ok": true }))
            }
            "delete_highlight" => {
                let version_id = version_id.ok_or(DatabaseError::Path)?;
                let book_id = book_id.ok_or(DatabaseError::Path)?;
                let chapter = chapter.ok_or(DatabaseError::Path)?;
                let verse_start = verse_start.ok_or(DatabaseError::Path)?;
                let verse_end = verse_end.ok_or(DatabaseError::Path)?;
                let highlight_id =
                    format!("highlight-{version_id}-{book_id}-{chapter}-{verse_start}-{verse_end}");
                self.connection.execute(
                    "DELETE FROM workspace_highlights WHERE workspace_id = ?1 AND highlight_id = ?2",
                    params![workspace_id, highlight_id],
                )?;
                Ok(json!({ "ok": true }))
            }
            _ => Err(DatabaseError::Path),
        }
    }
}

fn highlight_json_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<serde_json::Value> {
    Ok(json!({
        "versionId": row.get::<_, String>(0)?,
        "bookId": row.get::<_, i64>(1)?,
        "chapter": row.get::<_, i64>(2)?,
        "verseStart": row.get::<_, i64>(3)?,
        "verseEnd": row.get::<_, i64>(4)?,
        "styleId": row.get::<_, String>(5)?
    }))
}

fn validate_sync_key(value: &str) -> Result<(), DatabaseError> {
    if value.trim().is_empty()
        || value.contains('/')
        || value.contains('\\')
        || value.contains("..")
    {
        return Err(DatabaseError::Path);
    }
    Ok(())
}

#[tauri::command]
pub fn initialize_workspace_database(
    app: AppHandle,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<DatabaseStatus, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    if database_state.is_none() {
        let database = WorkspaceDatabase::open_app(&app)
            .map_err(|_| CommandError::new("database_unavailable", true))?;
        *database_state = Some(database);
    }
    Ok(database_state
        .as_ref()
        .expect("database state was initialized")
        .status())
}

#[tauri::command]
pub fn reset_local_database(
    app: AppHandle,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<(), CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    if database_state.is_none() {
        let database = WorkspaceDatabase::open_app(&app)
            .map_err(|_| CommandError::new("database_unavailable", true))?;
        *database_state = Some(database);
    }
    database_state
        .as_mut()
        .expect("database state was initialized")
        .reset_local_data()
        .map_err(|_| CommandError::new("persistence_conflict", true))
}

#[tauri::command]
pub fn delete_workspace_record(
    workspace_id: String,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<(), CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .delete_workspace(&workspace_id)
        .map_err(|_| CommandError::new("persistence_conflict", true))
}

#[tauri::command]
pub fn list_workspace_content(
    workspace_id: String,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<serde_json::Value, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .list_workspace_content(&workspace_id)
        .map_err(|_| CommandError::new("persistence_conflict", true))
}

#[tauri::command]
pub fn write_workspace_content(
    record: serde_json::Value,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<(), CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .write_workspace_content(&record)
        .map_err(|_| CommandError::new("persistence_conflict", true))
}

#[tauri::command]
pub fn delete_workspace_content(
    workspace_id: String,
    kind: String,
    id: String,
    state: tauri::State<'_, std::sync::Mutex<Option<WorkspaceDatabase>>>,
) -> Result<(), CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .delete_workspace_content(&workspace_id, &kind, &id)
        .map_err(|_| CommandError::new("persistence_conflict", true))
}

#[cfg(test)]
mod tests {
    use super::{WorkspaceDatabase, APP_DATABASE_FILE, CURRENT_SCHEMA_VERSION, MIGRATION_001};
    use rusqlite::{params, Connection};
    use serde_json::json;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn test_path() -> PathBuf {
        let suffix = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock must be after epoch")
            .as_nanos();
        std::env::temp_dir()
            .join(format!("openbible-database-test-{suffix}"))
            .join(APP_DATABASE_FILE)
    }

    #[test]
    fn creates_the_versioned_workspace_schema_idempotently() {
        let path = test_path();
        let database = WorkspaceDatabase::open(&path).expect("database opens");
        assert_eq!(database.status().schema_version, CURRENT_SCHEMA_VERSION);
        assert_eq!(database.status().backend, "sqlite");
        assert!(database
            .connection
            .query_row(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workspaces'",
                [],
                |row| row.get::<_, String>(0)
            )
            .is_ok());
        for table in [
            "workspace_notes",
            "workspace_highlights",
            "workspace_index_state",
            "note_verse_ref",
            "reader_highlight",
            "sync_documents",
            "sync_snapshots",
            "sync_changes",
            "sync_queue",
            "sync_peers",
            "sync_endpoints",
            "sync_conflicts",
        ] {
            assert!(
                database
                    .connection
                    .query_row(
                        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1",
                        params![table],
                        |row| row.get::<_, String>(0)
                    )
                    .is_ok(),
                "content table {table} must exist"
            );
        }
        drop(database);

        let reopened = WorkspaceDatabase::open(&path).expect("database reopens");
        assert_eq!(reopened.status().schema_version, CURRENT_SCHEMA_VERSION);
        drop(reopened);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn workspace_records_are_transactional_and_scoped_by_id() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");
        let transaction = database
            .connection
            .transaction()
            .expect("transaction opens");
        transaction
			.execute(
				"INSERT INTO workspaces(workspace_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
				params!["workspace-a", "A", "2026-09-06T00:00:00.000Z"],
			)
			.expect("workspace inserts");
        transaction.commit().expect("transaction commits");

        let name = database
            .connection
            .query_row(
                "SELECT name FROM workspaces WHERE workspace_id = ?1",
                params!["workspace-a"],
                |row| row.get::<_, String>(0),
            )
            .expect("workspace is readable by id");
        assert_eq!(name, "A");
        assert!(database
            .connection
            .query_row::<String, _, _>(
                "SELECT name FROM workspaces WHERE workspace_id = ?1",
                params!["workspace-b"],
                |row| row.get(0),
            )
            .is_err());
        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn upgrades_schema_v1_to_content_schema_v2() {
        let path = test_path();
        fs::create_dir_all(path.parent().expect("test database has a parent"))
            .expect("create test database directory");
        let connection = Connection::open(&path).expect("create v1 database");
        connection
            .execute_batch(MIGRATION_001)
            .expect("create v1 schema");
        connection
            .pragma_update(None, "user_version", 1_i64)
            .expect("mark v1 schema");
        drop(connection);

        let database = WorkspaceDatabase::open(&path).expect("upgrade database");
        assert_eq!(database.status().schema_version, CURRENT_SCHEMA_VERSION);
        assert!(database
            .connection
            .query_row(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workspace_notes'",
                [],
                |row| row.get::<_, String>(0)
            )
            .is_ok());
        assert!(database
            .connection
            .query_row(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'sync_queue'",
                [],
                |row| row.get::<_, String>(0)
            )
            .is_ok());
        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn content_records_are_scoped_by_workspace_id() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");
        let transaction = database
            .connection
            .transaction()
            .expect("transaction opens");
        for (workspace_id, name) in [("workspace-a", "A"), ("workspace-b", "B")] {
            transaction
                .execute(
                    "INSERT INTO workspaces(workspace_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                    params![workspace_id, name, "2026-09-06T00:00:00.000Z"],
                )
                .expect("workspace inserts");
            transaction
                .execute(
                    "INSERT INTO workspace_notes(workspace_id, note_id, note_type, schema_version, payload_json, created_at, updated_at)
                     VALUES (?1, 'note-1', 'note', 1, ?2, ?3, ?3)",
                    params![workspace_id, format!(r#"{{"title":"{name}"}}"#), "2026-09-06T00:00:00.000Z"],
                )
                .expect("content inserts");
        }
        transaction.commit().expect("transaction commits");

        for (workspace_id, expected) in [("workspace-a", "A"), ("workspace-b", "B")] {
            let payload: String = database
                .connection
                .query_row(
                    "SELECT payload_json FROM workspace_notes WHERE workspace_id = ?1 AND note_id = 'note-1'",
                    params![workspace_id],
                    |row| row.get(0),
                )
                .expect("workspace content is readable");
            assert_eq!(payload, format!(r#"{{"title":"{expected}"}}"#));
        }
        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn logical_content_api_round_trips_notes_and_highlights() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");
        database
            .connection
            .execute(
                "INSERT INTO workspaces(workspace_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                params!["workspace-api", "API", "2026-09-06T00:00:00.000Z"],
            )
            .expect("workspace inserts");

        database
            .write_workspace_content(&json!({
                "kind": "note",
                "id": "note-api",
                "workspaceId": "workspace-api",
                "schemaVersion": 1,
                "payload": { "title": "API" }
            }))
            .expect("note writes through the logical API");
        database
            .write_workspace_content(&json!({
                "kind": "highlight",
                "id": "highlight-api",
                "workspaceId": "workspace-api",
                "schemaVersion": 1,
                "payload": {
                    "versionId": "nvi.sqlite",
                    "bookId": 43,
                    "chapter": 3,
                    "verseStart": 16,
                    "verseEnd": 16,
                    "styleId": "yellow"
                }
            }))
            .expect("highlight writes through the logical API");

        let records = database
            .list_workspace_content("workspace-api")
            .expect("logical content lists");
        assert_eq!(records.as_array().expect("records array").len(), 2);
        assert!(records
            .as_array()
            .expect("records array")
            .iter()
            .all(|record| record["workspaceId"] == "workspace-api"));
        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn logical_content_api_deletes_only_the_requested_note() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");
        database
            .write_workspace_content(&json!({
                "kind": "note",
                "id": "note-a",
                "workspaceId": "workspace-delete",
                "schemaVersion": 1,
                "payload": { "title": "A" }
            }))
            .expect("first note writes");
        database
            .write_workspace_content(&json!({
                "kind": "note",
                "id": "note-b",
                "workspaceId": "workspace-delete",
                "schemaVersion": 1,
                "payload": { "title": "B" }
            }))
            .expect("second note writes");

        database
            .delete_workspace_content("workspace-delete", "note", "note-a")
            .expect("note delete is transactional");
        let records = database
            .list_workspace_content("workspace-delete")
            .expect("remaining note lists");
        let ids: Vec<&str> = records
            .as_array()
            .expect("records array")
            .iter()
            .filter_map(|record| record["id"].as_str())
            .collect();
        assert_eq!(ids, vec!["note-b"]);

        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn reset_local_data_clears_content_and_sync_state() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");

        database
            .write_workspace_content(&json!({
                "kind": "note",
                "id": "note-reset",
                "workspaceId": "workspace-reset",
                "schemaVersion": 1,
                "payload": { "title": "Será removida" }
            }))
            .expect("note writes");
        database
            .sync_write_snapshot(
                "workspace-reset",
                "note-reset",
                1,
                &json!({ "title": "Será removida" }),
                &["head-reset".to_string()],
            )
            .expect("snapshot writes");

        database.reset_local_data().expect("local reset commits");

        let content = database
            .list_workspace_content("workspace-reset")
            .expect("content remains queryable after reset");
        assert!(content.as_array().expect("content array").is_empty());
        assert_eq!(
            database
                .connection
                .query_row("SELECT COUNT(*) FROM workspaces", [], |row| row
                    .get::<_, i64>(0))
                .expect("workspace count is readable"),
            0
        );
        assert!(database
            .connection
            .query_row(
                "SELECT workspace_id FROM active_workspace_pointer WHERE pointer_id = 1",
                [],
                |row| row.get::<_, Option<String>>(0),
            )
            .expect("active pointer is readable")
            .is_none());

        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn sync_operational_api_persists_note_snapshot_and_queue_by_workspace() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");

        database
            .sync_write_note(
                "workspace-sync-a",
                "note-1",
                1,
                &json!({ "title": "Nota local" }),
                None,
                None,
            )
            .expect("note is persisted in app.sqlite");
        database
            .sync_write_snapshot(
                "workspace-sync-a",
                "note-1",
                1,
                &json!({ "title": "Nota local" }),
                &["head-1".to_string()],
            )
            .expect("snapshot is persisted");
        database
            .sync_append_change("workspace-sync-a", "note-1", "change-1", b"delta")
            .expect("change is queued");
        database
            .sync_append_change("workspace-sync-a", "note-1", "change-1", b"delta")
            .expect("duplicate change is idempotent");

        let state = database
            .sync_read_state("workspace-sync-a", "note-1")
            .expect("sync state is readable");
        assert_eq!(state["backend"], "sqlite");
        assert_eq!(state["databaseName"], APP_DATABASE_FILE);
        assert_eq!(state["note"]["workspaceId"], "workspace-sync-a");
        assert_eq!(state["snapshot"]["snapshotVersion"], 1);
        assert_eq!(state["snapshot"]["heads"][0], "head-1");
        assert_eq!(state["queue"]["pendingCount"], 1);
        assert_eq!(state["queue"]["bytes"], 5);

        let other_workspace = database
            .sync_read_state("workspace-sync-b", "note-1")
            .expect("other workspace remains readable");
        assert!(other_workspace["note"].is_null());
        assert!(database
            .sync_write_note(
                "workspace-sync-a/other",
                "note-2",
                1,
                &json!({}),
                None,
                None,
            )
            .is_err());

        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn reader_highlights_use_the_native_database_and_are_scoped_by_workspace_id() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");

        database
            .query_reader_highlights(
                "workspace-a",
                "upsert_highlight",
                Some("nvi.sqlite"),
                Some(43),
                Some(3),
                Some(16),
                Some(16),
                Some("pen-gold"),
            )
            .expect("highlight is stored");

        let workspace_a = database
            .query_reader_highlights(
                "workspace-a",
                "list_highlights",
                Some("nvi.sqlite"),
                Some(43),
                Some(3),
                None,
                None,
                None,
            )
            .expect("highlight is listed");
        assert_eq!(workspace_a.as_array().expect("array").len(), 1);

        let workspace_b = database
            .query_reader_highlights(
                "workspace-b",
                "list_highlights",
                Some("nvi.sqlite"),
                Some(43),
                Some(3),
                None,
                None,
                None,
            )
            .expect("other workspace is listed");
        assert!(workspace_b.as_array().expect("array").is_empty());

        database
            .query_reader_highlights(
                "workspace-a",
                "delete_highlight",
                Some("nvi.sqlite"),
                Some(43),
                Some(3),
                Some(16),
                Some(16),
                None,
            )
            .expect("highlight is deleted");
        let after_delete = database
            .query_reader_highlights(
                "workspace-a",
                "list_highlights",
                None,
                None,
                None,
                None,
                None,
                None,
            )
            .expect("workspace remains readable");
        assert!(after_delete.as_array().expect("array").is_empty());

        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }

    #[test]
    fn deletes_one_workspace_and_clears_only_its_active_pointer() {
        let path = test_path();
        let mut database = WorkspaceDatabase::open(&path).expect("database opens");
        let transaction = database
            .connection
            .transaction()
            .expect("transaction opens");
        transaction
            .execute(
                "INSERT INTO workspaces(workspace_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                params!["workspace-a", "A", "2026-09-06T00:00:00.000Z"],
            )
            .expect("workspace a inserts");
        transaction
            .execute(
                "INSERT INTO workspaces(workspace_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?3)",
                params!["workspace-b", "B", "2026-09-06T00:00:00.000Z"],
            )
            .expect("workspace b inserts");
        transaction
            .execute(
                "UPDATE active_workspace_pointer SET workspace_id = ?1 WHERE pointer_id = 1",
                params!["workspace-a"],
            )
            .expect("pointer updates");
        transaction.commit().expect("transaction commits");

        database
            .delete_workspace("workspace-a")
            .expect("workspace deletes transactionally");
        assert!(database
            .connection
            .query_row::<String, _, _>(
                "SELECT workspace_id FROM workspaces WHERE workspace_id = ?1",
                params!["workspace-a"],
                |row| row.get(0),
            )
            .is_err());
        assert_eq!(
            database
                .connection
                .query_row(
                    "SELECT workspace_id FROM workspaces WHERE workspace_id = ?1",
                    params!["workspace-b"],
                    |row| row.get::<_, String>(0),
                )
                .expect("workspace b remains"),
            "workspace-b"
        );
        assert!(database
            .connection
            .query_row::<Option<String>, _, _>(
                "SELECT workspace_id FROM active_workspace_pointer WHERE pointer_id = 1",
                [],
                |row| row.get(0),
            )
            .expect("pointer remains")
            .is_none());
        drop(database);
        let _ = fs::remove_dir_all(path.parent().expect("test database has a parent"));
    }
}

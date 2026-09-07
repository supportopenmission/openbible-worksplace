use super::workspace::CommandError;
use crate::database::WorkspaceDatabase;
use serde_json::Value;
use std::sync::Mutex;
use tauri::State;

type DatabaseState = Mutex<Option<WorkspaceDatabase>>;

fn database_error() -> CommandError {
    CommandError::new("persistence_conflict", true)
}

#[tauri::command]
pub fn sync_write_note(
    workspace_id: String,
    note_id: String,
    schema_version: i64,
    payload: Value,
    created_at: Option<String>,
    updated_at: Option<String>,
    state: State<'_, DatabaseState>,
) -> Result<Value, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .sync_write_note(
            &workspace_id,
            &note_id,
            schema_version,
            &payload,
            created_at.as_deref(),
            updated_at.as_deref(),
        )
        .map_err(|_| database_error())
}

#[tauri::command]
pub fn sync_write_snapshot(
    workspace_id: String,
    note_id: String,
    snapshot_version: i64,
    state_json: Value,
    heads: Vec<String>,
    state: State<'_, DatabaseState>,
) -> Result<Value, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .sync_write_snapshot(
            &workspace_id,
            &note_id,
            snapshot_version,
            &state_json,
            &heads,
        )
        .map_err(|_| database_error())
}

#[tauri::command]
pub fn sync_append_change(
    workspace_id: String,
    note_id: String,
    change_id: String,
    change_blob: Vec<u8>,
    state: State<'_, DatabaseState>,
) -> Result<Value, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .sync_append_change(&workspace_id, &note_id, &change_id, &change_blob)
        .map_err(|_| database_error())
}

#[tauri::command]
pub fn sync_read_state(
    workspace_id: String,
    note_id: String,
    state: State<'_, DatabaseState>,
) -> Result<Value, CommandError> {
    let mut database_state = state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database_state
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    database
        .sync_read_state(&workspace_id, &note_id)
        .map_err(|_| database_error())
}

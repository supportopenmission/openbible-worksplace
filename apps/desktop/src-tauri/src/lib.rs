mod commands;
mod database;

use commands::workspace::WorkspaceContext;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(Mutex::new(WorkspaceContext::default()))
        .manage(Mutex::new(Option::<database::WorkspaceDatabase>::None))
        .invoke_handler(tauri::generate_handler![
            database::initialize_workspace_database,
            database::delete_workspace_record,
            database::list_workspace_content,
            database::write_workspace_content,
            commands::workspace::initialize_workspace,
            commands::workspace::read_workspace_file,
            commands::workspace::list_workspace_files,
            commands::workspace::list_workspace_entries,
            commands::workspace::delete_workspace_file,
            commands::workspace::delete_managed_workspace,
            commands::workspace::write_workspace_file,
            commands::workspace::query_workspace_index,
            commands::workspace::read_bible_verses,
            commands::workspace::inspect_bible,
            commands::workspace::release_workspace_lock,
            commands::migration::migrate_workspace,
            commands::sync::sync_write_note,
            commands::sync::sync_write_snapshot,
            commands::sync::sync_append_change,
            commands::sync::sync_read_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running OpenBible desktop application");
}

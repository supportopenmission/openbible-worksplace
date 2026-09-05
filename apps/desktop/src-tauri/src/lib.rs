mod commands;

use commands::workspace::WorkspaceContext;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.plugin(tauri_plugin_dialog::init())
		.plugin(tauri_plugin_updater::Builder::new().build())
		.plugin(tauri_plugin_process::init())
		.manage(Mutex::new(WorkspaceContext::default()))
		.invoke_handler(tauri::generate_handler![
			commands::workspace::initialize_workspace,
			commands::workspace::read_workspace_file,
			commands::workspace::list_workspace_files,
			commands::workspace::write_workspace_file,
			commands::workspace::query_workspace_index,
			commands::workspace::read_bible_verses,
			commands::workspace::inspect_bible,
			commands::workspace::release_workspace_lock,
			commands::migration::migrate_workspace
		])
		.run(tauri::generate_context!())
		.expect("error while running OpenBible desktop application");
}

use super::workspace::CommandError;
use serde::Serialize;
use std::fs;
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationResult {
	pub state: String,
	pub source_preserved: bool,
	pub retryable: bool,
	pub copied_entries: usize,
}

fn absolute(path: &str) -> Result<PathBuf, CommandError> {
	let value = PathBuf::from(path);
	if !value.is_absolute() || value.components().any(|part| matches!(part, Component::ParentDir)) {
		return Err(CommandError::new("invalid_migration_path", false));
	}
	Ok(value)
}

fn copy_tree(source: &Path, destination: &Path) -> Result<usize, CommandError> {
	if !source.is_dir() || source == destination {
		return Err(CommandError::new("invalid_migration_source", true));
	}
	fs::create_dir_all(destination)?;
	let mut count = 0;
	for entry in fs::read_dir(source)? {
		let entry = entry?;
		let from = entry.path();
		let to = destination.join(entry.file_name());
		if from.is_dir() {
			count += copy_tree(&from, &to)?;
		} else {
			if let Some(parent) = to.parent() { fs::create_dir_all(parent)?; }
			fs::copy(from, to)?;
			count += 1;
		}
	}
	Ok(count)
}

#[tauri::command]
pub fn migrate_workspace(source: String, destination: String) -> Result<MigrationResult, CommandError> {
	let source = absolute(&source)?;
	let destination = absolute(&destination)?;
	let staging = destination.with_extension("openbible-migration");
	let _ = fs::remove_dir_all(&staging);
	match copy_tree(&source, &staging) {
		Ok(copied_entries) => {
			if destination.exists() {
				return Err(CommandError::new("destination_exists", true));
			}
			fs::rename(&staging, &destination)?;
			Ok(MigrationResult { state: "completed".into(), source_preserved: true, retryable: false, copied_entries })
		}
		Err(error) => {
			let _ = fs::remove_dir_all(&staging);
			Err(error)
		}
	}
}

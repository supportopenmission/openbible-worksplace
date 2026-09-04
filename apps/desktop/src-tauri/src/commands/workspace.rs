use crate::commands::lock::{self, LockError, WorkspaceLock};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;

const FORMAT_VERSION: u32 = 1;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MigrationState {
	NotStarted,
	Completed,
	Error,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceConfig {
	pub path: String,
	pub storage_kind: String,
	pub format_version: u32,
	pub migration_state: MigrationState,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileWriteResult {
	pub ok: bool,
	pub size: usize,
}

#[derive(Debug, Serialize)]
pub struct BibleVerse {
	pub verse: i64,
	pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BibleBookInfo {
	pub id: i64,
	pub name: String,
	pub abbreviation: String,
	pub chapters: Vec<i64>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BibleInfo {
	pub name: String,
	pub books: Vec<BibleBookInfo>,
}

#[derive(Debug, Serialize)]
pub struct CommandError {
	pub code: String,
	pub message: String,
	pub recoverable: bool,
}

impl CommandError {
	pub(crate) fn new(code: impl Into<String>, recoverable: bool) -> Self {
		let code = code.into();
		Self { message: code.clone(), code, recoverable }
	}
}

impl From<std::io::Error> for CommandError {
	fn from(_: std::io::Error) -> Self {
		Self::new("io_error", true)
	}
}

impl From<LockError> for CommandError {
	fn from(error: LockError) -> Self {
		Self::new(error.code(), true)
	}
}

#[derive(Default)]
pub struct WorkspaceContext {
	pub root: Option<PathBuf>,
	pub lock: Option<WorkspaceLock>,
}

fn default_workspace_path() -> Result<PathBuf, CommandError> {
	let home = std::env::var_os("HOME").ok_or_else(|| CommandError::new("home_unavailable", true))?;
	Ok(PathBuf::from(home).join("Library/Application Support/OpenBible/workspace"))
}

fn validate_root(path: &Path) -> Result<PathBuf, CommandError> {
	if path.as_os_str().is_empty() || !path.is_absolute() {
		return Err(CommandError::new("invalid_workspace", true));
	}
	fs::create_dir_all(path)?;
	let canonical = path.canonicalize()?;
	if !canonical.is_dir() {
		return Err(CommandError::new("invalid_workspace", true));
	}
	Ok(canonical)
}

fn relative_path(path: &str) -> Result<PathBuf, CommandError> {
	let candidate = Path::new(path);
	if candidate.is_absolute() || candidate.components().any(|component| matches!(component, Component::ParentDir)) {
		return Err(CommandError::new("path_outside_workspace", false));
	}
	Ok(candidate.to_path_buf())
}

fn require_root(context: &WorkspaceContext) -> Result<&Path, CommandError> {
	context.root.as_deref().ok_or_else(|| CommandError::new("workspace_not_initialized", true))
}

pub fn initialize(context: &mut WorkspaceContext, preferred_path: Option<String>) -> Result<WorkspaceConfig, CommandError> {
	let path = match preferred_path {
		Some(value) => PathBuf::from(value),
		None => default_workspace_path()?,
	};
	let root = validate_root(&path)?;
	fs::create_dir_all(root.join(".openbible"))?;
	fs::create_dir_all(root.join("bibles"))?;
	fs::create_dir_all(root.join("notes"))?;
	fs::create_dir_all(root.join("trash"))?;
	let lock = lock::acquire(&root)?;
	context.root = Some(root.clone());
	context.lock = Some(lock);
	let config = WorkspaceConfig {
		path: root.to_string_lossy().into_owned(),
		storage_kind: "native".to_string(),
		format_version: FORMAT_VERSION,
		migration_state: MigrationState::NotStarted,
	};
	let bytes = serde_json::to_vec_pretty(&config).map_err(|_| CommandError::new("config_encode_error", true))?;
	atomic_write(&root.join(".openbible/config.json"), &bytes)?;
	Ok(config)
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), CommandError> {
	let temp = path.with_extension("tmp");
	fs::write(&temp, bytes)?;
	fs::rename(temp, path)?;
	Ok(())
}

pub fn read_file(context: &WorkspaceContext, path: String) -> Result<Vec<u8>, CommandError> {
	let root = require_root(context)?;
	let relative = relative_path(&path)?;
	Ok(fs::read(root.join(relative))?)
}

pub fn list_files(context: &WorkspaceContext, path: String) -> Result<Vec<String>, CommandError> {
	let root = require_root(context)?;
	let relative = relative_path(&path)?;
	let directory = root.join(relative);
	let mut files = fs::read_dir(directory)
		.map_err(|_| CommandError::new("io_error", true))?
		.filter_map(Result::ok)
		.filter(|entry| entry.file_type().map(|kind| kind.is_file()).unwrap_or(false))
		.filter_map(|entry| entry.file_name().into_string().ok())
		.collect::<Vec<_>>();
	files.sort();
	Ok(files)
}

pub fn write_file(context: &WorkspaceContext, path: String, bytes: Vec<u8>) -> Result<FileWriteResult, CommandError> {
	let root = require_root(context)?;
	let relative = relative_path(&path)?;
	let target = root.join(relative);
	if let Some(parent) = target.parent() {
		fs::create_dir_all(parent)?;
	}
	atomic_write(&target, &bytes)?;
	Ok(FileWriteResult { ok: true, size: bytes.len() })
}

pub fn query_index(context: &WorkspaceContext, operation: String, version_id: Option<String>, book_id: Option<i64>, chapter: Option<i64>, verse_start: Option<i64>, verse_end: Option<i64>, style_id: Option<String>) -> Result<serde_json::Value, CommandError> {
	let root = require_root(context)?;
	let connection = Connection::open(root.join(".openbible/index.sqlite")).map_err(|_| CommandError::new("sqlite_error", true))?;
	connection.execute_batch("CREATE TABLE IF NOT EXISTS reader_highlight (id INTEGER PRIMARY KEY AUTOINCREMENT, version_id TEXT NOT NULL, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse_start INTEGER NOT NULL, verse_end INTEGER NOT NULL, style_id TEXT NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS idx_reader_highlight_range ON reader_highlight(version_id, book_id, chapter, verse_start, verse_end);").map_err(|_| CommandError::new("sqlite_error", true))?;
	match operation.as_str() {
		"list_highlights" => {
			let mut statement = connection
				.prepare(if version_id.as_deref().unwrap_or_default().is_empty() { "SELECT version_id, book_id, chapter, verse_start, verse_end, style_id FROM reader_highlight ORDER BY version_id, book_id, chapter, verse_start" } else { "SELECT version_id, book_id, chapter, verse_start, verse_end, style_id FROM reader_highlight WHERE version_id = ?1 AND book_id = ?2 AND chapter = ?3 ORDER BY verse_start" })
				.map_err(|_| CommandError::new("sqlite_error", true))?;
			let values = if version_id.as_deref().unwrap_or_default().is_empty() {
				statement.query_map([], |row| Ok(serde_json::json!({"versionId": row.get::<_, String>(0)?, "bookId": row.get::<_, i64>(1)?, "chapter": row.get::<_, i64>(2)?, "verseStart": row.get::<_, i64>(3)?, "verseEnd": row.get::<_, i64>(4)?, "styleId": row.get::<_, String>(5)?}))).map_err(|_| CommandError::new("sqlite_error", true))?.filter_map(Result::ok).collect::<Vec<_>>()
			} else {
				statement.query_map(params![version_id.unwrap_or_default(), book_id.unwrap_or_default(), chapter.unwrap_or_default()], |row| Ok(serde_json::json!({"versionId": row.get::<_, String>(0)?, "bookId": row.get::<_, i64>(1)?, "chapter": row.get::<_, i64>(2)?, "verseStart": row.get::<_, i64>(3)?, "verseEnd": row.get::<_, i64>(4)?, "styleId": row.get::<_, String>(5)?}))).map_err(|_| CommandError::new("sqlite_error", true))?.filter_map(Result::ok).collect::<Vec<_>>()
			};
			Ok(serde_json::Value::Array(values))
		}
		"upsert_highlight" => {
			connection.execute("INSERT INTO reader_highlight (version_id, book_id, chapter, verse_start, verse_end, style_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(version_id, book_id, chapter, verse_start, verse_end) DO UPDATE SET style_id = excluded.style_id", params![version_id.unwrap_or_default(), book_id.unwrap_or_default(), chapter.unwrap_or_default(), verse_start.unwrap_or_default(), verse_end.unwrap_or_default(), style_id.unwrap_or_else(|| "default".into())])
				.map_err(|_| CommandError::new("sqlite_error", true))?;
			Ok(serde_json::json!({"ok": true}))
		}
		"delete_highlight" => {
			connection.execute("DELETE FROM reader_highlight WHERE version_id = ?1 AND book_id = ?2 AND chapter = ?3 AND verse_start = ?4 AND verse_end = ?5", params![version_id.unwrap_or_default(), book_id.unwrap_or_default(), chapter.unwrap_or_default(), verse_start.unwrap_or_default(), verse_end.unwrap_or_default()]).map_err(|_| CommandError::new("sqlite_error", true))?;
			Ok(serde_json::json!({"ok": true}))
		}
		_ => Err(CommandError::new("command_not_allowed", false)),
	}
}

pub fn read_bible(context: &WorkspaceContext, version: String, book_id: i64, chapter: i64) -> Result<Vec<BibleVerse>, CommandError> {
	let root = require_root(context)?;
	let relative = relative_path(&format!("bibles/{version}"))?;
	let connection = Connection::open_with_flags(root.join(relative), rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|_| CommandError::new("sqlite_error", true))?;
	let mut statement = connection.prepare("SELECT verse, text FROM verse WHERE book_id = ?1 AND chapter = ?2 ORDER BY verse").map_err(|_| CommandError::new("sqlite_error", true))?;
	let rows = statement.query_map(params![book_id, chapter], |row| Ok(BibleVerse { verse: row.get(0)?, text: row.get(1)? })).map_err(|_| CommandError::new("sqlite_error", true))?;
	rows.collect::<Result<Vec<_>, _>>().map_err(|_| CommandError::new("sqlite_error", true))
}

pub fn inspect_bible_impl(context: &WorkspaceContext, version: String) -> Result<BibleInfo, CommandError> {
	let root = require_root(context)?;
	let relative = relative_path(&format!("bibles/{version}"))?;
	let connection = Connection::open_with_flags(root.join(relative), rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY).map_err(|_| CommandError::new("sqlite_error", true))?;
	let name = connection.query_row("SELECT value FROM metadata WHERE key = 'name' LIMIT 1", [], |row| row.get::<_, String>(0)).unwrap_or(version);
	let mut books_query = connection.prepare("SELECT id, name, COALESCE(abbreviation, '') FROM book ORDER BY id").map_err(|_| CommandError::new("sqlite_error", true))?;
	let book_rows = books_query.query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))).map_err(|_| CommandError::new("sqlite_error", true))?.collect::<Result<Vec<_>, _>>().map_err(|_| CommandError::new("sqlite_error", true))?;
	drop(books_query);
	let mut books = Vec::with_capacity(book_rows.len());
	for (id, book_name, abbreviation) in book_rows {
		let mut chapters_query = connection.prepare("SELECT DISTINCT chapter FROM verse WHERE book_id = ?1 ORDER BY chapter").map_err(|_| CommandError::new("sqlite_error", true))?;
		let chapters = chapters_query.query_map([id], |chapter| chapter.get::<_, i64>(0)).map_err(|_| CommandError::new("sqlite_error", true))?.collect::<Result<Vec<_>, _>>().map_err(|_| CommandError::new("sqlite_error", true))?;
		books.push(BibleBookInfo { id, name: book_name, abbreviation, chapters });
	}
	Ok(BibleInfo { name, books })
}

#[tauri::command]
pub fn initialize_workspace(state: tauri::State<'_, Mutex<WorkspaceContext>>, preferred_path: Option<String>) -> Result<WorkspaceConfig, CommandError> {
	let mut context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	initialize(&mut context, preferred_path)
}

#[tauri::command]
pub fn read_workspace_file(state: tauri::State<'_, Mutex<WorkspaceContext>>, relative_path: String) -> Result<Vec<u8>, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	read_file(&context, relative_path)
}

#[tauri::command]
pub fn list_workspace_files(state: tauri::State<'_, Mutex<WorkspaceContext>>, relative_path: String) -> Result<Vec<String>, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	list_files(&context, relative_path)
}

#[tauri::command]
pub fn write_workspace_file(state: tauri::State<'_, Mutex<WorkspaceContext>>, relative_path: String, bytes: Vec<u8>) -> Result<FileWriteResult, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	write_file(&context, relative_path, bytes)
}

#[tauri::command]
pub fn query_workspace_index(state: tauri::State<'_, Mutex<WorkspaceContext>>, operation: String, version_id: Option<String>, book_id: Option<i64>, chapter: Option<i64>, verse_start: Option<i64>, verse_end: Option<i64>, style_id: Option<String>) -> Result<serde_json::Value, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	query_index(&context, operation, version_id, book_id, chapter, verse_start, verse_end, style_id)
}

#[tauri::command]
pub fn read_bible_verses(state: tauri::State<'_, Mutex<WorkspaceContext>>, version: String, book_id: i64, chapter: i64) -> Result<Vec<BibleVerse>, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	read_bible(&context, version, book_id, chapter)
}

#[tauri::command]
pub fn inspect_bible(state: tauri::State<'_, Mutex<WorkspaceContext>>, version: String) -> Result<BibleInfo, CommandError> {
	let context = state.lock().map_err(|_| CommandError::new("state_error", true))?;
	inspect_bible_impl(&context, version)
}

use crate::commands::lock::{self, LockError, WorkspaceLock};
use crate::database::WorkspaceDatabase;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

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
#[serde(rename_all = "camelCase")]
pub struct WorkspaceEntry {
    pub name: String,
    pub kind: String,
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
        Self {
            message: code.clone(),
            code,
            recoverable,
        }
    }
}

impl From<std::io::Error> for CommandError {
    fn from(error: std::io::Error) -> Self {
        let mut command_error = Self::new("io_error", true);
        command_error.message = format!("io_error: {}", error.kind());
        command_error
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

fn workspace_config(root: &Path) -> WorkspaceConfig {
    WorkspaceConfig {
        path: root.to_string_lossy().into_owned(),
        storage_kind: "native".to_string(),
        format_version: FORMAT_VERSION,
        migration_state: MigrationState::NotStarted,
    }
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
    if candidate.is_absolute()
        || candidate
            .components()
            .any(|component| matches!(component, Component::ParentDir))
    {
        return Err(CommandError::new("path_outside_workspace", false));
    }
    Ok(candidate.to_path_buf())
}

fn require_root(context: &WorkspaceContext) -> Result<&Path, CommandError> {
    context
        .root
        .as_deref()
        .ok_or_else(|| CommandError::new("workspace_not_initialized", true))
}

pub fn initialize(
    context: &mut WorkspaceContext,
    preferred_path: Option<String>,
) -> Result<WorkspaceConfig, CommandError> {
    let path = preferred_path
        .map(PathBuf::from)
        .ok_or_else(|| CommandError::new("workspace_path_required", true))?;
    let root = validate_root(&path)?;
    if context.root.as_deref() == Some(root.as_path()) && context.lock.is_some() {
        return Ok(workspace_config(&root));
    }
    fs::create_dir_all(root.join(".openbible"))?;
    fs::create_dir_all(root.join("bibles"))?;
    let lock = lock::acquire(&root)?;
    context.root = Some(root.clone());
    context.lock = Some(lock);
    let config = workspace_config(&root);
    let config_path = root.join(".openbible/config.json");
    if !config_path.exists() {
        let bytes = serde_json::to_vec_pretty(&config)
            .map_err(|_| CommandError::new("config_encode_error", true))?;
        atomic_write(&config_path, &bytes)?;
    }
    Ok(config)
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), CommandError> {
    let temp = path.with_extension("tmp");
    fs::write(&temp, bytes)?;
    fs::rename(temp, path)?;
    Ok(())
}

pub fn read_file(
    context: &WorkspaceContext,
    path: String,
) -> Result<Option<Vec<u8>>, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&path)?;
    match fs::read(root.join(relative)) {
        Ok(bytes) => Ok(Some(bytes)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(CommandError::from(error)),
    }
}

pub fn list_files(context: &WorkspaceContext, path: String) -> Result<Vec<String>, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&path)?;
    let directory = root.join(relative);
    let mut files = fs::read_dir(directory)
        .map_err(CommandError::from)?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry
                .file_type()
                .map(|kind| kind.is_file())
                .unwrap_or(false)
        })
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect::<Vec<_>>();
    files.sort();
    Ok(files)
}

pub fn list_entries(
    context: &WorkspaceContext,
    path: String,
) -> Result<Vec<WorkspaceEntry>, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&path)?;
    let directory = root.join(relative);
    let mut entries = fs::read_dir(directory)
        .map_err(CommandError::from)?
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let kind = entry.file_type().ok().and_then(|file_type| {
                if file_type.is_file() {
                    Some("file")
                } else if file_type.is_dir() {
                    Some("directory")
                } else {
                    None
                }
            })?;
            Some(WorkspaceEntry {
                name: entry.file_name().into_string().ok()?,
                kind: kind.to_string(),
            })
        })
        .collect::<Vec<_>>();
    entries.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(entries)
}

pub fn delete_file(context: &WorkspaceContext, path: String) -> Result<(), CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&path)?;
    fs::remove_file(root.join(relative))?;
    Ok(())
}

const MANAGED_TOP_LEVEL: &[&str] = &[
    ".openbible",
    "bibles",
    "notes",
    "sermons",
    "studies",
    "templates",
    "attachments",
    "trash",
];

/// Exclusão fail-closed da raiz dedicada: exige lock desta sessão, manifesto
/// v2 com ID correspondente e `managedRoot`, e varredura sem desconhecidos.
/// Qualquer dúvida bloqueia sem opção de força (recuperável = falso).
pub fn delete_managed_root(
    context: &mut WorkspaceContext,
    workspace_id: String,
) -> Result<bool, CommandError> {
    let root = require_root(context)?.to_path_buf();
    if context.lock.is_none() {
        return Err(CommandError::new("workspace_locked", true));
    }
    let manifest_bytes = fs::read(root.join(".openbible/config.json"))
        .map_err(|_| CommandError::new("not_managed", false))?;
    let manifest: serde_json::Value = serde_json::from_slice(&manifest_bytes)
        .map_err(|_| CommandError::new("not_managed", false))?;
    let id_matches =
        manifest.get("workspaceId").and_then(|value| value.as_str()) == Some(workspace_id.as_str());
    let managed = manifest
        .get("managedRoot")
        .and_then(|value| value.as_bool())
        .unwrap_or(false);
    let is_v2 = manifest
        .get("formatVersion")
        .and_then(|value| value.as_u64())
        == Some(2);
    if !id_matches || !managed || !is_v2 {
        return Err(CommandError::new("not_managed", false));
    }
    let mut unknown: Vec<String> = Vec::new();
    let entries = fs::read_dir(&root).map_err(|_| CommandError::new("scan_error", false))?;
    for entry in entries {
        let entry = entry.map_err(|_| CommandError::new("scan_error", false))?;
        let name = entry
            .file_name()
            .into_string()
            .map_err(|_| CommandError::new("scan_error", false))?;
        if !MANAGED_TOP_LEVEL.contains(&name.as_str()) {
            unknown.push(name);
        }
    }
    if !unknown.is_empty() {
        return Err(CommandError::new("unknown_files", false));
    }
    fs::remove_dir_all(&root).map_err(|_| CommandError::new("scan_error", false))?;
    context.root = None;
    context.lock.take();
    Ok(true)
}

pub fn write_file(
    context: &WorkspaceContext,
    path: String,
    bytes: Vec<u8>,
) -> Result<FileWriteResult, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&path)?;
    let target = root.join(relative);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent)?;
    }
    atomic_write(&target, &bytes)?;
    Ok(FileWriteResult {
        ok: true,
        size: bytes.len(),
    })
}

pub fn query_index(
    context: &WorkspaceContext,
    database: &mut WorkspaceDatabase,
    operation: String,
    workspace_id: Option<String>,
    version_id: Option<String>,
    book_id: Option<i64>,
    chapter: Option<i64>,
    verse_start: Option<i64>,
    verse_end: Option<i64>,
    style_id: Option<String>,
) -> Result<serde_json::Value, CommandError> {
    let _ = require_root(context)?;
    let workspace_id = workspace_id
        .filter(|value| !value.trim().is_empty())
        .ok_or_else(|| CommandError::new("workspace_id_required", true))?;
    database
        .query_reader_highlights(
            &workspace_id,
            &operation,
            version_id.as_deref(),
            book_id,
            chapter,
            verse_start,
            verse_end,
            style_id.as_deref(),
        )
        .map_err(|_| CommandError::new("sqlite_error", true))
}

pub fn read_bible(
    context: &WorkspaceContext,
    version: String,
    book_id: i64,
    chapter: i64,
) -> Result<Vec<BibleVerse>, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&format!("bibles/{version}"))?;
    let connection = Connection::open_with_flags(
        root.join(relative),
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .map_err(|_| CommandError::new("sqlite_error", true))?;
    let mut statement = connection
        .prepare("SELECT verse, text FROM verse WHERE book_id = ?1 AND chapter = ?2 ORDER BY verse")
        .map_err(|_| CommandError::new("sqlite_error", true))?;
    let rows = statement
        .query_map(params![book_id, chapter], |row| {
            Ok(BibleVerse {
                verse: row.get(0)?,
                text: row.get(1)?,
            })
        })
        .map_err(|_| CommandError::new("sqlite_error", true))?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|_| CommandError::new("sqlite_error", true))
}

pub fn inspect_bible_impl(
    context: &WorkspaceContext,
    version: String,
) -> Result<BibleInfo, CommandError> {
    let root = require_root(context)?;
    let relative = relative_path(&format!("bibles/{version}"))?;
    let connection = Connection::open_with_flags(
        root.join(relative),
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .map_err(|_| CommandError::new("sqlite_error", true))?;
    let name = connection
        .query_row(
            "SELECT value FROM metadata WHERE key = 'name' LIMIT 1",
            [],
            |row| row.get::<_, String>(0),
        )
        .unwrap_or(version);
    let book_columns = table_columns(&connection, "book")?;
    let has_abbreviation = book_columns
        .iter()
        .any(|column| column.eq_ignore_ascii_case("abbreviation"));
    let mut books_query = connection
        .prepare(if has_abbreviation {
            "SELECT id, name, abbreviation FROM book ORDER BY id"
        } else {
            "SELECT id, name FROM book ORDER BY id"
        })
        .map_err(|_| CommandError::new("sqlite_error", true))?;
    let book_rows = if has_abbreviation {
        books_query
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                ))
            })
            .map_err(|_| CommandError::new("sqlite_error", true))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| CommandError::new("sqlite_error", true))?
    } else {
        books_query
            .query_map([], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    String::new(),
                ))
            })
            .map_err(|_| CommandError::new("sqlite_error", true))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| CommandError::new("sqlite_error", true))?
    };
    drop(books_query);
    let mut books = Vec::with_capacity(book_rows.len());
    for (id, book_name, abbreviation) in book_rows {
        let mut chapters_query = connection
            .prepare("SELECT DISTINCT chapter FROM verse WHERE book_id = ?1 ORDER BY chapter")
            .map_err(|_| CommandError::new("sqlite_error", true))?;
        let chapters = chapters_query
            .query_map([id], |chapter| chapter.get::<_, i64>(0))
            .map_err(|_| CommandError::new("sqlite_error", true))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|_| CommandError::new("sqlite_error", true))?;
        books.push(BibleBookInfo {
            id,
            name: book_name,
            abbreviation,
            chapters,
        });
    }
    Ok(BibleInfo { name, books })
}

fn table_columns(connection: &Connection, table: &str) -> Result<Vec<String>, CommandError> {
    let pragma = match table {
        "book" | "verse" => format!("PRAGMA table_info({table})"),
        _ => return Err(CommandError::new("command_not_allowed", false)),
    };
    let mut statement = connection
        .prepare(&pragma)
        .map_err(|_| CommandError::new("sqlite_error", true))?;
    let columns = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|_| CommandError::new("sqlite_error", true))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| CommandError::new("sqlite_error", true))?;
    Ok(columns)
}

#[tauri::command]
pub fn initialize_workspace(
    app: AppHandle,
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    preferred_path: Option<String>,
) -> Result<WorkspaceConfig, CommandError> {
    let mut context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    let path = match preferred_path {
        Some(path) => Some(path),
        None => Some(
            app.path()
                .app_data_dir()
                .map_err(|_| CommandError::new("app_data_dir_unavailable", true))?
                .join("workspace")
                .to_string_lossy()
                .into_owned(),
        ),
    };
    initialize(&mut context, path)
}

#[tauri::command]
pub fn read_workspace_file(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    relative_path: String,
) -> Result<Option<Vec<u8>>, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    read_file(&context, relative_path)
}

#[tauri::command]
pub fn list_workspace_files(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    relative_path: String,
) -> Result<Vec<String>, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    list_files(&context, relative_path)
}

#[tauri::command]
pub fn list_workspace_entries(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    relative_path: String,
) -> Result<Vec<WorkspaceEntry>, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    list_entries(&context, relative_path)
}

#[tauri::command]
pub fn delete_workspace_file(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    relative_path: String,
) -> Result<(), CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    delete_file(&context, relative_path)
}

#[tauri::command]
pub fn delete_managed_workspace(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    workspace_id: String,
) -> Result<bool, CommandError> {
    let mut context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    delete_managed_root(&mut context, workspace_id)
}

#[tauri::command]
pub fn write_workspace_file(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    relative_path: String,
    bytes: Vec<u8>,
) -> Result<FileWriteResult, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    write_file(&context, relative_path, bytes)
}

#[tauri::command]
pub fn query_workspace_index(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    database_state: tauri::State<'_, Mutex<Option<WorkspaceDatabase>>>,
    operation: String,
    workspace_id: Option<String>,
    version_id: Option<String>,
    book_id: Option<i64>,
    chapter: Option<i64>,
    verse_start: Option<i64>,
    verse_end: Option<i64>,
    style_id: Option<String>,
) -> Result<serde_json::Value, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    let mut database = database_state
        .lock()
        .map_err(|_| CommandError::new("database_state_error", true))?;
    let database = database
        .as_mut()
        .ok_or_else(|| CommandError::new("database_unavailable", true))?;
    query_index(
        &context,
        database,
        operation,
        workspace_id,
        version_id,
        book_id,
        chapter,
        verse_start,
        verse_end,
        style_id,
    )
}

#[tauri::command]
pub fn read_bible_verses(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    version: String,
    book_id: i64,
    chapter: i64,
) -> Result<Vec<BibleVerse>, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    read_bible(&context, version, book_id, chapter)
}

#[tauri::command]
pub fn release_workspace_lock(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
) -> Result<bool, CommandError> {
    let mut context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    if let Some(lock) = context.lock.take() {
        lock::release(lock).map_err(CommandError::from)?;
        return Ok(true);
    }
    Ok(false)
}

#[tauri::command]
pub fn inspect_bible(
    state: tauri::State<'_, Mutex<WorkspaceContext>>,
    version: String,
) -> Result<BibleInfo, CommandError> {
    let context = state
        .lock()
        .map_err(|_| CommandError::new("state_error", true))?;
    inspect_bible_impl(&context, version)
}

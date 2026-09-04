use std::fs::{File, OpenOptions};
use std::io::Write;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum LockError {
	#[error("workspace_locked")]
	Locked,
	#[error("lock_io_error")]
	Io(#[from] std::io::Error),
}

impl LockError {
	pub fn code(&self) -> &'static str {
		match self {
			Self::Locked => "workspace_locked",
			Self::Io(_) => "lock_io_error",
		}
	}
}

#[derive(Debug)]
pub struct WorkspaceLock {
	path: PathBuf,
	file: File,
}

impl WorkspaceLock {
	pub fn path(&self) -> &Path {
		&self.path
	}
}

pub fn acquire(root: &Path) -> Result<WorkspaceLock, LockError> {
	let lock_path = root.join(".openbible").join(".workspace.lock");
	let mut file = match OpenOptions::new().write(true).create_new(true).open(&lock_path) {
		Ok(file) => file,
		Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
			if stale_lock(&lock_path) {
				fs::remove_file(&lock_path)?;
				OpenOptions::new().write(true).create_new(true).open(&lock_path).map_err(LockError::Io)?
			} else {
				return Err(LockError::Locked)
			}
		}
		Err(error) => return Err(LockError::Io(error)),
	};
	let _ = writeln!(file, "pid={}", std::process::id());
	Ok(WorkspaceLock { path: lock_path, file })
}

fn stale_lock(path: &Path) -> bool {
	let Ok(contents) = fs::read_to_string(path) else { return false; };
	let Some(pid) = contents.strip_prefix("pid=").and_then(|value| value.lines().next()).and_then(|value| value.trim().parse::<i32>().ok()) else {
		return false;
	};
	if pid <= 0 || pid == std::process::id() as i32 { return false; }
	unsafe { libc::kill(pid, 0) != 0 && std::io::Error::last_os_error().raw_os_error() == Some(libc::ESRCH) }
}

pub fn release(lock: WorkspaceLock) -> Result<(), LockError> {
	lock.file.sync_all()?;
	std::fs::remove_file(lock.path).map_err(LockError::Io)
}

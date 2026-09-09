use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

pub const NATIVE_DATA_DIR_NAME: &str = ".openbible";
pub const NATIVE_WORKSPACE_DIR_NAME: &str = "workspace";

pub fn native_data_dir_from_home(home: &Path) -> PathBuf {
    home.join(NATIVE_DATA_DIR_NAME)
}

pub fn native_workspace_dir_from_home(home: &Path) -> PathBuf {
    native_data_dir_from_home(home).join(NATIVE_WORKSPACE_DIR_NAME)
}

pub fn native_data_dir(app: &AppHandle) -> Result<PathBuf, ()> {
    app.path()
        .home_dir()
        .map(|home| native_data_dir_from_home(&home))
        .map_err(|_| ())
}

pub fn native_workspace_dir(app: &AppHandle) -> Result<PathBuf, ()> {
    app.path()
        .home_dir()
        .map(|home| native_workspace_dir_from_home(&home))
        .map_err(|_| ())
}

pub fn legacy_app_database_path(app: &AppHandle, file_name: &str) -> Result<PathBuf, ()> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join(file_name))
        .map_err(|_| ())
}

pub fn legacy_workspace_dir(app: &AppHandle) -> Result<PathBuf, ()> {
    app.path()
        .app_data_dir()
        .map(|directory| directory.join(NATIVE_WORKSPACE_DIR_NAME))
        .map_err(|_| ())
}

#[cfg(test)]
mod tests {
    use super::{
        native_data_dir_from_home, native_workspace_dir_from_home, NATIVE_DATA_DIR_NAME,
        NATIVE_WORKSPACE_DIR_NAME,
    };
    use std::path::Path;

    #[test]
    fn keeps_native_data_under_the_user_home() {
        let home = Path::new("/Users/example");

        assert_eq!(
            native_data_dir_from_home(home),
            home.join(NATIVE_DATA_DIR_NAME)
        );
        assert_eq!(
            native_workspace_dir_from_home(home),
            home.join(NATIVE_DATA_DIR_NAME)
                .join(NATIVE_WORKSPACE_DIR_NAME)
        );
    }
}

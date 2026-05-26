use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::{command, AppHandle, Manager};

fn resolve_file_path(app: &AppHandle, input_path: &str) -> Result<PathBuf, String> {
    let path = Path::new(input_path);

    if path.is_absolute() {
        return Ok(path.to_path_buf());
    }

    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {}", error))?;

    Ok(app_data_dir.join(path))
}

#[command]
pub fn read_file(app: AppHandle, relative_path: &str) -> Result<String, String> {
    let resolved_path = resolve_file_path(&app, relative_path)?;
    let legacy_path = Path::new(relative_path);
    let path = if resolved_path.exists() || legacy_path.is_absolute() {
        resolved_path
    } else if legacy_path.exists() {
        legacy_path.to_path_buf()
    } else {
        resolved_path
    };

    let mut file = File::open(&path)
        .map_err(|error| format!("Failed to open {}: {}", path.display(), error))?;
    let mut contents = String::new();

    file.read_to_string(&mut contents)
        .map_err(|error| format!("Failed to read {}: {}", path.display(), error))?;

    Ok(contents)
}

#[command]
pub fn write_file(app: AppHandle, relative_path: &str, content: &str) -> Result<(), String> {
    let path = resolve_file_path(&app, relative_path)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create {}: {}", parent.display(), error))?;
    }

    let mut file = File::create(&path)
        .map_err(|error| format!("Failed to create {}: {}", path.display(), error))?;

    file.write_all(content.as_bytes())
        .map_err(|error| format!("Failed to write {}: {}", path.display(), error))?;

    Ok(())
}

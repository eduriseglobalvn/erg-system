const MAX_EXAM_FILE_BYTES: u64 = 50 * 1024 * 1024;

/// Returns the bytes of the `.ergquiz` file Windows passed on the command line (double-click / "Open with").
/// Takes no arguments so the page can never choose a path; only that one file, by extension and size, is readable.
// shortcut: Windows argv only; macOS delivers files through RunEvent::Opened, add it before shipping the dmg player.
#[tauri::command]
fn opened_exam_file() -> Result<tauri::ipc::Response, String> {
    let Some(path) = std::env::args_os().nth(1).map(std::path::PathBuf::from) else {
        return Ok(tauri::ipc::Response::new(Vec::new()));
    };
    let is_exam = path
        .extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("ergquiz"));
    if !is_exam {
        return Err("NOT_AN_EXAM_FILE".into());
    }
    let size = std::fs::metadata(&path).map_err(|_| "EXAM_FILE_UNREADABLE")?.len();
    if size > MAX_EXAM_FILE_BYTES {
        return Err("EXAM_FILE_TOO_LARGE".into());
    }
    let bytes = std::fs::read(&path).map_err(|_| "EXAM_FILE_UNREADABLE")?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(desktop)]
            {
                // These plugins expose only the narrowly scoped update/relaunch
                // bridge used by the Teacher/Student desktop shell. No generic
                // command or filesystem plugin is registered here.
                app.handle().plugin(tauri_plugin_process::init())?;
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![opened_exam_file])
        .run(tauri::generate_context!())
        .expect("error while running ERG LMS desktop application");
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use sysinfo::System;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")] // This makes sure that we send the data of SystemStats as a camelCase to the Frontend
pub struct SystemStats {
    total_memory: u64,
    used_memory: u64,
    cpu_usage: f32,
    uptime: u64,
}

pub struct AppState {
    pub sys: Mutex<System>,
}

#[tauri::command]
fn get_stats(state: State<'_, AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    sys.refresh_memory();
    sys.refresh_cpu_usage();

    SystemStats {
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        cpu_usage: sys.global_cpu_usage(),
        uptime: System::uptime(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_stats])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

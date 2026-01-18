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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: u64,
}

pub struct AppState {
    pub sys: Mutex<System>,
}

// Function that gets the stats of the device using Apps
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

#[tauri::command]
fn get_processes(state: State<'_, AppState>) -> Vec<ProcessInfo> {
    let mut sys = state.sys.lock().unwrap();
    
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let mut processes: Vec<ProcessInfo> = sys.processes()
        .iter()
        .map(|(pid, process)| ProcessInfo {
            pid: pid.as_u32(),
            name: process.name().to_string_lossy().into_owned(),
            cpu_usage: process.cpu_usage(),
            memory_usage: process.memory(),
        })
        .collect();

    // Sort by CPU usage descending (highest first)
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));

    processes.into_iter().take(10).collect()
}

#[tauri::command]
fn kill_process(state: State<'_, AppState>, pid: u32) -> Result<String, String> {
    let mut sys = state.sys.lock().unwrap();
    
    // Convert our u32 PID into the sysinfo Pid type
    let target_pid = sysinfo::Pid::from(pid as usize);

    // Find the process in the current system snapshot
    if let Some(process) = sys.process(target_pid) {
        if process.kill() {
            Ok(format!("Process {} terminated successfully.", pid))
        } else {
            Err(format!("The Machine Spirit refused to kill process {}. (Permission Denied?)", pid))
        }
    } else {
        Err(format!("Process {} not found in the current cycle.", pid))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(System::new_all()),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_stats, get_processes, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use sysinfo::System;
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;
use std::collections::VecDeque;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")] // This makes sure that we send the data of SystemStats as a camelCase to the Frontend
pub struct SystemStats {
    total_memory: u64,
    used_memory: u64,
    cpu_usage: f32,
    uptime: u64,
    cpu_history: Vec<f32>,
    disk_total: u64,
    disk_used: u64,
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
    pub cpu_history: Mutex<VecDeque<f32>>,
}

#[tauri::command]
fn get_stats(state: State<'_, AppState>) -> SystemStats {
    let mut sys = state.sys.lock().unwrap();
    let mut history = state.cpu_history.lock().unwrap();
    let current_cpu = sys.global_cpu_usage();
    let disks = sysinfo::Disks::new_with_refreshed_list();
    
    sys.refresh_memory();
    sys.refresh_cpu_usage();

    let main_disk = disks.iter().find(|d| {
    // Check for Windows systems (C:) or Unix systems (/)
    d.mount_point() == std::path::Path::new("/") || 
    d.mount_point().to_string_lossy().contains("C:")
    });

    let (total, used) = if let Some(disk) = main_disk {
        let t = disk.total_space();
        let u = t - disk.available_space();
        (t, u)
    } else {
        (0, 0) 
    };

    history.push_back(current_cpu);
    if history.len() > 60 {
        history.pop_front();
    }

    SystemStats {
        total_memory: sys.total_memory(),
        used_memory: sys.used_memory(),
        cpu_usage: current_cpu,
        uptime: System::uptime(),
        cpu_history: history.iter().cloned().collect(),
        disk_total: total,
        disk_used: used,
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
    let sys = state.sys.lock().unwrap();
    
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
            cpu_history: Mutex::new(VecDeque::from(vec![0.0; 60])),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_stats, get_processes, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

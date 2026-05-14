# Sentinel

A lightweight cross-platform desktop system monitor built with Rust and Tauri. Tracks CPU, memory, and disk usage in real time and lets you inspect and terminate the top active processes on your machine.

> Status: functional, in active development. New features planned.

---

## Features

- Real-time CPU, memory, and disk usage with per-second updates
- Top 10 processes sorted by CPU usage, with PID, memory, and CPU metrics
- Process termination with confirmation dialog
- System uptime tracking
- CPU usage history (last 60 seconds) for trend visualization
- Responsive UI with mobile-friendly layout

---

## Tech Stack

**Backend (Rust)**
- [Tauri 2](https://v2.tauri.app/) — desktop application framework
- [sysinfo](https://crates.io/crates/sysinfo) — cross-platform system information
- [serde](https://crates.io/crates/serde) — serialization between Rust and the frontend

**Frontend**
- React 19 + TypeScript
- Vite 7
- Custom CSS with design tokens (no UI library)

---

## Architecture

Sentinel uses Tauri's command-based IPC to bridge Rust and the React frontend.

- The Rust backend holds a shared `System` instance inside a `Mutex`, managed through Tauri's state container. This avoids reinitializing system probes on every call.
- A `VecDeque` stores the last 60 CPU samples for history tracking, providing O(1) push and pop operations.
- The frontend invokes two commands every second (`get_stats` and `get_processes`) in parallel via `Promise.all`, then updates React state. The polling interval is cleaned up on unmount.
- Process termination is exposed as a separate command (`kill_process`) that returns a `Result<String, String>`, surfacing permission errors to the UI.

```
┌─────────────────────┐         invoke()         ┌──────────────────────┐
│   React Frontend    │  ──────────────────────> │    Rust Backend      │
│  (Dashboard, lists) │                          │  (Tauri commands)    │
│                     │  <──────────────────────  │  - get_stats         │
│  Polls every 1s     │      JSON via serde       │  - get_processes     │
└─────────────────────┘                          │  - kill_process      │
                                                  └──────────────────────┘
                                                            │
                                                            ▼
                                                  ┌──────────────────────┐
                                                  │  sysinfo crate       │
                                                  │  (CPU, memory, disk, │
                                                  │   processes)         │
                                                  └──────────────────────┘
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform-specific Tauri prerequisites — see [Tauri setup guide](https://v2.tauri.app/start/prerequisites/)

### Install and run

```bash
# Clone the repository
git clone https://github.com/Phomhado/sentinel.git
cd sentinel

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build for production

```bash
npm run tauri build
```

The bundled installer will be available under `src-tauri/target/release/bundle/`.

---

## Project Structure

```
sentinel/
├── src/                    # React frontend
│   ├── components/         # Dashboard, ProcessList, ProgressBar
│   └── styles/             # Component-scoped CSS
├── src-tauri/              # Rust backend
│   ├── src/lib.rs          # Tauri commands and shared state
│   └── Cargo.toml          # Rust dependencies
└── package.json
```

---

## Roadmap

- Unit tests for Rust commands
- Native confirmation dialogs (Tauri dialog plugin) replacing browser `confirm`
- Process filtering and search
- Sortable columns (by memory, name, PID)
- Network usage tracking
- Configurable update interval

---

## License

MIT

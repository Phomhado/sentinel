import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
// STYLES
import "../styles/components/Dashboard.css";
// COMPONENTS
import ProgressBar from "./ProgressBar";
import ProcessList from "./ProcessList";

interface SystemStats {
  totalMemory: number;
  usedMemory: number;
  cpuUsage: number;
  uptime: number;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);

  const updateAll = async () => {
    try {
      const [statsData, procData] = await Promise.all([
        invoke<SystemStats>("get_stats"),
        invoke<ProcessInfo[]>("get_processes"),
      ]);

      setStats(statsData);
      setProcesses(procData);
    } catch (error) {
      console.error("The Machine Spirit is unresponsive:", error);
    }
  };

  useEffect(() => {
    updateAll();
    const intervalId = setInterval(updateAll, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!stats) return <div className="loading">Initializing...</div>;

  const memUsedPercent = (stats.usedMemory / stats.totalMemory) * 100;

  const hours = Math.floor(stats.uptime / 3600);
  const minutes = Math.floor((stats.uptime % 3600) / 60);
  const seconds = stats.uptime % 60;
  const timeString = `${hours}h ${minutes}m ${seconds}s`;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="dashboard__eyebrow">System Monitor</p>
          <h1>Sentinel</h1>
        </div>
        <div className="dashboard__uptime">
          <span>Uptime</span>
          <strong>{timeString}</strong>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__header">
            <h2>CPU Load</h2>
            <span className="stat-card__value">{stats.cpuUsage.toFixed(1)}%</span>
          </div>
          <ProgressBar percent={stats.cpuUsage} color="var(--accent-warn)" />
          <p className="stat-card__hint">Realtime usage across all cores.</p>
        </div>

        <div className="stat-card">
          <div className="stat-card__header">
            <h2>Memory Usage</h2>
            <span className="stat-card__value">{memUsedPercent.toFixed(1)}%</span>
          </div>
          <ProgressBar percent={memUsedPercent} color="var(--accent-cool)" />
          <p className="stat-card__hint">
            {(stats.usedMemory / 1024 / 1024 / 1024).toFixed(2)} /
            {(stats.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
        </div>

        <div className="stat-card stat-card--full">
          <div className="stat-card__header">
            <h2>Active Processes</h2>
            <span className="stat-card__value">{processes.length}</span>
          </div>
          <ProcessList processes={processes} />
        </div>
      </section>
    </div>
  );
}

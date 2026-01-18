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
    <div className="containerStyle">
      <h1 style={{ color: "#00ff00" }}>Sentinel</h1>

      <div className="stat-card">
        <p>CPU LOAD: {stats.cpuUsage.toFixed(1)}%</p>
        <ProgressBar percent={stats.cpuUsage} color="#ff4444" />
      </div>

      <div className="stat-card" style={{ marginTop: "20px" }}>
        <p>MEMORY USAGE: {memUsedPercent.toFixed(1)}%</p>
        <ProgressBar percent={memUsedPercent} color="#4444ff" />
        <small>
          {(stats.usedMemory / 1024 / 1024 / 1024).toFixed(2)} /
          {(stats.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB
        </small>
      </div>

      <div className="stat-card">
        <p>TIME PASSED SINCE LAST RESET: {timeString}</p>
      </div>

      <div className="stat-card">
        <ProcessList processes={processes} />
      </div>
    </div>
  );
}

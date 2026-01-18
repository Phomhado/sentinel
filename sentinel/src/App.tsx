import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SystemStats {
  totalMemory: number;
  usedMemory: number;
  cpuUsage: number;
  uptime: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  const updateStats = async () => {
    try {
      const data: SystemStats = await invoke("get_stats");
      setStats(data);
    } catch (error) {
      console.error("The Machine Spirit is unresponsive:", error);
    }
  };

  useEffect(() => {
    updateStats();
    
    const intervalId = setInterval(updateStats, 1000);

    return () => clearInterval(intervalId);
  }, []);

  if (!stats) return <div className="loading">Initializing Vox-Link...</div>;

  const memUsedPercent = (stats.usedMemory / stats.totalMemory) * 100;

  const hours = Math.floor(stats.uptime / 3600);
  const minutes = Math.floor((stats.uptime % 3600) / 60);
  const seconds = stats.uptime % 60;
  const timeString = `${hours}h ${minutes}m ${seconds}s`;

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#00ff00" }}>System Resource Sentinel</h1>
      
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
          <br />
         {timeString}
        </small>
      </div>
    </div>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div style={{ width: "100%", background: "#333", height: "10px", borderRadius: "5px" }}>
      <div 
        style={{ 
          width: `${percent}%`, 
          background: color, 
          height: "100%", 
          borderRadius: "5px",
          transition: "width 0.5s ease-in-out" 
        }} 
      />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  backgroundColor: "#1a1a1a",
  color: "#eee",
  padding: "40px",
  minHeight: "100vh",
  fontFamily: "'Courier New', Courier, monospace"
};
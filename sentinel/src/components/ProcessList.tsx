import { invoke } from "@tauri-apps/api/core";

interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

export default function ProcessList({ processes }: { processes: ProcessInfo[] }) {
  if (!processes.length) return <div>Scanning processes...</div>;

  const handleKill = async (pid: number, name: string) => {
    const confirmed = window.confirm(`Are you certain you want to terminate ${name} (PID: ${pid})?`);

    if (!confirmed) return;

    try {
      const message = await invoke<string>("kill_process", {pid});
      console.log(`%c ${message}`, "color: #00ff00; font-weight: bold;");
      alert(message);
    } catch (err) {
      console.error(`%c Execution failed: ${err}`, "color: #ff0000;");
      alert(`Error: ${err}`);
    }
  };

  return (
    <ul>
      {processes.map((p) => (
        <li key={p.pid} style={{ display: "flex", gap: 12 }}>
          <span style={{ minWidth: 220 }}>{p.name}</span>
          <span style={{ minWidth: 80 }}>PID: {p.pid}</span>
          <span>CPU: {p.cpuUsage.toFixed(1)}%</span>
           <button 
            onClick={() => handleKill(p.pid, p.name)}
            style={{ marginLeft: "auto", color: "red", background: "none", border: "1px solid red", cursor: "pointer" }}>
            TERMINATE
          </button>
        </li>
      ))}
    </ul>

  );
}

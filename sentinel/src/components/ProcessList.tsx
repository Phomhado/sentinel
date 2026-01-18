import { invoke } from "@tauri-apps/api/core";
import "../styles/components/ProcessList.css";

interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsage: number;
}

export default function ProcessList({ processes }: { processes: ProcessInfo[] }) {
  if (!processes.length) return <div className="process-list__empty">Scanning processes...</div>;

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
    <ul className="process-list">
      {processes.map((p) => (
        <li key={p.pid} className="process-list__item">
          <div className="process-list__meta">
            <span className="process-list__name">{p.name}</span>
            <span className="process-list__pid">PID {p.pid}</span>
          </div>
          <div className="process-list__usage">
            <span>CPU {p.cpuUsage.toFixed(1)}%</span>
            <span>MEM {(p.memoryUsage / 1024 / 1024).toFixed(0)} MB</span>
          </div>
           <button 
            onClick={() => handleKill(p.pid, p.name)}
            className="process-list__button">
            Terminate
          </button>
        </li>
      ))}
    </ul>

  );
}

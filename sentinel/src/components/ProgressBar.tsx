import "../styles/components/ProgressBar.css";

export default function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="progress-bar">
      <div
        className="progress-bar__fill"
        style={{
          width: `${percent}%`,
          background: color,
        }}
      />
    </div>
  );
}

export default function ProgressBar({ percent, color }: { percent: number; color: string }) {
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
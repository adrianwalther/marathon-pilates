export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 100,
          fontSize: "1.6rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#1a1a1a",
          lineHeight: 1,
        }}
      >
        Marathon
      </span>
      <span
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 600,
          fontSize: "0.65rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#87CEBF",
          lineHeight: 1,
        }}
      >
        Pilates
      </span>
    </div>
  );
}

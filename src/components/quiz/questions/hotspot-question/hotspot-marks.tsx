export function HotspotMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-sm"
      style={{
        backgroundColor: "var(--quiz-accent-end)",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
      }}
    />
  );
}

export function HotspotReviewArea({
  area,
}: {
  area: {
    shape: "rect" | "ellipse" | "polygon";
    x: number;
    y: number;
    width: number;
    height: number;
  };
}) {
  return (
    <div
      className="absolute border border-dashed border-white/90 bg-[var(--erg-blue)]/20"
      style={{
        left: `${area.x * 100}%`,
        top: `${area.y * 100}%`,
        width: `${area.width * 100}%`,
        height: `${area.height * 100}%`,
        borderRadius: area.shape === "ellipse" ? "9999px" : "0.5rem",
      }}
    />
  );
}

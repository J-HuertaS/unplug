export function ProgressBar({
  pct,
  color,
  trackColor = "#EAF3EC",
  height = 15,
}: {
  pct: number;
  color: string;
  trackColor?: string;
  height?: number;
}) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ height, background: trackColor, boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-400"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
      />
    </div>
  );
}

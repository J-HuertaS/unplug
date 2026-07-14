export const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: "home" as const },
  { href: "/log", label: "Log", icon: "scan" as const },
  { href: "/companion", label: "Buddy", icon: "leaf" as const },
  { href: "/stats", label: "Stats", icon: "chart" as const },
];

export function NavIcon({ name, color, size = 24 }: { name: string; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 2, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "home")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path {...p} d="M4 11 L12 4 L20 11" />
        <rect {...p} x={6} y={11} width={12} height={9} rx={2} />
      </svg>
    );
  if (name === "scan")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <rect {...p} x={3} y={6} width={18} height={14} rx={3.5} />
        <circle {...p} cx={12} cy={13} r={4} />
        <rect {...p} x={8} y={3.4} width={8} height={3.6} rx={1.4} />
      </svg>
    );
  if (name === "leaf")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path {...p} d="M5 19 C5 10 11 5 19 5 C19 13 13 19 5 19 Z" />
        <path {...p} d="M8 16 L16 8" />
      </svg>
    );
  if (name === "chart")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <rect fill={color} x={4} y={13} width={4} height={7} rx={1.4} />
        <rect fill={color} x={10} y={8} width={4} height={12} rx={1.4} />
        <rect fill={color} x={16} y={4} width={4} height={16} rx={1.4} />
      </svg>
    );
  if (name === "gear")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <circle {...p} cx={12} cy={12} r={3.2} />
        <path
          {...p}
          d="M12 3.5 v2.2 M12 18.3 v2.2 M20.5 12 h-2.2 M5.7 12 h-2.2 M17.66 6.34 l-1.56 1.56 M7.9 16.1 l-1.56 1.56 M17.66 17.66 l-1.56-1.56 M7.9 7.9 L6.34 6.34"
        />
      </svg>
    );
  if (name === "logout")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path {...p} d="M9 4 H6 a2 2 0 0 0 -2 2 v12 a2 2 0 0 0 2 2 h3" />
        <path {...p} d="M15 16 l5 -4 l-5 -4" />
        <path {...p} d="M20 12 H9" />
      </svg>
    );
  if (name === "back")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path {...p} d="M15 5 L8 12 L15 19" />
      </svg>
    );
  return null;
}

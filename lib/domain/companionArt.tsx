import type { CompanionType, HealthState, Level } from "@/lib/types";

// Ported near-verbatim from the imported design's buildPlant/buildAnimal/buildChar
// SVG builders (same colors and paths), extended with a `level` scale so the
// permanent baby -> growing -> mature progression reads visually even though
// the design only ever had one size per species.
const LEVEL_SCALE: Record<Level, number> = {
  baby: 0.7,
  growing: 0.86,
  mature: 1,
};

function Plant({ health }: { health: HealthState }) {
  const thr = health === "healthy";
  const wil = health === "critical";
  const leaf = thr ? "#3E9E74" : wil ? "#B0996F" : "#86A08C";
  const stem = thr ? "#2E7D5B" : wil ? "#9C8E6A" : "#6E8A76";
  const L = (cx: number, cy: number, rot: number, rx: number, ry: number) => (
    <ellipse
      key={`${cx}-${cy}-${rot}`}
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={leaf}
      transform={`rotate(${rot} ${cx} ${cy})`}
    />
  );
  const parts = thr
    ? [
        L(37, 49, -38, 11, 6.5),
        L(63, 47, 38, 11, 6.5),
        L(41, 60, -30, 9, 5.5),
        L(59, 58, 30, 9, 5.5),
        <circle key="bud" cx={50} cy={35} r={7.5} fill="#3E9E74" />,
        <circle key="fl" cx={50} cy={31} r={4} fill="#E6A94E" />,
      ]
    : wil
      ? [L(37, 55, -72, 9, 5), L(61, 57, 72, 9, 5), L(43, 65, -84, 7, 4)]
      : [L(39, 52, -42, 9.5, 5.5), L(61, 52, 42, 9.5, 5.5), L(43, 62, -30, 8, 5)];
  const stemD = wil ? "M50,73 C50,62 45,54 39,50" : "M50,73 L50,40";
  return (
    <>
      <polygon points="34,74 66,74 61,96 39,96" fill="#C97C54" />
      <rect x={31} y={67} width={38} height={9} rx={3} fill="#D98A5F" />
      <ellipse cx={50} cy={71} rx={15} ry={3.5} fill="#6B4A34" />
      <path d={stemD} stroke={stem} strokeWidth={5} fill="none" strokeLinecap="round" />
      {parts}
    </>
  );
}

function Animal({ health }: { health: HealthState }) {
  const thr = health === "healthy";
  const wil = health === "critical";
  const body = thr ? "#3E9E74" : wil ? "#A7A79A" : "#86A08C";
  const dark = thr ? "#2E7D5B" : wil ? "#8E8E82" : "#6E8A76";
  const earRot = wil ? 42 : 14;
  const earY = wil ? 42 : 30;
  const ear = (cx: number, sign: number) => (
    <ellipse
      key={`ear${cx}`}
      cx={cx}
      cy={earY}
      rx={9}
      ry={13}
      fill={body}
      transform={`rotate(${sign * earRot} ${cx} ${earY})`}
    />
  );
  const eyes = wil
    ? [
        <path key="e1" d="M35,58 q5,4 10,0" stroke="#22332B" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
        <path key="e2" d="M55,58 q5,4 10,0" stroke="#22332B" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
      ]
    : [
        <circle key="e1" cx={41} cy={57} r={4.2} fill="#22332B" />,
        <circle key="e2" cx={59} cy={57} r={4.2} fill="#22332B" />,
        <circle key="g1" cx={42.6} cy={55.4} r={1.4} fill="#fff" />,
        <circle key="g2" cx={60.6} cy={55.4} r={1.4} fill="#fff" />,
      ];
  const mouth = thr ? (
    <path d="M43,67 q7,8 14,0" stroke="#22332B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
  ) : wil ? (
    <path d="M44,73 q6,-5 12,0" stroke="#22332B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
  ) : (
    <line x1={46} y1={70} x2={54} y2={70} stroke="#22332B" strokeWidth={2.4} strokeLinecap="round" />
  );
  return (
    <>
      {ear(37, -1)}
      {ear(63, 1)}
      <ellipse cx={50} cy={60} rx={30} ry={27} fill={body} />
      <ellipse cx={50} cy={66} rx={17} ry={15} fill={dark} opacity={0.22} />
      <circle cx={33} cy={64} r={4.2} fill="#E9A98E" opacity={0.7} />
      <circle cx={67} cy={64} r={4.2} fill="#E9A98E" opacity={0.7} />
      {eyes}
      {mouth}
    </>
  );
}

function Character({ health }: { health: HealthState }) {
  const thr = health === "healthy";
  const wil = health === "critical";
  const body = thr ? "#3E9E74" : wil ? "#A7A79A" : "#86A08C";
  const dark = thr ? "#2E7D5B" : wil ? "#8E8E82" : "#6E8A76";
  const antD = wil ? "M50,30 C50,24 44,22 41,20" : "M50,30 L50,18";
  const eyes = wil
    ? [
        <path key="e1" d="M36,56 q5,4 10,0" stroke="#22332B" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
        <path key="e2" d="M54,56 q5,4 10,0" stroke="#22332B" strokeWidth={2.6} fill="none" strokeLinecap="round" />,
      ]
    : [
        <circle key="e1" cx={41} cy={55} r={4.2} fill="#22332B" />,
        <circle key="e2" cx={59} cy={55} r={4.2} fill="#22332B" />,
        <circle key="g1" cx={42.6} cy={53.4} r={1.4} fill="#fff" />,
        <circle key="g2" cx={60.6} cy={53.4} r={1.4} fill="#fff" />,
      ];
  const mouth = thr ? (
    <path d="M43,64 q7,8 14,0" stroke="#22332B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
  ) : wil ? (
    <path d="M44,70 q6,-5 12,0" stroke="#22332B" strokeWidth={2.4} fill="none" strokeLinecap="round" />
  ) : (
    <line x1={46} y1={67} x2={54} y2={67} stroke="#22332B" strokeWidth={2.4} strokeLinecap="round" />
  );
  return (
    <>
      <path d={antD} stroke={dark} strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={wil ? 41 : 50} cy={wil ? 20 : 18} r={4} fill="#E6A94E" />
      <rect x={16} y={56} width={9} height={22} rx={4.5} fill={body} transform="rotate(18 20 56)" />
      <rect x={75} y={56} width={9} height={22} rx={4.5} fill={body} transform="rotate(-18 80 56)" />
      <rect x={22} y={32} width={56} height={56} rx={26} fill={body} />
      <circle cx={33} cy={62} r={4} fill="#E9A98E" opacity={0.6} />
      <circle cx={67} cy={62} r={4} fill="#E9A98E" opacity={0.6} />
      {eyes}
      {mouth}
    </>
  );
}

export function CompanionArt({
  type,
  health,
  level = "mature",
  size,
  animate = false,
  className,
}: {
  type: CompanionType;
  health: HealthState;
  level?: Level;
  size: number;
  animate?: boolean;
  className?: string;
}) {
  const scale = LEVEL_SCALE[level];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      className={`${animate ? "animate-floaty" : ""} ${className ?? ""}`}
    >
      <g transform={`translate(50 50) scale(${scale}) translate(-50 -50)`}>
        {type === "plant" && <Plant health={health} />}
        {type === "animal" && <Animal health={health} />}
        {type === "character" && <Character health={health} />}
      </g>
    </svg>
  );
}

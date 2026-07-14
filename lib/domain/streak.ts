import type { LogOutcome } from "@/lib/types";

/**
 * Mirrors the `submit_daily_log` Postgres function exactly, for optimistic
 * client-side preview only — the RPC is the authoritative source of truth.
 */
export interface LogPreview {
  outcome: LogOutcome;
  points: number;
  streakDelta: number;
}

function reductionScale(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return clamped <= 50 ? clamped : 50 + (clamped - 50) * 2;
}

export function previewLogOutcome(
  hoursToday: number,
  goalHours: number,
  hoursYesterday: number,
): LogPreview {
  if (hoursToday <= goalHours) {
    const pct = goalHours === 0 ? 100 : ((goalHours - hoursToday) / goalHours) * 100;
    return { outcome: "beat", points: Math.round(reductionScale(pct)), streakDelta: 1 };
  }
  if (hoursToday < hoursYesterday) {
    const pct = ((hoursYesterday - hoursToday) / hoursYesterday) * 100;
    return {
      outcome: "hold",
      points: Math.round(reductionScale(pct) * 0.5),
      streakDelta: 0,
    };
  }
  return { outcome: "drop", points: 0, streakDelta: -1 };
}

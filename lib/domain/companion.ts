import type { CompanionType, HealthState, Level, LogOutcome } from "@/lib/types";

/** Mirrors the health derivation applied by `submit_daily_log`. */
export function healthState(
  lastOutcome: LogOutcome | null,
  consecutiveDrops: number,
): HealthState {
  if (consecutiveDrops >= 2) return "critical";
  if (lastOutcome === "beat") return "healthy";
  return "neutral";
}

export const HEALTH_LABEL: Record<HealthState, string> = {
  healthy: "Healthy",
  neutral: "Doing okay",
  critical: "Critical",
};

export const HEALTH_COLOR: Record<HealthState, string> = {
  healthy: "#1E5A44",
  neutral: "#7E9A85",
  critical: "#B08A4A",
};

/** Mirrors the level thresholds applied by `spend_points_on_food`. */
export const LEVEL_THRESHOLDS: Record<Level, { min: number; max: number | null }> = {
  baby: { min: 0, max: 200 },
  growing: { min: 200, max: 600 },
  mature: { min: 600, max: null },
};

export function levelFromXp(xp: number): Level {
  if (xp >= 600) return "mature";
  if (xp >= 200) return "growing";
  return "baby";
}

export function levelProgress(xp: number, level: Level): number {
  const { min, max } = LEVEL_THRESHOLDS[level];
  if (max === null) return 1;
  return Math.max(0, Math.min(1, (xp - min) / (max - min)));
}

export const LEVEL_LABEL: Record<Level, string> = {
  baby: "Baby",
  growing: "Growing",
  mature: "Mature",
};

export const COMPANION_NICKNAME: Record<CompanionType, string> = {
  plant: "Sprout",
  animal: "Pip",
  character: "Bloop",
};

export const COMPANION_TYPE_LABEL: Record<CompanionType, string> = {
  plant: "Plant",
  animal: "Animal",
  character: "Character",
};

export function moodText(health: HealthState): string {
  if (health === "healthy") return "I feel amazing — keep it up!";
  if (health === "critical") return `I'm a little low… let's unplug today?`;
  return "Doing alright! A win today helps a lot.";
}

export const STREAK_STATUS: Record<
  LogOutcome | "none",
  { text: string; color: string; arrow: string; bg: string }
> = {
  beat: { text: "growing", color: "#1E5A44", arrow: "▲", bg: "#FCEEDD" },
  drop: { text: "slipped", color: "#B0857A", arrow: "▼", bg: "#EDEAE1" },
  none: { text: "just started", color: "#1E5A44", arrow: "▲", bg: "#FCEEDD" },
};

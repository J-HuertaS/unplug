import type { DailyLog } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Last `n` calendar days (oldest first) as YYYY-MM-DD keys, ending today. */
export function lastNDayKeys(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

export function dayLabel(dateKey: string, isToday: boolean): string {
  if (isToday) return "Now";
  const d = new Date(`${dateKey}T00:00:00`);
  return DAY_LABELS[d.getDay()];
}

export interface DayEntry {
  dateKey: string;
  isToday: boolean;
  label: string;
  log: DailyLog | null;
}

export function buildWeek(logs: DailyLog[], days = 7): DayEntry[] {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const today = todayKey();
  return lastNDayKeys(days).map((dateKey) => ({
    dateKey,
    isToday: dateKey === today,
    label: dayLabel(dateKey, dateKey === today),
    log: byDate.get(dateKey) ?? null,
  }));
}

/** Bar color matching the imported design's weekly-sparkline coloring rule. */
export function barColor(hours: number, goal: number, baseline: number): string {
  if (hours <= goal) return "#3E9E74";
  if (hours <= baseline * 0.8) return "#8FCBA6";
  return "#D9C9A6";
}

/** Total hours freed up this week (Σ max(0, baseline - actual) over logged days). */
export function hoursSavedThisWeek(week: DayEntry[], baseline: number): number {
  const total = week.reduce((sum, d) => sum + Math.max(0, baseline - (d.log?.hours_reported ?? baseline)), 0);
  return Math.round(total * 10) / 10;
}

/** Average % reduction vs baseline across logged days this week, or null if none logged yet. */
export function avgReductionPct(week: DayEntry[], baseline: number): number | null {
  const logged = week.filter((d) => d.log);
  if (logged.length === 0) return null;
  const avg =
    logged.reduce((sum, d) => sum + (baseline - d.log!.hours_reported) / baseline, 0) / logged.length;
  return Math.round(avg * 100);
}

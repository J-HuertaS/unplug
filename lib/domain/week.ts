import type { DailyLog } from "@/lib/types";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * "Today" as the user actually experiences it, not the server's clock.
 * Next.js server components run on the server's system time (UTC on
 * Vercel), which drifts from local calendar days by several hours for
 * most users — a log made in the evening can land on the "wrong" date.
 * Always resolve dates through the user's stored IANA timezone instead
 * of `new Date().toISOString()`.
 */
export function localTodayKey(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

/** Last `n` calendar days (oldest first) as YYYY-MM-DD keys, ending today — in `timezone`. */
export function lastNDayKeys(n: number, timezone: string): string[] {
  const [y, m, d] = localTodayKey(timezone).split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    // Date.UTC here is just calendar-day arithmetic on a Y/M/D triple, not a
    // real moment in time — safe regardless of the server's own timezone.
    out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return out;
}

export function dayLabel(dateKey: string, isToday: boolean): string {
  if (isToday) return "Now";
  const d = new Date(`${dateKey}T00:00:00Z`);
  return DAY_LABELS[d.getUTCDay()];
}

export interface DayEntry {
  dateKey: string;
  isToday: boolean;
  label: string;
  log: DailyLog | null;
}

export function buildWeek(logs: DailyLog[], timezone: string, days = 7): DayEntry[] {
  const byDate = new Map(logs.map((l) => [l.log_date, l]));
  const today = localTodayKey(timezone);
  return lastNDayKeys(days, timezone).map((dateKey) => ({
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

export type CompanionType = "plant" | "animal" | "character";
export type Level = "baby" | "growing" | "mature";
export type LogOutcome = "beat" | "drop";
export type HealthState = "healthy" | "neutral" | "critical";
export type FoodKey = "apple" | "smoothie" | "cake";

export interface Profile {
  id: string;
  user_name: string | null;
  baseline_hours: number;
  daily_goal_hours: number;
  companion_type: CompanionType;
  onboarded: boolean;
  streak: number;
  points: number;
  last_outcome: LogOutcome | null;
  consecutive_drops: number;
  xp: number;
  level: Level;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  hours_reported: number;
  outcome: LogOutcome;
  points_earned: number;
  streak_after: number;
  created_at: string;
}

export interface SubmitDailyLogResult {
  outcome: LogOutcome;
  points_earned: number;
  streak: number;
  points: number;
  hours_reported: number;
  yesterday_hours: number;
  goal_hours: number;
  consecutive_drops: number;
}

export interface SpendPointsResult {
  food_key: FoodKey;
  cost: number;
  points: number;
  xp: number;
  level: Level;
  leveled_up: boolean;
}

// The Supabase `Database` type is generated from the live local instance —
// see lib/database.types.ts (`supabase gen types typescript --local`).
// These interfaces narrow its loose `string` columns (backed by Postgres
// CHECK constraints) to real literal unions for use in app code.

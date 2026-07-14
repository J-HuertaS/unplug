import { createClient } from "@/lib/supabase/server";
import { todayKey } from "@/lib/domain/week";
import type { DailyLog, Profile } from "@/lib/types";
import { LogFlow } from "./LogFlow";

export default async function LogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profileRow) return null;
  const profile = profileRow as Profile;

  const { data: existingRow } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", todayKey())
    .maybeSingle();

  return (
    <LogFlow
      profile={profile}
      alreadyLoggedToday={(existingRow as DailyLog | null) ?? null}
    />
  );
}

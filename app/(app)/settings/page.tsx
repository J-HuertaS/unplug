import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
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

  return <SettingsForm profile={profileRow as Profile} email={user.email ?? ""} />;
}

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { CompanionScreen } from "./CompanionScreen";

export default async function CompanionPage() {
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

  return <CompanionScreen profile={profileRow as Profile} />;
}

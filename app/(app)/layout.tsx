import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { AppFrame } from "@/components/AppFrame";
import { Sidebar } from "@/components/Sidebar";
import { TimezoneSync } from "@/components/TimezoneSync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded, timezone")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded) redirect("/onboarding");

  return (
    <AppFrame wide>
      <TimezoneSync userId={user.id} currentTimezone={profile.timezone} />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <BottomNav />
      </div>
    </AppFrame>
  );
}

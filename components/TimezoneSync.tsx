"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Silent self-heal for accounts created before per-user timezones existed
 * (they default to 'UTC' in the database). Detects the browser's real
 * timezone once per mount and syncs it if it's out of date — no UI.
 */
export function TimezoneSync({ userId, currentTimezone }: { userId: string; currentTimezone: string }) {
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === currentTimezone) return;
    const supabase = createClient();
    supabase.from("profiles").update({ timezone: detected }).eq("id", userId).then();
  }, [userId, currentTimezone]);

  return null;
}

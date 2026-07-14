import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CompanionArt } from "@/lib/domain/companionArt";
import {
  COMPANION_NICKNAME,
  HEALTH_LABEL,
  healthState,
  moodText,
  STREAK_STATUS,
} from "@/lib/domain/companion";
import { buildWeek, barColor, lastNDayKeys, avgReductionPct } from "@/lib/domain/week";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NavIcon } from "@/components/nav-items";
import type { DailyLog, Profile } from "@/lib/types";

export default async function HomePage() {
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

  const [from] = lastNDayKeys(7);
  const { data: logsRaw } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("log_date", from);
  const logs = (logsRaw ?? []) as DailyLog[];

  const week = buildWeek(logs, 7);
  const todayEntry = week[week.length - 1];
  const yesterdayEntry = week[week.length - 2];

  const health = healthState(profile.last_outcome, profile.consecutive_drops);
  const nickname = COMPANION_NICKNAME[profile.companion_type];
  const streakStatus = STREAK_STATUS[profile.last_outcome ?? "none"];

  const weekAvgReductionPct = avgReductionPct(week, profile.baseline_hours);

  const scale =
    Math.max(profile.baseline_hours, ...week.map((d) => d.log?.hours_reported ?? 0)) + 0.4;

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const displayName = profile.user_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <div className="px-5.5 pt-5 pb-6 lg:px-9 lg:pt-8 lg:pb-8 animate-rise">
      <div className="lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-7 lg:items-start">
        <div className="lg:flex lg:flex-col lg:gap-5">
          <div className="flex justify-between items-start my-1.5 mb-4 lg:my-0 lg:mb-0 gap-2">
            <div className="min-w-0">
              <div className="text-sm text-ink-soft font-bold">{greeting},</div>
              <div className="font-heading font-semibold text-[26px] lg:text-[30px] text-ink leading-tight capitalize truncate">
                {displayName} 🌤
              </div>
            </div>
            <div className="flex gap-2 flex-none">
              <div
                className="rounded-2xl px-3 py-2 text-center min-w-[66px]"
                style={{ background: streakStatus.bg }}
              >
                <div className="font-heading font-bold text-xl text-amber-deep leading-none">
                  🔥{profile.streak}
                </div>
                <div
                  className="text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ color: streakStatus.color }}
                >
                  {streakStatus.arrow} {streakStatus.text}
                </div>
              </div>
              <div className="bg-green-card rounded-2xl px-3 py-2 text-center min-w-[56px]">
                <div className="font-heading font-bold text-xl text-green leading-none">
                  {profile.points}
                </div>
                <div className="text-[10px] text-[#5C8A72] font-extrabold tracking-wide">POINTS</div>
              </div>
              <Link
                href="/settings"
                className="lg:hidden w-11 h-11 flex-none rounded-2xl bg-white flex items-center justify-center shadow-[0_2px_8px_-4px_rgba(0,0,0,0.15)]"
              >
                <NavIcon name="gear" color="#6B7C72" size={20} />
              </Link>
            </div>
          </div>

          <div
            className="rounded-[30px] p-5.5 lg:p-7 relative overflow-hidden shadow-[0_18px_34px_-16px_rgba(30,90,68,0.6)]"
            style={{ background: "linear-gradient(165deg,#1E5A44,#2E7D5B)" }}
          >
            <div className="absolute -top-7 -right-5 w-[120px] h-[120px] rounded-full bg-white/[.06]" />
            <div className="absolute -bottom-10 -left-7 w-[130px] h-[130px] rounded-full bg-white/[.05]" />
            <div className="flex items-center gap-4 lg:gap-5 relative">
              <div className="w-[130px] h-[130px] lg:w-[150px] lg:h-[150px] flex-none bg-white/[.12] rounded-[26px] flex items-center justify-center">
                <CompanionArt
                  type={profile.companion_type}
                  health={health}
                  level={profile.level}
                  size={100}
                  animate
                />
              </div>
              <div className="flex-1">
                <div className="bg-white rounded-[16px_16px_16px_4px] px-3.5 py-2.5 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.3)]">
                  <div className="font-heading font-semibold text-[15px] text-ink leading-snug">
                    {moodText(health)}
                  </div>
                </div>
                <div className="text-white/85 text-[13px] font-bold mt-2.5">
                  {nickname} · {HEALTH_LABEL[health]}
                </div>
              </div>
            </div>
          </div>

          <Link href="/log" className="hidden lg:block">
            <Button variant="cta" className="w-full flex items-center justify-center gap-2">
              <span className="text-xl">📝</span> Log today&apos;s screen time
            </Button>
          </Link>
        </div>

        <div className="mt-4 lg:mt-0 lg:flex lg:flex-col lg:gap-4">
          <div className="flex gap-3">
            <Card className="flex-1 p-4">
              <div className="text-xs text-ink-soft font-extrabold uppercase tracking-wide">
                Yesterday
              </div>
              <div className="font-heading font-semibold text-[30px] text-[#B0996F] leading-tight">
                {yesterdayEntry.log ? yesterdayEntry.log.hours_reported.toFixed(1) : "–"}
                {yesterdayEntry.log && <span className="text-base">h</span>}
              </div>
            </Card>
            <Card className="flex-1 p-4 bg-green-card shadow-[0_4px_14px_-8px_rgba(30,90,68,0.2)]">
              <div className="text-xs text-[#5C8A72] font-extrabold uppercase tracking-wide">
                Today
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="font-heading font-bold text-[30px] text-green leading-tight">
                  {todayEntry.log ? (
                    <>
                      {todayEntry.log.hours_reported.toFixed(1)}
                      <span className="text-base">h</span>
                    </>
                  ) : (
                    <span className="text-lg">Not logged</span>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 pb-3 mt-3 lg:mt-0">
            <div className="flex justify-between items-center mb-3">
              <div className="font-heading font-semibold text-[15px] text-ink">This week</div>
              {weekAvgReductionPct !== null && (
                <div className="text-xs font-extrabold text-green bg-green-card px-2.5 py-1 rounded-full">
                  {weekAvgReductionPct >= 0 ? "−" : "+"}
                  {Math.abs(weekAvgReductionPct)}%
                </div>
              )}
            </div>
            <div className="flex items-end gap-1.5 h-14 lg:h-20">
              {week.map((d) => {
                const hours = d.log?.hours_reported ?? null;
                const heightPct = hours !== null ? Math.round((hours / scale) * 100) : 4;
                return (
                  <div
                    key={d.dateKey}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                  >
                    <div
                      className="w-full rounded-md"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background:
                          hours !== null
                            ? barColor(hours, profile.daily_goal_hours, profile.baseline_hours)
                            : "#ECE3CE",
                      }}
                    />
                    <div className="text-[9px] text-ink-faint font-bold">{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Link href="/log" className="block mt-4 lg:hidden">
        <Button variant="cta" className="w-full flex items-center justify-center gap-2">
          <span className="text-xl">📝</span> Log today&apos;s screen time
        </Button>
      </Link>
    </div>
  );
}

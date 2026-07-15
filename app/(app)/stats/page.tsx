import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import {
  buildWeek,
  barColor,
  lastNDayKeys,
  avgReductionPct,
  hoursSavedThisWeek,
} from "@/lib/domain/week";
import { recommendationsFor, REC_ICON, REC_TINT } from "@/lib/domain/recommendations";
import type { DailyLog, Profile } from "@/lib/types";

export default async function StatsPage() {
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

  const [from] = lastNDayKeys(7, profile.timezone);
  const { data: logsRaw } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("log_date", from);
  const logs = (logsRaw ?? []) as DailyLog[];

  const week = buildWeek(logs, profile.timezone, 7);
  const reductionPct = avgReductionPct(week, profile.baseline_hours);
  const freed = hoursSavedThisWeek(week, profile.baseline_hours);
  const recs = recommendationsFor(freed);

  const scale =
    Math.max(profile.baseline_hours, ...week.map((d) => d.log?.hours_reported ?? 0)) + 0.4;
  const goalLinePct = Math.round((profile.daily_goal_hours / scale) * 100);

  const maxPts = Math.max(10, ...week.map((d) => d.log?.points_earned ?? 0));
  const weekPts = week.reduce((sum, d) => sum + (d.log?.points_earned ?? 0), 0);

  return (
    <div className="px-5.5 pt-2 pb-8 lg:px-9 lg:pt-7 lg:pb-8 animate-rise">
      <h1 className="font-heading font-semibold text-[28px] mt-3.5 mb-4 lg:mt-0 text-ink tracking-tight">
        Your progress
      </h1>

      <div className="lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:gap-7 lg:items-start">
        <div className="lg:flex lg:flex-col lg:gap-4">
          <div className="flex gap-3 mb-4 lg:mb-0">
            <div className="flex-1 bg-green rounded-[22px] p-4 text-white">
              <div className="text-[11px] font-extrabold opacity-75 uppercase tracking-wide">
                vs baseline
              </div>
              <div className="font-heading font-bold text-[34px] leading-tight">
                {reductionPct === null ? "–" : `${reductionPct >= 0 ? "−" : "+"}${Math.abs(reductionPct)}%`}
              </div>
              <div className="text-xs font-bold opacity-80">social time</div>
            </div>
            <div className="flex-1 bg-terracotta rounded-[22px] p-4 text-white">
              <div className="text-[11px] font-extrabold opacity-85 uppercase tracking-wide">
                freed up
              </div>
              <div className="font-heading font-bold text-[34px] leading-tight">{freed.toFixed(1)}h</div>
              <div className="text-xs font-bold opacity-85">this week</div>
            </div>
          </div>

          <Card className="p-4.5 pt-4.5 pb-3.5">
            <div className="flex justify-between items-center mb-4">
              <div className="font-heading font-semibold text-base text-ink">Daily social hours</div>
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-ink-soft">
                <span className="w-4 h-0 border-t-2 border-dashed" style={{ borderColor: "#1E5A44" }} />
                goal {profile.daily_goal_hours.toFixed(1)}h
              </div>
            </div>
            <div className="relative h-[120px] lg:h-[150px] flex items-end gap-2">
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed z-[1]"
                style={{ bottom: `${goalLinePct}%`, borderColor: "#C6D8CB" }}
              />
              {week.map((d) => {
                const hours = d.log?.hours_reported ?? null;
                const heightPct = hours !== null ? Math.round((hours / scale) * 100) : 4;
                return (
                  <div
                    key={d.dateKey}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative z-[2]"
                  >
                    <div className="text-[10px] font-extrabold text-ink-faint">
                      {hours !== null ? hours.toFixed(1) : "–"}
                    </div>
                    <div
                      className="w-full rounded-t-[7px] rounded-b-[4px]"
                      style={{
                        height: `${Math.max(heightPct, 5)}%`,
                        background: hours !== null ? barColor(hours, profile.daily_goal_hours, profile.baseline_hours) : "#ECE3CE",
                      }}
                    />
                    <div className="text-[10px] text-ink-faint font-bold">{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4.5 pt-4.5 pb-3.5 mt-3.5 lg:mt-0">
            <div className="flex justify-between items-center mb-3.5">
              <div className="font-heading font-semibold text-base text-ink">Points earned daily</div>
              <div className="text-xs font-extrabold text-[#B98A50] bg-amber-card px-2.5 py-1 rounded-full">
                +{weekPts} this week
              </div>
            </div>
            <div className="h-[100px] lg:h-[130px] flex items-end gap-2">
              {week.map((d) => {
                const pts = d.log?.points_earned ?? 0;
                const heightPct = Math.round((pts / maxPts) * 100);
                return (
                  <div
                    key={d.dateKey}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <div className="text-[10px] font-extrabold text-[#B98A50]">
                      {pts > 0 ? `+${pts}` : "·"}
                    </div>
                    <div
                      className="w-full rounded-t-[7px] rounded-b-[4px]"
                      style={{ height: `${Math.max(heightPct, 3)}%`, background: pts > 0 ? "#E6A94E" : "#ECE3CE" }}
                    />
                    <div className="text-[10px] text-ink-faint font-bold">{d.label}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="mt-6 lg:mt-0">
          <div className="font-heading font-semibold text-lg text-ink mb-3">
            With {freed.toFixed(1)}h freed, try
          </div>
          <div className="flex flex-col gap-2.5">
            {recs.map((r) => (
              <Card key={r.key} className="p-3.5 px-4 flex items-center gap-3.5">
                <div
                  className="w-12 h-12 flex-none rounded-[15px] flex items-center justify-center text-2xl"
                  style={{ background: REC_TINT[r.icon] }}
                >
                  {REC_ICON[r.icon]}
                </div>
                <div className="flex-1">
                  <div className="font-heading font-semibold text-base text-ink">{r.title}</div>
                  <div className="text-[13px] text-ink-soft font-bold">{r.sub}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

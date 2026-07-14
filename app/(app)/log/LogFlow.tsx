"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Card } from "@/components/ui/Card";
import { CompanionArt } from "@/lib/domain/companionArt";
import { COMPANION_NICKNAME, healthState } from "@/lib/domain/companion";
import type { DailyLog, HealthState, LogOutcome, Profile, SubmitDailyLogResult } from "@/lib/types";

interface DetectedApp {
  name: string;
  hours: number;
}

interface DetectedScreenTime {
  total_hours: number;
  apps: DetectedApp[];
}

const APP_BAR_COLORS = ["#C97C54", "#E6A94E", "#3E9E74", "#8A6BB0", "#B0857A"];

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

const OUTCOME_COPY: Record<LogOutcome, { title: string; bgTint: string }> = {
  beat: { title: "You beat your goal! 🎉", bgTint: "#E4F1E7" },
  hold: { title: "Progress still counts 💪", bgTint: "#FBF0E0" },
  drop: { title: "Tomorrow's a fresh start", bgTint: "#F1ECE2" },
};

function subCopy(
  result: SubmitDailyLogResult,
  nickname: string,
): string {
  const goalTxt = result.goal_hours.toFixed(1);
  const saved = Math.max(0, result.yesterday_hours - result.hours_reported);
  if (result.outcome === "beat") {
    return `Under ${goalTxt}h${saved > 0 ? ` and ${saved.toFixed(1)}h below yesterday` : ""}. Streak up to ${result.streak} — ${nickname} is thriving.`;
  }
  if (result.outcome === "hold") {
    return `Over goal, but less than yesterday — your streak holds and you banked half points. Dip under ${goalTxt}h tomorrow to grow it.`;
  }
  return `More than yesterday today, so the streak stepped back to ${result.streak}. One good day turns it right around.`;
}

function ResultScreen({
  profile,
  outcome,
  health,
  result,
}: {
  profile: Profile;
  outcome: LogOutcome;
  health: HealthState;
  result: SubmitDailyLogResult | null;
}) {
  const router = useRouter();
  const copy = OUTCOME_COPY[outcome];
  const nickname = COMPANION_NICKNAME[profile.companion_type];
  const streak = result?.streak ?? profile.streak;
  const points = result?.points ?? profile.points;

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-1.5 px-6 py-10 min-h-[70vh]">
      <div
        className="w-[150px] h-[150px] rounded-[34px] flex items-center justify-center animate-popIn"
        style={{ background: copy.bgTint }}
      >
        <CompanionArt type={profile.companion_type} health={health} level={profile.level} size={120} />
      </div>
      {result && result.points_earned > 0 && (
        <div className="font-heading font-bold text-[34px] text-green mt-3.5 animate-popIn">
          +{result.points_earned} pts
        </div>
      )}
      <h1 className="font-heading font-semibold text-[26px] text-ink mt-1.5 tracking-tight">
        {copy.title}
      </h1>
      {result && (
        <p className="text-[15px] text-ink-muted leading-relaxed mt-2 max-w-[280px]">
          {subCopy(result, nickname)}
        </p>
      )}
      <div className="flex gap-2.5 mt-5.5">
        <div className="bg-terracotta-card rounded-2xl px-4 py-2.5 text-center">
          <div className="font-heading font-bold text-xl text-amber-deep">🔥{streak}</div>
          <div className="text-[10px] text-[#B98A50] font-extrabold">STREAK</div>
        </div>
        <div className="bg-green-card rounded-2xl px-4 py-2.5 text-center">
          <div className="font-heading font-bold text-xl text-green">{points}</div>
          <div className="text-[10px] text-[#5C8A72] font-extrabold">POINTS</div>
        </div>
      </div>
      <Button
        onClick={() => {
          router.push("/home");
          router.refresh();
        }}
        className="mt-6.5 px-10"
      >
        Back home
      </Button>
    </div>
  );
}

export function LogFlow({
  profile,
  alreadyLoggedToday,
}: {
  profile: Profile;
  alreadyLoggedToday: DailyLog | null;
}) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"choose" | "scanning" | "detected">("choose");
  const [detected, setDetected] = useState<DetectedScreenTime | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hours, setHours] = useState(profile.daily_goal_hours);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitDailyLogResult | null>(null);

  if (alreadyLoggedToday && !result) {
    return (
      <ResultScreen
        profile={profile}
        outcome={alreadyLoggedToday.outcome}
        health={healthState(profile.last_outcome, profile.consecutive_drops)}
        result={{
          outcome: alreadyLoggedToday.outcome,
          points_earned: alreadyLoggedToday.points_earned,
          streak: alreadyLoggedToday.streak_after,
          points: profile.points,
          hours_reported: alreadyLoggedToday.hours_reported,
          yesterday_hours: profile.baseline_hours,
          goal_hours: profile.daily_goal_hours,
          consecutive_drops: profile.consecutive_drops,
        }}
      />
    );
  }

  if (result) {
    return (
      <ResultScreen
        profile={profile}
        outcome={result.outcome}
        health={healthState(result.outcome, result.consecutive_drops)}
        result={result}
      />
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.rpc("submit_daily_log", { p_hours: hours });
    setSubmitting(false);
    if (error) {
      setError(error.message.includes("already logged") ? "You've already logged today." : error.message);
      return;
    }
    setResult(data as unknown as SubmitDailyLogResult);
  }

  async function handleFile(file: File) {
    setScanError(null);
    setMode("scanning");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/detect-screen-time", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error ?? "Couldn't read that screenshot.");
        setMode("choose");
        return;
      }
      setDetected(data as DetectedScreenTime);
      setHours(Math.round(data.total_hours * 10) / 10);
      setMode("detected");
    } catch {
      setScanError("Couldn't reach the scanner — check your connection.");
      setMode("choose");
    }
  }

  if (mode === "choose") {
    return (
      <div className="px-5.5 pt-2 pb-6 flex-1 flex flex-col min-h-full animate-rise lg:max-w-[560px] lg:mx-auto lg:w-full lg:pt-8">
        <h1 className="font-heading font-semibold text-[28px] mt-3.5 mb-1.5 text-ink tracking-tight">
          Log today
        </h1>
        <p className="text-[15px] text-ink-muted mb-5.5 leading-relaxed">
          Drop a screenshot of your phone&apos;s screen-time page — we read the social apps for
          you.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#C7B98F] bg-cream rounded-[26px] px-5 py-8.5 cursor-pointer flex flex-col items-center gap-3.5 transition hover:border-green hover:bg-white"
        >
          <div className="w-[78px] h-[78px] rounded-[22px] bg-green-card flex items-center justify-center text-4xl">
            📷
          </div>
          <div className="font-heading font-semibold text-lg text-green">
            Upload a screenshot
          </div>
          <div className="text-[13px] text-ink-faint font-bold">PNG or JPG · we do the rest</div>
        </button>

        {scanError && (
          <p className="text-terracotta text-sm font-bold text-center mt-4">{scanError}</p>
        )}
      </div>
    );
  }

  if (mode === "scanning") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5.5 text-center px-6 min-h-[70vh] lg:max-w-[560px] lg:mx-auto lg:w-full">
        <div className="w-[120px] h-[120px] relative">
          <div className="w-[120px] h-[120px] rounded-full border-[7px] border-green-card border-t-green animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🔎</div>
        </div>
        <div>
          <div className="font-heading font-semibold text-xl text-ink">
            Reading your screenshot…
          </div>
          <div className="text-sm text-ink-soft font-bold mt-1.5">
            Finding your social apps
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5.5 pt-2 pb-6 flex-1 flex flex-col min-h-full animate-rise lg:max-w-[560px] lg:mx-auto lg:w-full lg:pt-8">
      <div className="flex items-center gap-2 text-green font-extrabold text-[13px] mt-3.5 mb-1">
        <span className="w-[22px] h-[22px] bg-green-card rounded-full flex items-center justify-center">
          ✓
        </span>
        DETECTED FROM SCREENSHOT
      </div>
      <h1 className="font-heading font-semibold text-[28px] mb-4.5 text-ink tracking-tight">
        You spent this on social
      </h1>
      <Card className="p-5.5">
        <div className="text-center">
          <span className="font-heading font-bold text-[56px] text-green leading-none">
            {hours.toFixed(1)}
          </span>
          <span className="font-heading text-[26px] text-green-pale">h</span>
        </div>
        {detected && detected.apps.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            {detected.apps.map((app, i) => {
              const pct = Math.round((app.hours / Math.max(detected.total_hours, 0.05)) * 100);
              const color = APP_BAR_COLORS[i % APP_BAR_COLORS.length];
              return (
                <div key={app.name}>
                  <div className="flex justify-between text-[13px] font-bold text-ink-muted mb-1">
                    <span>{app.name}</span>
                    <span>{formatHours(app.hours)}</span>
                  </div>
                  <div className="h-2 bg-border-faint rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {detected && detected.apps.length === 0 && (
          <p className="text-[13px] text-ink-faint font-bold text-center mt-4">
            No specific social app breakdown was visible on that screenshot.
          </p>
        )}
      </Card>
      <div className="text-[13px] text-ink-soft font-bold mt-5 mb-2 text-center">
        Not quite right? Nudge it.
      </div>
      <Slider
        min={0}
        max={Math.max(profile.baseline_hours, 8)}
        step={0.1}
        value={hours}
        onChange={(e) => setHours(parseFloat(e.target.value))}
      />
      <button
        type="button"
        onClick={() => setMode("choose")}
        className="text-[13px] text-ink-faint font-bold mt-4 self-center cursor-pointer bg-transparent border-none"
      >
        Scan a different screenshot
      </button>

      {error && <p className="text-terracotta text-sm font-bold text-center mt-4">{error}</p>}

      <Button onClick={handleSubmit} disabled={submitting} className="w-full mt-6">
        {submitting ? "Logging…" : "Confirm & see result"}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { CompanionArt } from "@/lib/domain/companionArt";
import { COMPANION_NICKNAME } from "@/lib/domain/companion";
import { AppFrame } from "@/components/AppFrame";
import type { CompanionType } from "@/lib/types";

const COMPANION_OPTIONS: { type: CompanionType; sub: string }[] = [
  { type: "plant", sub: "A plant that grows tall" },
  { type: "animal", sub: "A cheeky little critter" },
  { type: "character", sub: "A friendly blob buddy" },
];

const RULES = [
  { color: "#1E5A44", text: "At or under it → streak grows, full points" },
  { color: "#E6A94E", text: "Over, but under yesterday → streak holds" },
  { color: "#C97C54", text: "Over & up from yesterday → fresh start" },
];

export function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState(4);
  const [goal, setGoal] = useState(2);
  const [companion, setCompanion] = useState<CompanionType>("plant");
  const [saving, setSaving] = useState(false);

  async function finish(finalBaseline: number, finalGoal: number, finalCompanion: CompanionType) {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        baseline_hours: finalBaseline,
        daily_goal_hours: finalGoal,
        companion_type: finalCompanion,
        onboarded: true,
      })
      .eq("id", user.id);

    router.push("/home");
    router.refresh();
  }

  return (
    <AppFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-6 py-10">
      <div className="w-full max-w-[420px] mx-auto flex flex-col flex-1">
        <div className="flex gap-1.5 justify-center mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-[34px] h-1.5 rounded-full"
              style={{ background: i <= step ? "#1E5A44" : "#DDD4BE" }}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex-1 flex flex-col animate-rise">
            <div className="font-heading font-semibold text-[15px] text-terracotta tracking-wide uppercase">
              Welcome 👋
            </div>
            <h1 className="font-heading font-semibold text-[30px] leading-[1.12] mt-2 mb-1.5 text-ink tracking-tight">
              How much time do you spend on social a day?
            </h1>
            <p className="text-[15px] text-ink-muted mb-auto leading-relaxed">
              A rough guess is fine — you can fine-tune it any time.
            </p>
            <div className="text-center my-3.5">
              <div className="font-heading font-bold text-[74px] text-green leading-none tracking-tight">
                {baseline.toFixed(1)}
                <span className="text-[30px] text-green-pale">h</span>
              </div>
              <div className="text-sm text-ink-soft font-bold mt-1">per day, on average</div>
            </div>
            <Slider
              min={1}
              max={8}
              step={0.5}
              value={baseline}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setBaseline(v);
                setGoal((g) => Math.min(g, v));
              }}
              className="mb-1.5"
            />
            <div className="flex justify-between text-xs text-ink-faint font-bold mb-6">
              <span>1h</span>
              <span>8h+</span>
            </div>
            <Button onClick={() => setStep(1)} className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col animate-rise">
            <h1 className="font-heading font-semibold text-[30px] leading-[1.12] mb-1.5 text-ink tracking-tight">
              Meet your buddy
            </h1>
            <p className="text-[15px] text-ink-muted mb-5 leading-relaxed">
              They grow when you unplug. Pick who joins you.
            </p>
            <div className="flex flex-col gap-3.5 flex-1">
              {COMPANION_OPTIONS.map((opt) => {
                const on = companion === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setCompanion(opt.type)}
                    className="flex items-center gap-3.5 rounded-[22px] px-4 py-3 text-left cursor-pointer transition"
                    style={{
                      border: `2.5px solid ${on ? "#1E5A44" : "#EDE6D4"}`,
                      background: on ? "#EAF3EC" : "#fff",
                    }}
                  >
                    <div className="w-[76px] h-[76px] flex-none flex items-center justify-center bg-[#F3EEDF] rounded-[20px]">
                      <CompanionArt type={opt.type} health="healthy" level="mature" size={60} />
                    </div>
                    <div className="flex-1">
                      <div className="font-heading font-semibold text-[19px] text-ink">
                        {COMPANION_NICKNAME[opt.type]}
                      </div>
                      <div className="text-[13px] text-ink-soft font-semibold">{opt.sub}</div>
                    </div>
                    <div
                      className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                      style={{ background: on ? "#1E5A44" : "#E4DCC7" }}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => setStep(2)} className="w-full mt-4">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col animate-rise">
            <div className="font-heading font-semibold text-[15px] text-terracotta tracking-wide uppercase">
              Your daily line ⚑
            </div>
            <h1 className="font-heading font-semibold text-[30px] leading-[1.12] mt-2 mb-1.5 text-ink tracking-tight">
              Draw your limit
            </h1>
            <p className="text-[14.5px] text-ink-muted mb-3.5 leading-relaxed">
              Every streak, point and companion grows from this one number. Make it a
              stretch — but a kind one.
            </p>
            <div
              className="rounded-[26px] p-5.5 text-center shadow-[0_16px_30px_-14px_rgba(30,90,68,0.55)]"
              style={{ background: "linear-gradient(165deg,#1E5A44,#2E7D5B)" }}
            >
              <div className="text-xs text-white/70 font-extrabold uppercase tracking-wide">
                Max social time / day
              </div>
              <div className="font-heading font-bold text-[78px] text-white leading-none tracking-tight mt-0.5">
                {goal.toFixed(1)}
                <span className="text-[30px] text-green-pale">h</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-white/[.14] rounded-full px-3 py-1.5 mt-2 text-[#DCEBE1] text-xs font-bold">
                from {baseline.toFixed(1)}h today <span className="text-green-pale">↓</span>
              </div>
            </div>
            <Slider
              min={0}
              max={baseline}
              step={0.5}
              value={goal}
              onChange={(e) => setGoal(parseFloat(e.target.value))}
              gradient="linear-gradient(90deg,#8FD3A8,#1E5A44)"
              className="my-4"
            />
            <div className="flex justify-between text-xs text-ink-faint font-bold mb-4">
              <span>0h · fully unplugged</span>
              <span>{baseline.toFixed(1)}h</span>
            </div>
            <div className="flex flex-col gap-2 mb-4.5">
              {RULES.map((r) => (
                <div key={r.text} className="flex items-center gap-2.5 text-[13px] text-[#4A5A50] font-bold">
                  <span className="w-2.5 h-2.5 rounded-[3px] flex-none" style={{ background: r.color }} />
                  {r.text}
                </div>
              ))}
            </div>
            <Button
              variant="cta"
              onClick={() => finish(baseline, goal, companion)}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Setting up…" : "Lock in my goal →"}
            </Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => finish(4, 2, "plant")}
          disabled={saving}
          className="bg-transparent border-none text-ink-faint font-body font-bold text-[13px] cursor-pointer mt-3.5 self-center"
        >
          Skip intro
        </button>
      </div>
      </div>
    </AppFrame>
  );
}

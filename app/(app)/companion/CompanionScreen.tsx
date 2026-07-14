"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CompanionArt } from "@/lib/domain/companionArt";
import {
  COMPANION_NICKNAME,
  HEALTH_COLOR,
  HEALTH_LABEL,
  LEVEL_LABEL,
  LEVEL_THRESHOLDS,
  healthState,
  levelProgress,
} from "@/lib/domain/companion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { FoodShop } from "@/components/companion/FoodShop";
import type { FoodKey, Profile, SpendPointsResult } from "@/lib/types";

export function CompanionScreen({ profile: initialProfile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState(initialProfile);
  const [shopOpen, setShopOpen] = useState(false);
  const [feedingKey, setFeedingKey] = useState<FoodKey | null>(null);
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  const health = healthState(profile.last_outcome, profile.consecutive_drops);
  const nickname = COMPANION_NICKNAME[profile.companion_type];
  const progress = levelProgress(profile.xp, profile.level);
  const nextThreshold = LEVEL_THRESHOLDS[profile.level].max;

  async function handleFeed(key: FoodKey) {
    setFeedingKey(key);
    setJustLeveledUp(false);
    const { data, error } = await supabase.rpc("spend_points_on_food", { p_food_key: key });
    setFeedingKey(null);
    if (error) return;

    const result = data as unknown as SpendPointsResult;
    setProfile((p) => ({ ...p, points: result.points, xp: result.xp, level: result.level }));
    if (result.leveled_up) setJustLeveledUp(true);
    router.refresh();
  }

  return (
    <div className="px-5.5 pt-2 pb-8 lg:px-9 lg:pt-8 lg:pb-8 animate-rise">
      <h1 className="font-heading font-semibold text-[28px] mt-3.5 mb-0.5 lg:mt-0 text-ink tracking-tight">
        Your buddy
      </h1>
      <p className="text-sm text-ink-soft font-bold mb-4">
        Feed {nickname} with points to grow them for good
      </p>

      <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-7 lg:items-center">
        <div
          className="rounded-[30px] p-6 lg:p-8 text-center relative overflow-hidden"
          style={{ background: "linear-gradient(165deg,#EAF3EC,#F6F1E4)" }}
        >
          <div
            className="absolute top-4 right-4.5 bg-white rounded-full px-3 py-1.5 font-heading font-semibold text-[13px] shadow-[0_3px_8px_-4px_rgba(0,0,0,0.2)]"
            style={{ color: "#1E5A44" }}
          >
            {LEVEL_LABEL[profile.level]}
          </div>
          <div className="w-[200px] h-[200px] lg:w-[220px] lg:h-[220px] mx-auto mt-1.5 flex items-center justify-center">
            <CompanionArt type={profile.companion_type} health={health} level={profile.level} size={180} animate />
          </div>
          <div className="font-heading font-semibold text-[22px] text-ink mt-1.5">{nickname}</div>

          <div className="max-w-[260px] mx-auto mt-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] font-extrabold text-ink-soft uppercase tracking-wide">
                Health
              </span>
              <span className="font-heading font-semibold text-base" style={{ color: HEALTH_COLOR[health] }}>
                {HEALTH_LABEL[health]}
              </span>
            </div>
            <ProgressBar
              pct={health === "healthy" ? 100 : health === "neutral" ? 55 : 20}
              color={HEALTH_COLOR[health]}
            />
          </div>

          <div className="max-w-[260px] mx-auto mt-4">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] font-extrabold text-ink-soft uppercase tracking-wide">
                Level progress
              </span>
              <span className="font-heading font-semibold text-base text-green">
                {nextThreshold === null ? "Max level" : `${profile.xp} / ${nextThreshold} xp`}
              </span>
            </div>
            <ProgressBar pct={progress * 100} color="#E6A94E" trackColor="#FBF0E0" height={10} />
          </div>
        </div>

        <div className="mt-5 lg:mt-0 lg:flex lg:flex-col lg:gap-4">
          {justLeveledUp && (
            <div className="bg-green-card rounded-2xl px-4 py-3 mb-4 lg:mb-0 text-center font-heading font-semibold text-green">
              {nickname} leveled up to {LEVEL_LABEL[profile.level]}! 🎉
            </div>
          )}

          <Button variant="cta" onClick={() => setShopOpen(true)} className="w-full">
            Feed {nickname}
          </Button>

          <div className="bg-terracotta-card rounded-[20px] p-4 mt-5 lg:mt-0 flex gap-3 items-center">
            <div className="text-[28px]">🔥</div>
            <div className="text-[13px] text-[#8A6A3E] font-semibold leading-snug">
              Your streak drives {nickname}&apos;s health day to day. Points you earn buy food
              that permanently grows them — <b>baby → growing → mature</b>.
            </div>
          </div>
        </div>
      </div>

      <FoodShop
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        points={profile.points}
        feedingKey={feedingKey}
        onFeed={handleFeed}
      />
    </div>
  );
}

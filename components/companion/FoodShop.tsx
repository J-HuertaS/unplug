"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FoodKey } from "@/lib/types";

const FOODS: { key: FoodKey; name: string; icon: string; cost: number; sub: string }[] = [
  { key: "apple", name: "Apple", icon: "🍎", cost: 30, sub: "+30 xp" },
  { key: "smoothie", name: "Smoothie", icon: "🥤", cost: 80, sub: "+80 xp" },
  { key: "cake", name: "Cake", icon: "🍰", cost: 150, sub: "+150 xp" },
];

export function FoodShop({
  open,
  onClose,
  points,
  feedingKey,
  onFeed,
}: {
  open: boolean;
  onClose: () => void;
  points: number;
  feedingKey: FoodKey | null;
  onFeed: (key: FoodKey) => void;
}) {
  // Portal to document.body: an ancestor (the screen wrapper) uses an
  // `animate-*` utility, and any `transform` on an ancestor — even the
  // identity transform an animation settles on — creates a new containing
  // block for `position: fixed` descendants. Without the portal, the
  // backdrop ends up clipped to that ancestor's box instead of the viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[380px] bg-white rounded-[28px] p-6 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-heading font-semibold text-[22px] text-ink tracking-tight">
            Food shop
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-border-faint flex items-center justify-center text-ink-soft font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-[13px] text-ink-soft font-semibold mb-5">
          {points} points available
        </p>

        <div className="flex flex-col gap-3">
          {FOODS.map((food) => {
            const affordable = points >= food.cost;
            const loading = feedingKey === food.key;
            return (
              <div
                key={food.key}
                className="flex items-center gap-3.5 bg-cream rounded-[20px] px-4 py-3.5"
              >
                <div className="w-12 h-12 flex-none rounded-2xl bg-white flex items-center justify-center text-2xl">
                  {food.icon}
                </div>
                <div className="flex-1">
                  <div className="font-heading font-semibold text-base text-ink">{food.name}</div>
                  <div className="text-[12px] text-ink-soft font-bold">
                    {food.cost} pts · {food.sub}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!affordable || loading}
                  onClick={() => onFeed(food.key)}
                  className="font-heading font-semibold text-sm rounded-2xl px-4 py-2.5 bg-green text-white disabled:bg-border-soft disabled:text-ink-faint cursor-pointer disabled:cursor-not-allowed transition"
                >
                  {loading ? "…" : "Feed"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

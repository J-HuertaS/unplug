export type RecTier = "light" | "moderate" | "immersive";

export interface Recommendation {
  key: string;
  title: string;
  sub: string;
  icon: "walk" | "stretch" | "book" | "puzzle" | "cook" | "draw" | "outside";
}

const TIERS: Record<RecTier, Recommendation[]> = {
  light: [
    { key: "walk", title: "Take a short walk", sub: "10-15 minutes, no phone", icon: "walk" },
    { key: "stretch", title: "Stretch it out", sub: "Loosen up between classes", icon: "stretch" },
  ],
  moderate: [
    { key: "book", title: "Read a physical book", sub: "Lose yourself in a chapter", icon: "book" },
    { key: "puzzle", title: "Do a puzzle", sub: "1000-piece challenge", icon: "puzzle" },
  ],
  immersive: [
    { key: "cook", title: "Cook something new", sub: "Try a recipe you've saved", icon: "cook" },
    { key: "draw", title: "Draw", sub: "No talent required, just time", icon: "draw" },
    { key: "outside", title: "Go outside", sub: "Around Ciudad Universitaria", icon: "outside" },
  ],
};

export function recTierFromHoursSaved(hoursSaved: number): RecTier {
  if (hoursSaved < 1) return "light";
  if (hoursSaved <= 3) return "moderate";
  return "immersive";
}

export function recommendationsFor(hoursSaved: number): Recommendation[] {
  return TIERS[recTierFromHoursSaved(hoursSaved)];
}

export const REC_ICON: Record<Recommendation["icon"], string> = {
  walk: "🚶",
  stretch: "🧘",
  book: "📖",
  puzzle: "🧩",
  cook: "🍳",
  draw: "🎨",
  outside: "🌳",
};

export const REC_TINT: Record<Recommendation["icon"], string> = {
  walk: "#FCEEDD",
  stretch: "#FCEEDD",
  book: "#EAF3EC",
  puzzle: "#F1ECF5",
  cook: "#FBF0E6",
  draw: "#FBF0E6",
  outside: "#EAF3EC",
};

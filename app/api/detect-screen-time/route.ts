import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// The only apps that ever count toward social-media time. Enforced here in code
// (not just in the prompt) so a model misclassification can never leak a
// non-social app (WhatsApp, banking apps, streaming, games, ...) into the total.
const SOCIAL_APP_KEYWORDS = [
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "snapchat",
  "reddit",
  "pinterest",
  "linkedin",
  "threads",
  "bereal",
  "discord",
  "youtube",
];

function isSocialApp(name: string): boolean {
  const n = name.toLowerCase();
  return SOCIAL_APP_KEYWORDS.some((k) => n.includes(k));
}

const ScreenTimeSchema = z.object({
  total_minutes: z
    .number()
    .int()
    .describe(
      "Only used when the screenshot shows a single aggregate total with no per-app list — the " +
        "total social media duration shown, as a whole number of minutes. If there's a per-app " +
        "list instead, this field is ignored (the total is computed from `apps`), so just put 0.",
    ),
  apps: z
    .array(
      z.object({
        name: z.string().describe("The app's display name exactly as shown, e.g. 'Instagram'."),
        minutes: z.number().int().describe("That app's individual duration, in whole minutes."),
      }),
    )
    .describe(
      "Every app from the fixed list below that appears in a per-app breakdown on the " +
        "screenshot, each with its own duration. Empty array if none appear, or if the " +
        "screenshot only shows one aggregate total instead of a per-app list.",
    ),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Screenshot scanning isn't configured on this server yet." },
      { status: 501 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a PNG, JPG, or WebP screenshot." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer()).toString("base64");
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: file.type as "image/png" | "image/jpeg" | "image/webp", data: bytes },
            },
            {
              type: "text",
              text: `This is a screenshot from a phone's Screen Time (iOS) or Digital Wellbeing (Android) feature. It could be either of two layouts:

1. A summary page with one big aggregate total duration at the top, and no per-app list.
2. A "Most Used" / per-app list, where each app has its own duration shown next to it.

The ONLY apps that ever count as social media for this task are exactly these — nothing else, ever: Instagram, TikTok, Facebook, X (Twitter), Snapchat, Reddit, Pinterest, LinkedIn, Threads, BeReal, Discord, YouTube.

- If the screenshot shows a per-app list: put ONLY the apps from that exact list above into \`apps\`, each with its own duration. Do not include WhatsApp, iMessage, Telegram, Crunchyroll, Netflix, banking/finance apps, games, productivity apps, or anything else not on the list — no matter how large their duration is. If none of the listed apps appear, \`apps\` is an empty array. Set \`total_minutes\` to 0 in this case (it's unused).
- If the screenshot shows a single aggregate total with no per-app list at all: put that number in \`total_minutes\` and leave \`apps\` empty.

Report every duration as a whole number of minutes, converting hours shown into minutes (e.g. '1h 30m' -> 90, '28m' -> 28, '11 min' -> 11). Read precisely — do not round to the nearest hour.`,
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(ScreenTimeSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "Couldn't read that screenshot — try a clearer one." },
        { status: 422 },
      );
    }

    // Convert minutes -> hours ourselves (deterministic) rather than asking the model
    // to do the division. Also re-filter `apps` against the allowed list ourselves —
    // the prompt asks for a closed list, but a small vision model won't always comply,
    // so this is the actual enforcement, not just a suggestion to the model.
    const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;
    const { total_minutes, apps } = response.parsed_output;
    const socialApps = apps.filter((a) => isSocialApp(a.name));

    const totalMinutes = apps.length > 0 ? socialApps.reduce((sum, a) => sum + a.minutes, 0) : total_minutes;

    return NextResponse.json({
      total_hours: toHours(totalMinutes),
      apps: socialApps.map((a) => ({ name: a.name, hours: toHours(a.minutes) })),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that screenshot — try a clearer one." },
      { status: 502 },
    );
  }
}

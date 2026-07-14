"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/unplug-logo.svg" alt="Unplug" className="w-9 h-9 rounded-[11px]" />
        <div className="font-heading font-semibold text-[22px] text-green tracking-tight">Unplug</div>
      </div>

      <div className="w-full max-w-[360px] bg-white rounded-[26px] p-7 shadow-[0_16px_30px_-14px_rgba(30,90,68,0.25)]">
        <h1 className="font-heading font-semibold text-[26px] text-ink mb-1 tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-ink-muted text-[15px] mb-6">
          {mode === "signin"
            ? "Sign in to pick up your streak."
            : "Set up your account, then we'll set your daily goal."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[14px] border-2 border-border-soft px-4 py-3.5 text-[15px] font-body outline-none focus:border-green"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-[14px] border-2 border-border-soft px-4 py-3.5 text-[15px] font-body outline-none focus:border-green"
          />
          {error && <p className="text-terracotta text-sm font-bold">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-2 text-base">
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center mt-5 text-[13px] font-bold text-ink-soft cursor-pointer"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

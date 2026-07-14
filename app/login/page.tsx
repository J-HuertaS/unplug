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
  const [checkEmail, setCheckEmail] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(
          error.message.toLowerCase().includes("email not confirmed")
            ? "You haven't confirmed your email yet. Check your inbox, or resend the link below."
            : error.message,
        );
        if (error.message.toLowerCase().includes("email not confirmed")) setCheckEmail(true);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    // Sign up. Pass emailRedirectTo explicitly so the confirmation link lands
    // back on whatever domain the signup actually happened from (this env's
    // origin), instead of solely relying on the Supabase dashboard's Site URL
    // — that domain still needs to be in the project's Redirect URLs allowlist.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Email confirmations are off (e.g. local dev) — already logged in.
      router.push("/");
      router.refresh();
      return;
    }

    // Confirmations are on — no session yet, don't redirect. Tell the user what's next.
    setCheckEmail(true);
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setResending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResent(true);
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/unplug-logo.svg" alt="Unplug" className="w-9 h-9 rounded-[11px]" />
          <div className="font-heading font-semibold text-[22px] text-green tracking-tight">Unplug</div>
        </div>

        <div className="w-full max-w-[360px] bg-white rounded-[26px] p-7 shadow-[0_16px_30px_-14px_rgba(30,90,68,0.25)] text-center">
          <div className="text-4xl mb-3">📬</div>
          <h1 className="font-heading font-semibold text-[22px] text-ink mb-2 tracking-tight">
            Check your email
          </h1>
          <p className="text-ink-muted text-[15px] leading-relaxed mb-5">
            We sent a confirmation link to <span className="font-bold text-ink">{email}</span>.
            Click it to activate your account, then come back and sign in.
          </p>

          {error && <p className="text-terracotta text-sm font-bold mb-3">{error}</p>}
          {resent && <p className="text-green text-sm font-bold mb-3">Sent again — check your inbox.</p>}

          <Button
            variant="secondary"
            onClick={handleResend}
            disabled={resending}
            className="w-full text-base mb-3"
          >
            {resending ? "Sending…" : "Resend confirmation email"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setCheckEmail(false);
              setMode("signin");
              setResent(false);
              setError(null);
            }}
            className="w-full text-center text-[13px] font-bold text-ink-soft cursor-pointer"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
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
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="w-full text-center mt-5 text-[13px] font-bold text-ink-soft cursor-pointer"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

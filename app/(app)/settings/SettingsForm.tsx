"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Card } from "@/components/ui/Card";
import { NavIcon } from "@/components/nav-items";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile, email }: { profile: Profile; email: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState(profile.user_name ?? "");
  const [goal, setGoal] = useState(profile.daily_goal_hours);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const { error } = await supabase
      .from("profiles")
      .update({ user_name: userName.trim() || null, daily_goal_hours: goal })
      .eq("id", profile.id);

    setSavingProfile(false);
    if (error) {
      setProfileError(error.message);
      return;
    }
    setProfileSaved(true);
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSaved(true);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-5.5 pt-2 pb-8 lg:px-9 lg:pt-8 lg:pb-8 lg:max-w-[560px] animate-rise">
      <div className="flex items-center gap-2 mt-3.5 mb-4 lg:mt-0">
        <Link
          href="/home"
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-none"
        >
          <NavIcon name="back" color="#22332B" size={20} />
        </Link>
        <h1 className="font-heading font-semibold text-[26px] text-ink tracking-tight">
          Settings
        </h1>
      </div>

      <div className="text-xs text-ink-soft font-extrabold uppercase tracking-wide mb-2">
        Profile
      </div>
      <Card className="p-5">
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label className="text-[13px] text-ink-soft font-bold block mb-1.5">Email</label>
            <div className="w-full rounded-[14px] border-2 border-border-faint bg-cream px-4 py-3 text-[15px] text-ink-muted">
              {email}
            </div>
          </div>

          <div>
            <label className="text-[13px] text-ink-soft font-bold block mb-1.5">Display name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              className="w-full rounded-[14px] border-2 border-border-soft px-4 py-3 text-[15px] font-body outline-none focus:border-green"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[13px] text-ink-soft font-bold">Daily goal</label>
              <span className="font-heading font-semibold text-green">{goal.toFixed(1)}h</span>
            </div>
            <Slider
              min={0}
              max={Math.max(profile.baseline_hours, 8)}
              step={0.5}
              value={goal}
              onChange={(e) => setGoal(parseFloat(e.target.value))}
            />
          </div>

          {profileError && <p className="text-terracotta text-sm font-bold">{profileError}</p>}
          {profileSaved && <p className="text-green text-sm font-bold">Saved.</p>}

          <Button type="submit" disabled={savingProfile} className="w-full text-base">
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>

      <div className="text-xs text-ink-soft font-extrabold uppercase tracking-wide mb-2 mt-6">
        Password
      </div>
      <Card className="p-5">
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-[14px] border-2 border-border-soft px-4 py-3 text-[15px] font-body outline-none focus:border-green"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-[14px] border-2 border-border-soft px-4 py-3 text-[15px] font-body outline-none focus:border-green"
          />
          {passwordError && <p className="text-terracotta text-sm font-bold">{passwordError}</p>}
          {passwordSaved && <p className="text-green text-sm font-bold">Password updated.</p>}
          <Button type="submit" disabled={savingPassword} variant="secondary" className="w-full text-base">
            {savingPassword ? "Updating…" : "Change password"}
          </Button>
        </form>
      </Card>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 rounded-[18px] border-2 border-terracotta text-terracotta font-heading font-semibold text-base cursor-pointer disabled:opacity-50"
      >
        <NavIcon name="logout" color="#C97C54" size={20} />
        {signingOut ? "Signing out…" : "Log out"}
      </button>
    </div>
  );
}

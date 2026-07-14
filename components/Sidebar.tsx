"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, NavIcon } from "@/components/nav-items";
import { createClient } from "@/lib/supabase/client";

const ACTIVE = "#1E5A44";
const MUTED = "#8A9990";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="hidden lg:flex lg:flex-none lg:w-[224px] lg:flex-col lg:border-r lg:border-border-faint lg:bg-white lg:py-7 lg:px-4">
      <div className="flex items-center gap-2.5 px-2 mb-9">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/unplug-logo.svg" alt="Unplug" className="w-8 h-8 rounded-[10px]" />
        <div className="font-heading font-semibold text-lg text-green tracking-tight">Unplug</div>
      </div>

      <div className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const color = active ? ACTIVE : MUTED;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition"
              style={{ background: active ? "#EAF3EC" : "transparent" }}
            >
              <NavIcon name={item.icon} color={color} size={22} />
              <span className="font-heading font-semibold text-[15px]" style={{ color: active ? "#22332B" : "#6B7C72" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-border-faint">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition"
          style={{ background: pathname === "/settings" ? "#EAF3EC" : "transparent" }}
        >
          <NavIcon name="gear" color={pathname === "/settings" ? ACTIVE : MUTED} size={22} />
          <span
            className="font-heading font-semibold text-[15px]"
            style={{ color: pathname === "/settings" ? "#22332B" : "#6B7C72" }}
          >
            Settings
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition cursor-pointer text-left"
        >
          <NavIcon name="logout" color="#C97C54" size={22} />
          <span className="font-heading font-semibold text-[15px] text-terracotta">Log out</span>
        </button>
      </div>
    </nav>
  );
}

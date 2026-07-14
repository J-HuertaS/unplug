"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, NavIcon } from "@/components/nav-items";

const ACTIVE = "#1E5A44";
const MUTED = "#9BA99B";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden flex-none bg-white border-t border-border-faint px-3.5 pt-2.5 pb-6 flex justify-around shadow-[0_-6px_20px_-12px_rgba(0,0,0,0.15)]">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const color = active ? ACTIVE : MUTED;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 px-2.5 py-1"
          >
            <div
              className="w-11 h-[34px] rounded-[14px] flex items-center justify-center"
              style={{ background: active ? "#EAF3EC" : "transparent" }}
            >
              <NavIcon name={item.icon} color={color} />
            </div>
            <div className="font-heading font-semibold text-[11px]" style={{ color }}>
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

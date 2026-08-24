"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Inbox, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/today", label: "今天", icon: Sun },
  { href: "/tasks", label: "任务", icon: Inbox },
  { href: "/calendar", label: "日历", icon: CalendarDays },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center border-r border-white/8 bg-[#151515] py-3">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#365299] text-xs font-semibold">
        L
      </div>

      <nav className="flex flex-col items-center gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/8 hover:text-white",
                active && "bg-[#365299] text-white hover:bg-[#365299] hover:text-white",
              )}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

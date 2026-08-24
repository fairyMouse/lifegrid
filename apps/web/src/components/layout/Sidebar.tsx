"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CircleHelp,
  Clock3,
  Inbox,
  LayoutGrid,
  RefreshCw,
  Search,
  Star,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/today", label: "今天", icon: Sun },
  { href: "/tasks", label: "任务", icon: Inbox },
  { href: "/calendar", label: "日历", icon: CalendarDays },
] as const;

const PLACEHOLDERS = [
  { label: "看板", icon: LayoutGrid },
  { label: "专注", icon: Clock3 },
  { label: "搜索", icon: Search },
  { label: "收藏", icon: Star },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center border-r border-white/8 bg-[#151515] py-3">
      <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#365299] text-xs font-semibold">
        L
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
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

        <div className="my-2 h-px w-6 bg-white/10" />

        {PLACEHOLDERS.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.label}
              title={`${item.label}（后续版本）`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/25"
            >
              <Icon size={18} />
            </span>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1">
        {[
          { label: "同步（后续版本）", icon: RefreshCw },
          { label: "通知（后续版本）", icon: Bell },
          { label: "帮助（后续版本）", icon: CircleHelp },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.label}
              title={item.label}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/25"
            >
              <Icon size={18} />
            </span>
          );
        })}
      </div>
    </aside>
  );
}

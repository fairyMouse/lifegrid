"use client";

import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarView } from "./types";

type Props = {
  title: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: (anchor: DOMRect) => void;
};

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "month", label: "月" },
  { id: "week", label: "周" },
];

export function CalendarToolbar({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onCreate,
}: Props) {
  const [open, setOpen] = useState(false);
  const current = VIEWS.find((item) => item.id === view)?.label ?? "月";
  const stepLabel = view === "week" ? "周" : "月";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between px-4">
      <h1 className="text-[15px] font-medium tracking-wide">{title}</h1>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => onCreate(event.currentTarget.getBoundingClientRect())}
          title="新建任务"
        >
          <Plus size={16} />
        </Button>

        <div className="relative">
          <Button variant="outline" onClick={() => setOpen((value) => !value)}>
            {current}
            <ChevronDown size={14} className="text-white/50" />
          </Button>
          {open ? (
            <div className="absolute right-0 z-20 mt-1 w-24 rounded-md border border-white/10 bg-[#1c1c1c] py-1 shadow-lg">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-1.5 text-left text-sm text-white/80 hover:bg-white/8",
                    item.id === view && "text-white",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <Button variant="outline" size="icon" onClick={onPrev} title={`上一${stepLabel}`}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" onClick={onToday}>
          今天
        </Button>
        <Button variant="outline" size="icon" onClick={onNext} title={`下一${stepLabel}`}>
          <ChevronRight size={16} />
        </Button>
        <Button variant="ghost" size="icon" title="更多">
          <MoreHorizontal size={16} />
        </Button>
      </div>
    </header>
  );
}

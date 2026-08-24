"use client";

import { formatTaskDateLabel, PRIORITY_LABEL } from "@lifegrid/domain";
import type { TaskPriority } from "@lifegrid/types";
import { CalendarDays, Flag, Inbox, List, MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { placePopover } from "@/lib/place-popover";
import { cn } from "@/lib/utils";

const POPUP_W = 340;
const POPUP_H = 176;
const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high"];

type Props = {
  dateKey: string;
  anchor: DOMRect;
  onSubmit: (title: string, priority: TaskPriority) => void;
  onCancel: () => void;
};

export function TaskCreatePopover({ dateKey, anchor, onSubmit, onCancel }: Props) {
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const onSubmitRef = useRef(onSubmit);
  const onCancelRef = useRef(onCancel);
  const [priority, setPriority] = useState<TaskPriority>("none");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const pos = placePopover(anchor, POPUP_W, POPUP_H);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
    onCancelRef.current = onCancel;
  }, [onSubmit, onCancel]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [dateKey]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelRef.current();
    }
    function onPointer(event: PointerEvent) {
      const node = event.target as Node | null;
      if (node && rootRef.current?.contains(node)) return;
      const title = inputRef.current?.value.trim() ?? "";
      if (title) onSubmitRef.current(title, priority);
      else onCancelRef.current();
    }

    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", onPointer, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [priority]);

  return (
    <form
      ref={rootRef}
      className="lg-create-pop fixed z-40 flex w-[min(340px,calc(100vw-24px))] flex-col rounded-xl border border-white/10 bg-[#242424] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
      style={{ top: pos.top, left: pos.left }}
      onSubmit={(event) => {
        event.preventDefault();
        const title = inputRef.current?.value.trim() ?? "";
        if (title) onSubmit(title, priority);
        else onCancel();
      }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-2.5">
        <CalendarDays size={14} className="text-[#7aa2ff]" />
        <span className="text-[12px] text-white/55">{formatTaskDateLabel(dateKey)}</span>
        <div className="relative ml-auto">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/45 hover:bg-white/8"
            title="优先级"
            onClick={() => setPriorityOpen((value) => !value)}
          >
            <Flag
              size={14}
              className={cn(
                priority === "high" && "text-red-400",
                priority === "medium" && "text-amber-400",
                priority === "low" && "text-sky-400",
              )}
            />
          </button>
          {priorityOpen ? (
            <div className="absolute right-0 z-10 mt-1 w-24 rounded-md border border-white/10 bg-[#1c1c1c] py-1">
              {PRIORITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/8"
                  onClick={() => {
                    setPriority(item);
                    setPriorityOpen(false);
                  }}
                >
                  {PRIORITY_LABEL[item]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative px-3 py-2">
        <textarea
          ref={inputRef}
          rows={3}
          placeholder="准备做什么？"
          className="w-full resize-none bg-transparent pr-8 text-[15px] text-white outline-none placeholder:text-white/30"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <List
          size={14}
          className="pointer-events-none absolute top-3 right-4 text-white/25"
        />
      </div>

      <footer className="flex items-center justify-between border-t border-white/8 px-3 py-2">
        <span className="flex items-center gap-1 text-[12px] text-white/45">
          <Inbox size={13} />
          收集箱
        </span>
        <MoreHorizontal size={14} className="text-white/35" />
      </footer>
    </form>
  );
}

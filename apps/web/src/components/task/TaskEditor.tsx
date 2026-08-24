"use client";

import { formatTaskDateLabel, PRIORITY_LABEL } from "@lifegrid/domain";
import type { Task, TaskPriority } from "@lifegrid/types";
import { CalendarDays, Flag, Inbox, MoreHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  task: Task | null;
  createDueAt: string | null;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    description: string;
    dueAt: string | null;
    priority: TaskPriority;
  }) => Promise<Task>;
  onUpdate: (
    id: string,
    patch: Partial<Pick<Task, "title" | "description" | "dueAt" | "priority">>,
  ) => Promise<unknown>;
  onComplete: (id: string, completed: boolean) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
};

const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high"];

export function TaskEditor({
  task,
  createDueAt,
  onClose,
  onCreate,
  onUpdate,
  onComplete,
  onDelete,
}: Props) {
  const titleRef = useRef<HTMLInputElement>(null);
  const createdId = useRef<string | null>(task?.id ?? null);
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueAt, setDueAt] = useState(task?.dueAt ?? createDueAt);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "none");
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [onClose]);

  function scheduleSave(next: {
    title?: string;
    description?: string;
    dueAt?: string | null;
    priority?: TaskPriority;
  }) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persist(next);
    }, 400);
  }

  async function persist(patch: {
    title?: string;
    description?: string;
    dueAt?: string | null;
    priority?: TaskPriority;
  }) {
    const nextTitle = (patch.title ?? title).trim();
    if (!createdId.current) {
      if (!nextTitle) return;
      const created = await onCreate({
        title: nextTitle,
        description: patch.description ?? description ?? "",
        dueAt: patch.dueAt ?? dueAt,
        priority: patch.priority ?? priority,
      });
      createdId.current = created.id;
      return;
    }
    if (patch.title !== undefined && !nextTitle) return;
    await onUpdate(createdId.current, {
      ...patch,
      title: patch.title !== undefined ? nextTitle : undefined,
    });
  }

  const dateLabel = dueAt ? formatTaskDateLabel(dueAt) : "未设置日期";
  const completed = task?.status === "completed";

  return (
    <section className="absolute right-5 bottom-5 z-40 flex w-[360px] flex-col rounded-xl border border-white/10 bg-[#1c1c1c] shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-1 px-3 pt-2">
        <button
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border border-white/35",
            completed && "border-blue-400 bg-blue-500",
          )}
          onClick={() => {
            const id = createdId.current;
            if (id) void onComplete(id, !completed);
          }}
          title="完成"
        >
          {completed ? (
            <span className="block h-2 w-2 rounded-full bg-white" />
          ) : null}
        </button>
        <span className="ml-2 flex items-center gap-1 text-[12px] text-white/55">
          <CalendarDays size={13} />
          {dateLabel}
        </span>
        <div className="ml-auto flex items-center">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              title="优先级"
              onClick={() => setPriorityOpen((value) => !value)}
            >
              <Flag
                size={14}
                className={cn(
                  priority === "high" && "text-red-400",
                  priority === "medium" && "text-amber-400",
                  priority === "low" && "text-sky-400",
                  priority === "none" && "text-white/45",
                )}
              />
            </Button>
            {priorityOpen ? (
              <div className="absolute right-0 z-10 w-24 rounded-md border border-white/10 bg-[#242424] py-1">
                {PRIORITIES.map((item) => (
                  <button
                    key={item}
                    className="block w-full px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/8"
                    onClick={() => {
                      setPriority(item);
                      setPriorityOpen(false);
                      void persist({ priority: item });
                    }}
                  >
                    {PRIORITY_LABEL[item]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} title="关闭">
            <X size={14} />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-3">
        <Input
          ref={titleRef}
          value={title}
          placeholder="任务标题"
          className="h-auto border-0 bg-transparent px-0 text-[18px] font-semibold"
          onChange={(event) => {
            setTitle(event.target.value);
            scheduleSave({ title: event.target.value });
          }}
        />
        <Textarea
          value={description ?? ""}
          placeholder="添加描述"
          onChange={(event) => {
            setDescription(event.target.value);
            scheduleSave({ description: event.target.value });
          }}
        />
      </div>

      <div className="mt-2 border-t border-white/8 px-4 py-3">
        <label className="mb-1 block text-[11px] text-white/40">日期</label>
        <input
          type="date"
          value={dueAt ?? ""}
          onChange={(event) => {
            const next = event.target.value || null;
            setDueAt(next);
            void persist({ dueAt: next });
          }}
          className="h-8 rounded-md border border-white/10 bg-[#242424] px-2 text-sm text-white/80"
        />
      </div>

      <footer className="flex items-center justify-between border-t border-white/8 px-3 py-2">
        <span className="flex items-center gap-1 text-[12px] text-white/45">
          <Inbox size={13} />
          收集箱
        </span>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <MoreHorizontal size={14} />
          </Button>
          {menuOpen ? (
            <div className="absolute right-0 bottom-9 w-28 rounded-md border border-white/10 bg-[#242424] py-1">
              <button
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-white/8"
                onClick={async () => {
                  const id = createdId.current;
                  if (id) await onDelete(id);
                  onClose();
                }}
              >
                <Trash2 size={12} />
                删除
              </button>
            </div>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

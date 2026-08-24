"use client";

import type { Task } from "@lifegrid/types";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
};

export function TaskRow({ task, onOpen, onToggle }: Props) {
  const done = task.status === "completed";

  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/5">
      <button
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/35",
          done && "border-blue-400 bg-blue-500",
        )}
        onClick={() => onToggle(task)}
        title={done ? "标为未完成" : "完成"}
      />
      <button
        className={cn(
          "min-w-0 flex-1 truncate text-left text-[14px]",
          done && "text-white/40 line-through",
        )}
        onClick={() => onOpen(task)}
      >
        {task.title}
      </button>
    </div>
  );
}

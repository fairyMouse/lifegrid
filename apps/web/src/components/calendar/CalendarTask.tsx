import type { Task } from "@lifegrid/types";
import { cn } from "@/lib/utils";

export function CalendarTask({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        "flex h-[22px] items-center truncate px-1.5 text-[12px] leading-none text-white",
        task.status === "completed" && "opacity-45 line-through",
      )}
    >
      {task.status === "completed" ? `✓ ${task.title}` : task.title}
    </div>
  );
}

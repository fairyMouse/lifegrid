import type { CreateTaskInput, Task, TaskPriority } from "@lifegrid/types";
import { parseDueAt, toDateKey } from "./dates";

export const LOCAL_USER_ID = "local";

export function validateTaskTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "Title is required";
  if (trimmed.length > 200) return "Title is too long";
  return null;
}

export function isCompleted(task: Task): boolean {
  return task.status === "completed";
}

export function compareTasks(a: Task, b: Task): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.createdAt.localeCompare(b.createdAt);
}

export function groupTasksByDueDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();
  const sorted = [...tasks].sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return compareTasks(a, b);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    const byDate = parseDueAt(a.dueAt).getTime() - parseDueAt(b.dueAt).getTime();
    if (byDate !== 0) return byDate;
    return compareTasks(a, b);
  });

  for (const task of sorted) {
    const key = task.dueAt ? toDateKey(parseDueAt(task.dueAt)) : "inbox";
    const list = groups.get(key);
    if (list) list.push(task);
    else groups.set(key, [task]);
  }
  return groups;
}

export function tasksOnDate(tasks: Task[], dateKey: string): Task[] {
  return tasks
    .filter((task) => {
      if (!task.dueAt) return false;
      const start = task.startAt
        ? toDateKey(parseDueAt(task.startAt))
        : toDateKey(parseDueAt(task.dueAt));
      const end = toDateKey(parseDueAt(task.dueAt));
      return dateKey >= start && dateKey <= end;
    })
    .sort(compareTasks);
}

export function nextSortOrder(tasks: Task[]): number {
  return tasks.reduce((max, task) => Math.max(max, task.sortOrder), 0) + 1;
}

export function buildTask(input: CreateTaskInput, now: Date, id: string): Task {
  const timestamp = now.toISOString();
  return {
    id,
    title: input.title.trim(),
    description: input.description ?? null,
    status: input.status ?? "todo",
    priority: input.priority ?? "none",
    startAt: input.startAt ?? null,
    dueAt: input.dueAt ?? null,
    isAllDay: input.isAllDay ?? true,
    completedAt: input.status === "completed" ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    userId: LOCAL_USER_ID,
    sortOrder: input.sortOrder ?? 0,
  };
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  none: "无",
  low: "低",
  medium: "中",
  high: "高",
};

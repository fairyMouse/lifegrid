import { exclusiveEndKey, parseDueAt, toDateKey } from "@lifegrid/domain";
import { PRIORITY_COLOR } from "@lifegrid/ui";
import type { Task } from "@lifegrid/types";
import type { EventApi, EventInput } from "@fullcalendar/core";

export function taskToEvent(task: Task): EventInput | null {
  if (!task.dueAt) return null;

  const start = task.startAt
    ? toDateKey(parseDueAt(task.startAt))
    : toDateKey(parseDueAt(task.dueAt));
  const end =
    task.startAt && task.dueAt && task.startAt !== task.dueAt
      ? exclusiveEndKey(task.dueAt)
      : undefined;

  return {
    id: task.id,
    title: task.title,
    start,
    end,
    allDay: task.isAllDay,
    backgroundColor: PRIORITY_COLOR[task.priority] ?? PRIORITY_COLOR.none,
    borderColor: "transparent",
    textColor: "#ffffff",
    classNames: [
      "lg-task",
      task.status === "completed" ? "lg-task-done" : "",
    ],
    extendedProps: { task },
  };
}

export function tasksToEvents(tasks: Task[]): EventInput[] {
  return tasks
    .map(taskToEvent)
    .filter((event): event is EventInput => event !== null);
}

export function compareCalendarEvents(a: unknown, b: unknown): number {
  const left = (a as EventApi).extendedProps.task as Task | undefined;
  const right = (b as EventApi).extendedProps.task as Task | undefined;
  if (!left || !right) return 0;
  const created = Date.parse(right.createdAt) - Date.parse(left.createdAt);
  if (created !== 0) return created;
  return left.sortOrder - right.sortOrder;
}

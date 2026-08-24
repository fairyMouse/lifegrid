import { exclusiveEndKey, parseDueAt, toDateKey } from "@lifegrid/domain";
import { PRIORITY_COLOR } from "@lifegrid/ui";
import type { Task } from "@lifegrid/types";
import type { EventInput } from "@fullcalendar/core";

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

import type { Task, UpdateTaskInput } from "@lifegrid/types";
import { loadTasks, replaceTask } from "./store";

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  const current = loadTasks().find((task) => task.id === id);
  if (!current) throw new Error("Task not found");

  const next: Task = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    userId: current.userId,
    updatedAt: new Date().toISOString(),
  };
  return replaceTask(next);
}

import type { Task } from "@lifegrid/types";
import { updateTask } from "./updateTask";

export async function completeTask(
  id: string,
  completed = true,
): Promise<Task> {
  return updateTask(id, {
    status: completed ? "completed" : "todo",
    completedAt: completed ? new Date().toISOString() : null,
  });
}

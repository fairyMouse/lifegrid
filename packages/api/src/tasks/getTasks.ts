import { loadTasks } from "./store";
import type { Task } from "@lifegrid/types";

export async function getTasks(): Promise<Task[]> {
  return loadTasks();
}

export async function getTask(id: string): Promise<Task | null> {
  return loadTasks().find((task) => task.id === id) ?? null;
}

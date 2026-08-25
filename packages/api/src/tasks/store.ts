import type { Task } from "@lifegrid/types";
import { SEED_TASKS } from "./seed";

const STORAGE_KEY = "lifegrid.tasks.v4";

let memory: Task[] | null = null;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeTask(task: Task): Task {
  return {
    ...task,
    title: typeof task.title === "string" ? task.title : "",
  };
}

function clone(tasks: Task[]): Task[] {
  return tasks.map((task) => normalizeTask(task));
}

export function loadTasks(): Task[] {
  if (memory) return clone(memory);

  if (canUseStorage()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        memory = JSON.parse(raw) as Task[];
        return clone(memory);
      } catch {
        memory = clone(SEED_TASKS);
        persist(memory);
        return clone(memory);
      }
    }
    memory = clone(SEED_TASKS);
    persist(memory);
    return clone(memory);
  }

  return clone(SEED_TASKS);
}

function persist(tasks: Task[]): void {
  memory = clone(tasks);
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }
}

export function saveTasks(tasks: Task[]): Task[] {
  persist(tasks);
  return clone(tasks);
}

export function replaceTask(next: Task): Task {
  const tasks = loadTasks();
  const index = tasks.findIndex((task) => task.id === next.id);
  if (index === -1) {
    tasks.push(next);
  } else {
    tasks[index] = next;
  }
  saveTasks(tasks);
  return { ...next };
}

export function removeTask(id: string): void {
  saveTasks(loadTasks().filter((task) => task.id !== id));
}

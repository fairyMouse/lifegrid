export type TaskStatus = "todo" | "completed";
export type TaskPriority = "none" | "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startAt?: string | null;
  dueAt?: string | null;
  isAllDay: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  sortOrder: number;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  startAt?: string | null;
  isAllDay?: boolean;
  priority?: TaskPriority;
  status?: TaskStatus;
  sortOrder?: number;
};

export type UpdateTaskInput = Partial<
  Omit<Task, "id" | "createdAt" | "userId">
>;

import { buildTask, nextSortOrder, validateTaskTitle } from "@lifegrid/domain";
import type { CreateTaskInput, Task } from "@lifegrid/types";
import { loadTasks, replaceTask } from "./store";

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const error = validateTaskTitle(input.title);
  if (error) throw new Error(error);

  const tasks = loadTasks();
  const task = buildTask(
    {
      ...input,
      sortOrder: input.sortOrder ?? nextSortOrder(tasks),
    },
    new Date(),
    crypto.randomUUID(),
  );
  return replaceTask(task);
}

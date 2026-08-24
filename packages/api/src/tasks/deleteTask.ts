import { removeTask } from "./store";

export async function deleteTask(id: string): Promise<void> {
  removeTask(id);
}

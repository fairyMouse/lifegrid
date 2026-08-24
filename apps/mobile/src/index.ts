import type { Task } from "@lifegrid/types";
import { LOCAL_USER_ID } from "@lifegrid/domain";

/**
 * Expo app skeleton. Future screens (Today / Tasks / Calendar) should call
 * @lifegrid/api instead of talking to Supabase from UI components.
 */
export const MOBILE_READY_PACKAGES = [
  "@lifegrid/types",
  "@lifegrid/domain",
  "@lifegrid/api",
] as const;

export function emptyTaskList(): Task[] {
  return [];
}

export const userId = LOCAL_USER_ID;

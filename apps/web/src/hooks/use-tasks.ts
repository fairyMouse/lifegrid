"use client";

import {
  completeTask,
  createTask,
  deleteTask,
  getTasks,
  omitUndefined,
  updateTask,
} from "@lifegrid/api";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@lifegrid/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playCompleteSound } from "@/lib/sounds";

const KEY = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: KEY,
    queryFn: getTasks,
  });
}

export function useTaskMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(KEY, (current) => {
        if (!current) return [task];
        if (current.some((item) => item.id === task.id)) return current;
        return [...current, task];
      });
      void invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateTaskInput }) =>
      updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Task[]>(KEY);
      queryClient.setQueryData<Task[]>(KEY, (current) =>
        current?.map((task) =>
          task.id === id
            ? { ...task, ...omitUndefined(patch), updatedAt: new Date().toISOString() }
            : task,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: invalidate,
  });

  const complete = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      completeTask(id, completed),
    onMutate: async ({ id, completed }) => {
      if (completed) playCompleteSound();
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Task[]>(KEY);
      queryClient.setQueryData<Task[]>(KEY, (current) =>
        current?.map((task) =>
          task.id === id
            ? {
                ...task,
                status: completed ? "completed" : "todo",
                completedAt: completed ? new Date().toISOString() : null,
              }
            : task,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Task[]>(KEY);
      queryClient.setQueryData<Task[]>(KEY, (current) =>
        current?.filter((task) => task.id !== id),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: invalidate,
  });

  return { create, update, complete, remove };
}

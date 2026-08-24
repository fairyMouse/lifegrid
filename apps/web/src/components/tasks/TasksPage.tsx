"use client";

import {
  formatDayHeading,
  groupTasksByDueDate,
  todayKey,
} from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskEditor } from "@/components/task/TaskEditor";
import { TaskRow } from "@/components/task/TaskRow";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";

export function TasksPage() {
  const { data: tasks = [] } = useTasks();
  const mutations = useTaskMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = tasks.find((task) => task.id === selectedId) ?? null;

  const open = useMemo(
    () => groupTasksByDueDate(tasks.filter((task) => task.status === "todo")),
    [tasks],
  );
  const done = useMemo(
    () =>
      tasks
        .filter((task) => task.status === "completed")
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")),
    [tasks],
  );

  function toggle(task: Task) {
    void mutations.complete.mutate({
      id: task.id,
      completed: task.status !== "completed",
    });
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 items-center justify-between px-6">
        <h1 className="text-[15px] font-medium">任务</h1>
        <Button variant="ghost" size="icon" onClick={() => setCreating(true)}>
          <Plus size={16} />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-auto px-6 pb-10">
        <h2 className="mb-2 text-[12px] text-white/40">未完成</h2>
        {[...open.entries()].map(([dateKey, list]) => (
          <section key={dateKey} className="mb-5">
            <h3 className="mb-1 text-[13px] text-white/70">
              {formatDayHeading(dateKey)}
            </h3>
            {list.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onOpen={(item) => setSelectedId(item.id)}
                onToggle={toggle}
              />
            ))}
          </section>
        ))}

        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-2 text-[12px] text-white/40">已完成</h2>
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onOpen={(item) => setSelectedId(item.id)}
                onToggle={toggle}
              />
            ))}
          </section>
        ) : null}
      </div>

      {selected || creating ? (
        <TaskEditor
          key={selected?.id ?? "new-task"}
          task={selected}
          createDueAt={todayKey()}
          onClose={() => {
            setSelectedId(null);
            setCreating(false);
          }}
          onCreate={async (input) => {
            const task = await mutations.create.mutateAsync({
              ...input,
              description: input.description || null,
              isAllDay: true,
            });
            setSelectedId(task.id);
            setCreating(false);
            return task;
          }}
          onUpdate={(id, patch) => mutations.update.mutateAsync({ id, patch })}
          onComplete={(id, completed) =>
            mutations.complete.mutateAsync({ id, completed })
          }
          onDelete={(id) => mutations.remove.mutateAsync(id)}
        />
      ) : null}
    </div>
  );
}

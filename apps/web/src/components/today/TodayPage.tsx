"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { tasksOnDate, todayKey } from "@lifegrid/domain";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskEditor } from "@/components/task/TaskEditor";
import { TaskRow } from "@/components/task/TaskRow";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";

export function TodayPage() {
  const { data: tasks = [] } = useTasks();
  const mutations = useTaskMutations();
  const dateKey = todayKey();
  const todays = tasksOnDate(tasks, dateKey);
  const open = todays.filter((task) => task.status === "todo");
  const done = todays.filter((task) => task.status === "completed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const selected = tasks.find((task) => task.id === selectedId) ?? null;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 items-center justify-between px-6">
        <h1 className="text-[15px] font-medium">
          今天 · {format(new Date(), "M月d日", { locale: zhCN })}
        </h1>
        <Button variant="ghost" size="icon" onClick={() => setCreating(true)}>
          <Plus size={16} />
        </Button>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 overflow-auto px-6 pb-10">
        {open.length === 0 && done.length === 0 ? (
          <p className="pt-10 text-sm text-white/40">今天还没有任务</p>
        ) : null}
        <div className="space-y-0.5">
          {open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={(item) => setSelectedId(item.id)}
              onToggle={(item) =>
                void mutations.complete.mutate({
                  id: item.id,
                  completed: item.status !== "completed",
                })
              }
            />
          ))}
        </div>
        {done.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-2 text-[12px] text-white/40">已完成</h2>
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onOpen={(item) => setSelectedId(item.id)}
                onToggle={(item) =>
                  void mutations.complete.mutate({
                    id: item.id,
                    completed: false,
                  })
                }
              />
            ))}
          </section>
        ) : null}
      </div>

      {selected || creating ? (
        <TaskEditor
          key={selected?.id ?? "new-today"}
          task={selected}
          createDueAt={dateKey}
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

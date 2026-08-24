"use client";

import { formatMonthTitle, todayKey } from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import { useRef, useState, useSyncExternalStore } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import {
  MonthCalendar,
  type MonthCalendarHandle,
} from "./MonthCalendar";
import { TaskQuickCreate } from "./TaskQuickCreate";
import { TaskEditor } from "@/components/task/TaskEditor";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";

type QuickCreate = {
  dateKey: string;
  top: number;
  left: number;
  width: number;
};

export function CalendarPage() {
  const { data: tasks = [] } = useTasks();
  const mutations = useTaskMutations();
  const calendarRef = useRef<MonthCalendarHandle>(null);
  const [month, setMonth] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayKey());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [quickCreate, setQuickCreate] = useState<QuickCreate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const showEditor = Boolean(selectedTask || creating);

  function showError(message: string) {
    setError(message);
    window.setTimeout(() => setError(null), 2400);
  }

  function closeEditor() {
    setSelectedTaskId(null);
    setCreating(false);
  }

  async function handleCreate(input: {
    title: string;
    description: string;
    dueAt: string | null;
    priority: Task["priority"];
  }) {
    const task = await mutations.create.mutateAsync({
      title: input.title,
      description: input.description || null,
      dueAt: input.dueAt,
      priority: input.priority,
      isAllDay: true,
    });
    setSelectedTaskId(task.id);
    setCreating(false);
    return task;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <CalendarToolbar
        title={formatMonthTitle(month)}
        view={view}
        onViewChange={setView}
        onPrev={() => calendarRef.current?.prev()}
        onNext={() => calendarRef.current?.next()}
        onToday={() => calendarRef.current?.today()}
        onCreate={() => {
          setQuickCreate(null);
          setSelectedTaskId(null);
          setCreating(true);
        }}
      />

      <div className="min-h-0 flex-1">
        {mounted ? (
        <MonthCalendar
          ref={calendarRef}
          tasks={tasks}
          selectedDateKey={selectedDateKey}
          onMonthChange={setMonth}
          onSelectDate={(dateKey, dayEl) => {
            setSelectedDateKey(dateKey);
            setSelectedTaskId(null);
            setCreating(false);
            const rect = dayEl.getBoundingClientRect();
            setQuickCreate({
              dateKey,
              top: rect.bottom - 32,
              left: rect.left + 4,
              width: Math.max(rect.width - 8, 120),
            });
          }}
          onSelectTask={(task) => {
            setQuickCreate(null);
            setCreating(false);
            setSelectedTaskId(task.id);
            if (task.dueAt) setSelectedDateKey(task.dueAt.slice(0, 10));
          }}
          onMoveTask={async (id, startAt, dueAt) => {
            await mutations.update.mutateAsync({
              id,
              patch: { startAt, dueAt },
            });
          }}
          onMoveError={showError}
        />
        ) : null}
      </div>

      {quickCreate ? (
        <TaskQuickCreate
          dateKey={quickCreate.dateKey}
          top={quickCreate.top}
          left={quickCreate.left}
          width={quickCreate.width}
          onCancel={() => setQuickCreate(null)}
          onSubmit={(title) => {
            void mutations.create
              .mutateAsync({
                title,
                dueAt: quickCreate.dateKey,
                isAllDay: true,
              })
              .catch(() => showError("创建任务失败"));
            setQuickCreate(null);
          }}
        />
      ) : null}

      {showEditor ? (
        <TaskEditor
          key={selectedTask?.id ?? `new-${selectedDateKey ?? "today"}`}
          task={selectedTask}
          createDueAt={selectedDateKey ?? todayKey()}
          onClose={closeEditor}
          onCreate={handleCreate}
          onUpdate={(id, patch) => mutations.update.mutateAsync({ id, patch })}
          onComplete={(id, completed) =>
            mutations.complete.mutateAsync({ id, completed })
          }
          onDelete={(id) => mutations.remove.mutateAsync(id)}
        />
      ) : null}

      {error ? (
        <div className="absolute left-1/2 top-14 z-50 -translate-x-1/2 rounded-md bg-red-500/90 px-3 py-1.5 text-sm text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}

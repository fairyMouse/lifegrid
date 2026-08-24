"use client";

import { formatMonthTitle, formatWeekTitle, todayKey } from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import {
  MonthCalendar,
  type MonthCalendarHandle,
} from "./MonthCalendar";
import { TaskCreatePopover } from "./TaskCreatePopover";
import { TaskEditor } from "@/components/task/TaskEditor";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";
import { calendarViewFromParam, type CalendarView } from "./types";

type CreateState = {
  dateKey: string;
  anchor: DOMRect;
};

export function CalendarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: tasks = [] } = useTasks();
  const mutations = useTaskMutations();
  const calendarRef = useRef<MonthCalendarHandle>(null);
  const [rangeStart, setRangeStart] = useState(new Date());
  const [rangeEnd, setRangeEnd] = useState(new Date());
  const [view, setView] = useState<CalendarView>(() =>
    calendarViewFromParam(searchParams.get("view")),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(todayKey());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [create, setCreate] = useState<CreateState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const urlView = calendarViewFromParam(searchParams.get("view"));

  useEffect(() => {
    setView(urlView);
  }, [urlView]);

  function showError(message: string) {
    setError(message);
    window.setTimeout(() => setError(null), 2400);
  }

  function changeView(next: CalendarView) {
    setView(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "week") params.set("view", "week");
    else params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openCreate(dateKey: string, anchor: DOMRect) {
    setSelectedDateKey(dateKey);
    setSelectedTaskId(null);
    setCreate({ dateKey, anchor });
  }

  function submitCreate(title: string, priority: Task["priority"]) {
    const dateKey = create?.dateKey ?? selectedDateKey ?? todayKey();
    setCreate(null);
    void mutations.create
      .mutateAsync({
        title,
        dueAt: dateKey,
        isAllDay: true,
        priority,
      })
      .then((task) => {
        setSelectedDateKey(dateKey);
        setSelectedTaskId(task.id);
      })
      .catch(() => showError("创建任务失败"));
  }

  async function handleCreate(input: {
    title: string;
    description: string;
    dueAt: string | null;
    priority: Task["priority"];
  }) {
    return mutations.create.mutateAsync({
      title: input.title,
      description: input.description || null,
      dueAt: input.dueAt,
      priority: input.priority,
      isAllDay: true,
    });
  }

  const title =
    view === "week"
      ? formatWeekTitle(rangeStart, rangeEnd)
      : formatMonthTitle(rangeStart);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <CalendarToolbar
        title={title}
        view={view}
        onViewChange={changeView}
        onPrev={() => calendarRef.current?.prev()}
        onNext={() => calendarRef.current?.next()}
        onToday={() => calendarRef.current?.today()}
        onCreate={(anchor) => openCreate(selectedDateKey ?? todayKey(), anchor)}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mounted ? (
          <MonthCalendar
            ref={calendarRef}
            tasks={tasks}
            view={view}
            selectedDateKey={selectedDateKey}
            onRangeChange={(start, end) => {
              setRangeStart(start);
              setRangeEnd(end);
            }}
            onVisibleMonth={(date) => setRangeStart(date)}
            onUserScroll={() => setCreate(null)}
            onSelectDate={(dateKey, dayEl) => {
              openCreate(dateKey, dayEl.getBoundingClientRect());
            }}
            onSelectTask={(task) => {
              setCreate(null);
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

      {create ? (
        <TaskCreatePopover
          key={`${create.dateKey}-${Math.round(create.anchor.top)}-${Math.round(create.anchor.left)}`}
          dateKey={create.dateKey}
          anchor={create.anchor}
          onCancel={() => setCreate(null)}
          onSubmit={submitCreate}
        />
      ) : null}

      {selectedTask ? (
        <TaskEditor
          key={selectedTask.id}
          task={selectedTask}
          createDueAt={selectedTask.dueAt ?? todayKey()}
          onClose={() => setSelectedTaskId(null)}
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

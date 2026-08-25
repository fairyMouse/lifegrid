"use client";

import { addDays } from "date-fns";
import {
  addCalendarDays,
  formatMonthTitle,
  formatWeekTitle,
  parseDueAt,
  todayKey,
} from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import { MonthCalendar } from "./MonthCalendar";
import { TaskContextMenu } from "./TaskContextMenu";
import { TaskCreatePopover } from "./TaskCreatePopover";
import { TaskEditor } from "@/components/task/TaskEditor";
import { useTaskMutations, useTasks } from "@/hooks/use-tasks";
import {
  calendarDateFromParam,
  calendarViewFromParam,
  shiftMonthKey,
  weekStartSunday,
  type CalendarHistory,
  type CalendarView,
} from "./types";

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
  const view = calendarViewFromParam(searchParams.get("view"));
  const dateKey = calendarDateFromParam(searchParams.get("date"));
  const locRef = useRef({ view, dateKey });
  locRef.current = { view, dateKey };

  const [rangeStart, setRangeStart] = useState(() =>
    view === "week" ? weekStartSunday(dateKey) : parseDueAt(dateKey),
  );
  const [rangeEnd, setRangeEnd] = useState(() =>
    addDays(weekStartSunday(dateKey), 7),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(dateKey);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [create, setCreate] = useState<CreateState | null>(null);
  const skipDateClick = useRef(false);
  const [contextMenu, setContextMenu] = useState<{
    taskId: string;
    x: number;
    y: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

  function writeUrl(nextView: CalendarView, nextDate: string, history: CalendarHistory) {
    if (
      searchParams.get("view") === nextView &&
      searchParams.get("date") === nextDate
    ) {
      return;
    }
    locRef.current = { view: nextView, dateKey: nextDate };
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    params.set("date", nextDate);
    const url = `${pathname}?${params.toString()}`;
    if (history === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  useEffect(() => {
    const viewParam = searchParams.get("view");
    const dateParam = searchParams.get("date");
    const nextView = calendarViewFromParam(viewParam);
    const nextDate = calendarDateFromParam(dateParam);
    if (
      (viewParam === "month" || viewParam === "week") &&
      dateParam === nextDate
    ) {
      return;
    }
    writeUrl(nextView, nextDate, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- normalize missing query once per param change
  }, [searchParams, pathname]);

  useEffect(() => {
    setSelectedDateKey(dateKey);
    if (view === "week") {
      const start = weekStartSunday(dateKey);
      setRangeStart(start);
      setRangeEnd(addDays(start, 7));
      return;
    }
    setRangeStart(parseDueAt(dateKey));
  }, [dateKey, view]);

  function showError(message: string) {
    setError(message);
    window.setTimeout(() => setError(null), 2400);
  }

  function changeView(next: CalendarView) {
    const focus =
      selectedDateKey && isPlausibleDate(selectedDateKey)
        ? selectedDateKey
        : locRef.current.dateKey;
    writeUrl(next, focus || todayKey(), "push");
  }

  function openCreate(nextDate: string, anchor: DOMRect) {
    setSelectedDateKey(nextDate);
    setSelectedTaskId(null);
    setCreate({ dateKey: nextDate, anchor });
    writeUrl(locRef.current.view, nextDate, "replace");
  }

  function submitCreate(title: string, priority: Task["priority"]) {
    const due = create?.dateKey ?? selectedDateKey ?? dateKey;
    setCreate(null);
    void mutations.create
      .mutateAsync({
        title,
        dueAt: due,
        isAllDay: true,
        priority,
      })
      .then((task) => {
        setSelectedDateKey(due);
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
        onPrev={() =>
          writeUrl(
            view,
            view === "week" ? addCalendarDays(dateKey, -7) : shiftMonthKey(dateKey, -1),
            "push",
          )
        }
        onNext={() =>
          writeUrl(
            view,
            view === "week" ? addCalendarDays(dateKey, 7) : shiftMonthKey(dateKey, 1),
            "push",
          )
        }
        onToday={() => writeUrl(view, todayKey(), "push")}
        onCreate={(anchor) => openCreate(selectedDateKey || dateKey, anchor)}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mounted ? (
          <MonthCalendar
            tasks={tasks}
            view={view}
            focusDateKey={dateKey}
            selectedDateKey={selectedDateKey}
            onRangeChange={(start, end) => {
              setRangeStart(start);
              setRangeEnd(end);
            }}
            onVisibleMonth={(date) => setRangeStart(date)}
            onFocusDate={(nextDate, history) =>
              writeUrl(locRef.current.view, nextDate, history)
            }
            onUserScroll={() => setCreate(null)}
            onSelectDate={(nextDate, dayEl) => {
              if (skipDateClick.current) {
                skipDateClick.current = false;
                return;
              }
              openCreate(nextDate, dayEl.getBoundingClientRect());
            }}
            onSelectTask={(task) => {
              setCreate(null);
              setContextMenu(null);
              setSelectedTaskId(task.id);
              if (task.dueAt) {
                const due = task.dueAt.slice(0, 10);
                setSelectedDateKey(due);
                writeUrl(locRef.current.view, due, "replace");
              }
            }}
            onTaskContext={(task, point) => {
              setCreate(null);
              setSelectedTaskId(null);
              setContextMenu({ taskId: task.id, x: point.x, y: point.y });
            }}
            onToggleComplete={(id, completed) => {
              mutations.complete.mutate({ id, completed });
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

      {contextMenu ? (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => {
            const id = contextMenu.taskId;
            setContextMenu(null);
            setSelectedTaskId((current) => (current === id ? null : current));
            mutations.remove.mutate(id, {
              onError: () => showError("删除任务失败"),
            });
          }}
        />
      ) : null}

      {create ? (
        <TaskCreatePopover
          key={`${create.dateKey}-${Math.round(create.anchor.top)}-${Math.round(create.anchor.left)}`}
          dateKey={create.dateKey}
          anchor={create.anchor}
          onCancel={() => setCreate(null)}
          onSubmit={submitCreate}
          onSuppressDateClick={() => {
            skipDateClick.current = true;
            window.setTimeout(() => {
              skipDateClick.current = false;
            }, 500);
          }}
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

function isPlausibleDate(value: string) {
  return calendarDateFromParam(value) === value;
}

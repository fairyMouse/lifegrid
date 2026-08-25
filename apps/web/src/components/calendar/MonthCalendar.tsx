"use client";

import { addDays, addMonths, differenceInCalendarDays, startOfMonth, subMonths } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import {
  addCalendarDays,
  formatMonthTitle,
  holidayLabel,
  parseDueAt,
  toDateKey,
  todayKey,
  weekNumberLabel,
} from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { compareCalendarEvents, tasksToEvents } from "@/lib/task-events";
import {
  dateInWeek,
  dateKeyInMonth,
  fcViewName,
  sameMonth,
  type CalendarHistory,
  type CalendarView,
} from "./types";
import { cn } from "@/lib/utils";
import "./calendar.css";

export type MonthCalendarHandle = {
  today: () => void;
  prev: () => void;
  next: () => void;
};

type VisibleSource = "init" | "nav" | "idle";

type Props = {
  tasks: Task[];
  view: CalendarView;
  focusDateKey: string;
  selectedDateKey: string | null;
  onRangeChange: (start: Date, end: Date) => void;
  onVisibleMonth: (date: Date, source: VisibleSource) => void;
  onFocusDate: (dateKey: string, history: CalendarHistory) => void;
  onSelectDate: (dateKey: string, dayEl: HTMLElement) => void;
  onSelectTask: (task: Task) => void;
  onTaskContext: (task: Task, point: { x: number; y: number }) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onMoveTask: (id: string, startAt: string | null, dueAt: string) => Promise<void>;
  onMoveError: (message: string) => void;
  onUserScroll?: () => void;
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const STREAM_BACK = 8;
const STREAM_MONTHS = 16;
const IDLE_MS = 720;
const WEEK_WHEEL = 90;

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function monthFromWeek(keys: string[]): Date | null {
  if (keys.length === 0) return null;
  const dates = keys.map(parseDueAt);
  return dates.find((date) => date.getDate() === 1) ?? dates[Math.min(3, dates.length - 1)] ?? null;
}

function readVisibleMonth(root: HTMLElement): Date | null {
  const header =
    root.querySelector(".fc-col-header") ??
    root.querySelector(".fc-scrollgrid-section-header");
  const headerH =
    header instanceof HTMLElement ? header.getBoundingClientRect().height : 34;
  const probe = root.getBoundingClientRect().top + headerH + 8;
  const rows = root.querySelectorAll<HTMLElement>(".fc-daygrid-body tr");
  for (const row of rows) {
    if (row.getBoundingClientRect().bottom <= probe) continue;
    const keys = [...row.querySelectorAll("[data-date]")]
      .map((el) => el.getAttribute("data-date"))
      .filter((value): value is string => Boolean(value));
    const month = monthFromWeek(keys);
    if (month) return month;
  }
  return null;
}

function eventInnerHtml(task: Task): { html: string } {
  const title = escapeHtml(task.title);
  const done = task.status === "completed";
  const label = done ? "取消完成" : "完成";
  return {
    html: `<div class="lg-cal-event${done ? " is-done" : ""}" data-task-id="${escapeHtml(task.id)}"><button type="button" class="lg-cal-check${done ? " is-on" : ""}" data-complete="1" data-task-id="${escapeHtml(task.id)}" aria-label="${label}" title="${label}"></button><span class="lg-cal-title">${title}</span></div>`,
  };
}

function dayHeaderHtml(date: Date, isWeek: boolean): { html: string } {
  const weekday = WEEKDAYS[date.getDay()] ?? "";
  if (!isWeek) return { html: weekday };
  const today = toDateKey(date) === todayKey() ? " is-today" : "";
  return {
    html: `<div class="lg-week-header"><span>${weekday}</span><span class="lg-day-num${today}">${date.getDate()}</span></div>`,
  };
}

function dayCellHtml(date: Date, isWeek: boolean): { html: string } {
  const dateKey = toDateKey(date);
  const holiday = holidayLabel(dateKey);
  const holidayHtml = holiday
    ? `<span class="lg-holiday">${escapeHtml(holiday)}</span>`
    : "";
  if (isWeek) return { html: holidayHtml || "<span></span>" };
  const week =
    date.getDay() === 0
      ? `<span class="lg-week">${escapeHtml(weekNumberLabel(date))}</span>`
      : "";
  const today = dateKey === todayKey() ? " is-today" : "";
  return {
    html: `<div class="lg-day-cell"><div class="lg-day-left">${week}<span class="lg-day-num${today}">${date.getDate()}</span></div>${holidayHtml}</div>`,
  };
}

export const MonthCalendar = forwardRef<MonthCalendarHandle, Props>(
  function MonthCalendar(
    {
      tasks,
      view,
      focusDateKey,
      selectedDateKey,
      onRangeChange,
      onVisibleMonth,
      onFocusDate,
      onSelectDate,
      onSelectTask,
      onTaskContext,
      onToggleComplete,
      onMoveTask,
      onMoveError,
      onUserScroll,
    },
    ref,
  ) {
    const calendarRef = useRef<FullCalendar>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef(view);
    const focusRef = useRef(focusDateKey);
    const visibleRef = useRef(parseDueAt(focusDateKey));
    const programmaticRef = useRef(false);
    const onVisibleMonthRef = useRef(onVisibleMonth);
    const onRangeChangeRef = useRef(onRangeChange);
    const onUserScrollRef = useRef(onUserScroll);
    const onFocusDateRef = useRef(onFocusDate);
    const onToggleCompleteRef = useRef(onToggleComplete);
    const onTaskContextRef = useRef(onTaskContext);
    const ignoreClickUntil = useRef(0);
    const tasksRef = useRef(tasks);
    const idleTimer = useRef(0);
    const didInit = useRef(false);
    const skipFocusEffect = useRef(true);
    const draggingRef = useRef(false);
    const prevViewRef = useRef(view);
    if (prevViewRef.current !== view) {
      prevViewRef.current = view;
      didInit.current = false;
      visibleRef.current = parseDueAt(focusDateKey);
    }
    const [hint, setHint] = useState<string | null>(null);
    const [hintOn, setHintOn] = useState(false);
    const events = useMemo(() => tasksToEvents(tasks), [tasks]);
    const streamStart = useMemo(
      () => startOfMonth(subMonths(new Date(), STREAM_BACK)),
      [],
    );
    const isWeek = view === "week";

    useEffect(() => {
      viewRef.current = view;
      focusRef.current = focusDateKey;
      tasksRef.current = tasks;
      onVisibleMonthRef.current = onVisibleMonth;
      onRangeChangeRef.current = onRangeChange;
      onUserScrollRef.current = onUserScroll;
      onFocusDateRef.current = onFocusDate;
      onToggleCompleteRef.current = onToggleComplete;
      onTaskContextRef.current = onTaskContext;
    }, [
      view,
      focusDateKey,
      tasks,
      onVisibleMonth,
      onRangeChange,
      onUserScroll,
      onFocusDate,
      onToggleComplete,
      onTaskContext,
    ]);

    function showHint(date: Date) {
      setHint(formatMonthTitle(date));
      setHintOn(true);
    }

    function hideHint() {
      setHintOn(false);
      window.setTimeout(() => setHint(null), 200);
    }

    function setDragging(on: boolean) {
      draggingRef.current = on;
      scrollRef.current?.classList.toggle("is-event-dragging", on);
      document.querySelectorAll<HTMLElement>(".fc-more-popover").forEach((node) => {
        node.style.pointerEvents = on ? "none" : "";
        node.style.opacity = on ? "0" : "";
      });
    }

    function scrollToDate(dateKey: string, behavior: ScrollBehavior) {
      const root = scrollRef.current;
      const cell = root?.querySelector(`[data-date="${dateKey}"]`);
      if (!root || !(cell instanceof HTMLElement)) return;

      programmaticRef.current = true;
      const header =
        root.querySelector(".fc-col-header") ??
        root.querySelector(".fc-scrollgrid-section-header");
      const headerH = header instanceof HTMLElement ? header.clientHeight : 34;
      const top =
        cell.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        headerH;

      root.scrollTo({ top: Math.max(0, top), behavior });

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        programmaticRef.current = false;
        const month = readVisibleMonth(root) ?? parseDueAt(dateKey);
        visibleRef.current = month;
        onVisibleMonthRef.current(month, didInit.current ? "nav" : "init");
        didInit.current = true;
      };

      if (behavior === "smooth") {
        const timer = window.setTimeout(finish, 700);
        root.addEventListener(
          "scrollend",
          () => {
            window.clearTimeout(timer);
            finish();
          },
          { once: true },
        );
      } else {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      }
    }

    function applyFocus(dateKey: string, behavior: ScrollBehavior) {
      if (viewRef.current === "week") {
        const api = calendarRef.current?.getApi();
        if (!api) return;
        if (dateInWeek(dateKey, api.view.currentStart, api.view.currentEnd)) return;
        api.gotoDate(parseDueAt(dateKey));
        visibleRef.current = parseDueAt(dateKey);
        return;
      }
      const target = parseDueAt(dateKey);
      if (didInit.current && sameMonth(visibleRef.current, target)) return;
      scrollToDate(dateKey, behavior);
    }

    useImperativeHandle(ref, () => ({
      today: () => applyFocus(todayKey(), "smooth"),
      prev: () => {
        if (viewRef.current === "week") applyFocus(addCalendarDays(focusRef.current, -7), "auto");
        else applyFocus(toDateKey(startOfMonth(addMonths(visibleRef.current, -1))), "smooth");
      },
      next: () => {
        if (viewRef.current === "week") applyFocus(addCalendarDays(focusRef.current, 7), "auto");
        else applyFocus(toDateKey(startOfMonth(addMonths(visibleRef.current, 1))), "smooth");
      },
    }));

    useEffect(() => {
      if (skipFocusEffect.current) {
        skipFocusEffect.current = false;
        return;
      }
      applyFocus(focusDateKey, view === "week" ? "auto" : "smooth");
      // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to URL/focus date
    }, [focusDateKey]);

    useEffect(() => {
      function fromComplete(event: Event): HTMLElement | null {
        const target = event.target as HTMLElement | null;
        return target?.closest<HTMLElement>("[data-complete]") ?? null;
      }

      function onDown(event: Event) {
        if (fromComplete(event)) {
          event.stopPropagation();
          return;
        }
        const target = event.target as HTMLElement | null;
        if (target?.closest(".fc-more-popover .fc-event")) setDragging(true);
      }

      function onClick(event: Event) {
        const btn = fromComplete(event);
        if (!btn) return;
        event.preventDefault();
        event.stopPropagation();
        const id = btn.getAttribute("data-task-id");
        const task = tasksRef.current.find((item) => item.id === id);
        if (!task) return;
        onToggleCompleteRef.current(task.id, task.status !== "completed");
      }

      function onContext(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        const chip = target?.closest<HTMLElement>(".fc-event");
        if (!chip) return;
        const inCal =
          Boolean(scrollRef.current?.contains(chip)) ||
          Boolean(chip.closest(".fc-more-popover"));
        if (!inCal) return;
        const id =
          chip.querySelector("[data-task-id]")?.getAttribute("data-task-id") ??
          chip.getAttribute("data-task-id");
        const task = tasksRef.current.find((item) => item.id === id);
        if (!task) return;
        event.preventDefault();
        event.stopPropagation();
        ignoreClickUntil.current = Date.now() + 400;
        onTaskContextRef.current(task, { x: event.clientX, y: event.clientY });
      }

      function onUp() {
        window.requestAnimationFrame(() => {
          if (draggingRef.current) setDragging(false);
        });
      }

      document.addEventListener("click", onClick, true);
      document.addEventListener("contextmenu", onContext, true);
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("mousedown", onDown, true);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("pointercancel", onUp);
      return () => {
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("contextmenu", onContext, true);
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("mousedown", onDown, true);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
    }, []);

    useEffect(() => {
      if (view !== "month") return;
      const scroller = scrollRef.current;
      if (!scroller) return;

      const onScroll = () => {
        const month = readVisibleMonth(scroller);
        if (!month) return;
        visibleRef.current = month;
        if (programmaticRef.current) return;
        onUserScrollRef.current?.();
        showHint(month);
        window.clearTimeout(idleTimer.current);
        idleTimer.current = window.setTimeout(() => {
          const latest = readVisibleMonth(scroller) ?? month;
          visibleRef.current = latest;
          hideHint();
          onVisibleMonthRef.current(latest, "idle");
          const nextDate = dateKeyInMonth(focusRef.current, latest);
          if (nextDate !== focusRef.current) {
            onFocusDateRef.current(nextDate, "replace");
          }
        }, IDLE_MS);
      };

      scroller.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        scroller.removeEventListener("scroll", onScroll);
        window.clearTimeout(idleTimer.current);
      };
    }, [view]);

    useEffect(() => {
      const root = scrollRef.current;
      if (!root || view !== "week") return;

      let acc = 0;
      let locked = false;
      let hideTimer = 0;

      function onWheel(event: WheelEvent) {
        if (event.ctrlKey) return;
        event.preventDefault();
        onUserScrollRef.current?.();
        acc += event.deltaY;
        const nextDate = addDays(visibleRef.current, acc >= 0 ? 7 : -7);
        showHint(nextDate);
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          hideHint();
          locked = false;
          acc = 0;
        }, IDLE_MS);

        if (locked) return;
        if (acc > WEEK_WHEEL) {
          const nextKey = addCalendarDays(focusRef.current, 7);
          calendarRef.current?.getApi().next();
          visibleRef.current = parseDueAt(nextKey);
          onFocusDateRef.current(nextKey, "replace");
          acc = 0;
          locked = true;
        } else if (acc < -WEEK_WHEEL) {
          const nextKey = addCalendarDays(focusRef.current, -7);
          calendarRef.current?.getApi().prev();
          visibleRef.current = parseDueAt(nextKey);
          onFocusDateRef.current(nextKey, "replace");
          acc = 0;
          locked = true;
        }
      }

      root.addEventListener("wheel", onWheel, { passive: false });
      return () => {
        root.removeEventListener("wheel", onWheel);
        window.clearTimeout(hideTimer);
      };
    }, [view]);

    async function handleDrop(info: EventDropArg) {
      const start = info.event.start;
      const task = info.event.extendedProps.task as Task | undefined;
      if (!start || !task?.dueAt) {
        info.revert();
        return;
      }

      const nextStart = toDateKey(start);
      try {
        if (task.startAt && task.dueAt && task.startAt !== task.dueAt) {
          const duration = differenceInCalendarDays(
            parseDueAt(task.dueAt),
            parseDueAt(task.startAt),
          );
          await onMoveTask(
            task.id,
            nextStart,
            toDateKey(addDays(parseDueAt(nextStart), duration)),
          );
        } else {
          await onMoveTask(task.id, null, nextStart);
        }
      } catch {
        info.revert();
        onMoveError("移动任务失败，已恢复原日期");
      }
    }

    return (
      <div className="relative h-full min-h-0">
        <div
          ref={scrollRef}
          className={cn(
            "lg-calendar h-full",
            isWeek ? "lg-calendar-week overflow-hidden" : "lg-calendar-stream",
          )}
        >
          <FullCalendar
            key={view}
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            views={{
              monthStream: {
                type: "dayGrid",
                duration: { months: STREAM_MONTHS },
              },
            }}
            initialView={fcViewName(view)}
            initialDate={isWeek ? parseDueAt(focusDateKey) : streamStart}
            locale={zhCnLocale}
            firstDay={0}
            headerToolbar={false}
            height={isWeek ? "100%" : "auto"}
            contentHeight={isWeek ? undefined : "auto"}
            fixedWeekCount={false}
            navLinks={false}
            dayMaxEvents={isWeek ? 16 : 4}
            displayEventTime={false}
            editable
            eventStartEditable
            eventDurationEditable={false}
            eventOrder={compareCalendarEvents}
            events={events}
            datesSet={(arg) => {
              if (arg.view.type === "dayGridWeek") {
                visibleRef.current = arg.view.currentStart;
                didInit.current = true;
                const start = arg.view.currentStart;
                const end = arg.view.currentEnd;
                queueMicrotask(() => onRangeChangeRef.current(start, end));
                return;
              }
              if (didInit.current) return;
              requestAnimationFrame(() =>
                scrollToDate(focusRef.current, "auto"),
              );
            }}
            dateClick={(arg: DateClickArg) =>
              onSelectDate(toDateKey(arg.date), arg.dayEl)
            }
            eventClick={(arg: EventClickArg) => {
              arg.jsEvent.preventDefault();
              if (arg.jsEvent.button !== 0) return;
              if (Date.now() < ignoreClickUntil.current) return;
              const target = arg.jsEvent.target as HTMLElement | null;
              if (target?.closest("[data-complete]")) return;
              const task = arg.event.extendedProps.task as Task | undefined;
              if (task) onSelectTask(task);
            }}
            eventDragStart={() => setDragging(true)}
            eventDragStop={() => setDragging(false)}
            eventDrop={handleDrop}
            dayHeaderContent={(arg) => dayHeaderHtml(arg.date, isWeek)}
            dayCellClassNames={(arg) =>
              selectedDateKey === toDateKey(arg.date) ? ["is-selected"] : []
            }
            dayCellContent={(arg) => dayCellHtml(arg.date, isWeek)}
            eventContent={(arg) => {
              const task = arg.event.extendedProps.task as Task | undefined;
              if (!task) return arg.event.title;
              return eventInnerHtml(task);
            }}
            moreLinkContent={(arg) => ({ html: `+${arg.num}` })}
          />
        </div>
        {hint ? (
          <div className={cn("lg-scroll-hint", hintOn && "is-on")}>{hint}</div>
        ) : null}
      </div>
    );
  },
);

"use client";

import { addDays, addMonths, differenceInCalendarDays, startOfMonth, subMonths } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import {
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
import { CalendarTask } from "./CalendarTask";
import { tasksToEvents } from "@/lib/task-events";
import { fcViewName, type CalendarView } from "./types";
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
  selectedDateKey: string | null;
  onRangeChange: (start: Date, end: Date) => void;
  onVisibleMonth: (date: Date, source: VisibleSource) => void;
  onSelectDate: (dateKey: string, dayEl: HTMLElement) => void;
  onSelectTask: (task: Task) => void;
  onMoveTask: (id: string, startAt: string | null, dueAt: string) => Promise<void>;
  onMoveError: (message: string) => void;
  onUserScroll?: () => void;
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const STREAM_BACK = 8;
const STREAM_MONTHS = 16;
const IDLE_MS = 720;
const WEEK_WHEEL = 90;

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

export const MonthCalendar = forwardRef<MonthCalendarHandle, Props>(
  function MonthCalendar(
    {
      tasks,
      view,
      selectedDateKey,
      onRangeChange,
      onVisibleMonth,
      onSelectDate,
      onSelectTask,
      onMoveTask,
      onMoveError,
      onUserScroll,
    },
    ref,
  ) {
    const calendarRef = useRef<FullCalendar>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef(view);
    const visibleRef = useRef(new Date());
    const programmaticRef = useRef(false);
    const onVisibleMonthRef = useRef(onVisibleMonth);
    const onUserScrollRef = useRef(onUserScroll);
    const idleTimer = useRef(0);
    const didInit = useRef(false);
    const initQueued = useRef(false);
    const [hint, setHint] = useState<string | null>(null);
    const [hintOn, setHintOn] = useState(false);
    const events = useMemo(() => tasksToEvents(tasks), [tasks]);
    const streamStart = useMemo(
      () => startOfMonth(subMonths(new Date(), STREAM_BACK)),
      [],
    );

    useEffect(() => {
      viewRef.current = view;
      onVisibleMonthRef.current = onVisibleMonth;
      onUserScrollRef.current = onUserScroll;
    }, [view, onVisibleMonth, onUserScroll]);

    function showHint(date: Date) {
      setHint(formatMonthTitle(date));
      setHintOn(true);
    }

    function hideHint() {
      setHintOn(false);
      window.setTimeout(() => setHint(null), 200);
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

    useImperativeHandle(ref, () => ({
      today: () => {
        if (viewRef.current === "week") {
          calendarRef.current?.getApi().today();
          return;
        }
        scrollToDate(todayKey(), "smooth");
      },
      prev: () => {
        if (viewRef.current === "week") {
          calendarRef.current?.getApi().prev();
          return;
        }
        const date = startOfMonth(addMonths(visibleRef.current, -1));
        scrollToDate(toDateKey(date), "smooth");
      },
      next: () => {
        if (viewRef.current === "week") {
          calendarRef.current?.getApi().next();
          return;
        }
        const date = startOfMonth(addMonths(visibleRef.current, 1));
        scrollToDate(toDateKey(date), "smooth");
      },
    }));

    useEffect(() => {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      const next = fcViewName(view);
      if (api.view.type === next) return;
      if (next === "monthStream") {
        api.changeView(next, streamStart);
        requestAnimationFrame(() =>
          scrollToDate(toDateKey(startOfMonth(visibleRef.current)), "auto"),
        );
      } else {
        api.changeView(next, visibleRef.current);
      }
    }, [view, streamStart]);

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
          calendarRef.current?.getApi().next();
          visibleRef.current = nextDate;
          acc = 0;
          locked = true;
        } else if (acc < -WEEK_WHEEL) {
          calendarRef.current?.getApi().prev();
          visibleRef.current = nextDate;
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
            view === "week" ? "lg-calendar-week overflow-hidden" : "lg-calendar-stream",
          )}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            views={{
              monthStream: {
                type: "dayGrid",
                duration: { months: STREAM_MONTHS },
              },
            }}
            initialView={fcViewName(view)}
            initialDate={view === "month" ? streamStart : undefined}
            locale={zhCnLocale}
            firstDay={0}
            headerToolbar={false}
            height={view === "week" ? "100%" : "auto"}
            contentHeight={view === "week" ? undefined : "auto"}
            fixedWeekCount={false}
            navLinks={false}
            dayMaxEvents={view === "week" ? 16 : 4}
            displayEventTime={false}
            editable
            eventStartEditable
            eventDurationEditable={false}
            events={events}
            datesSet={(arg) => {
              if (arg.view.type === "dayGridWeek") {
                visibleRef.current = arg.view.currentStart;
                onRangeChange(arg.view.currentStart, arg.view.currentEnd);
                return;
              }
              if (initQueued.current) return;
              initQueued.current = true;
              requestAnimationFrame(() => scrollToDate(todayKey(), "auto"));
            }}
            dateClick={(arg: DateClickArg) =>
              onSelectDate(toDateKey(arg.date), arg.dayEl)
            }
            eventClick={(arg: EventClickArg) => {
              arg.jsEvent.preventDefault();
              const task = arg.event.extendedProps.task as Task | undefined;
              if (task) onSelectTask(task);
            }}
            eventDrop={handleDrop}
            dayHeaderContent={(arg) => {
              const weekday = WEEKDAYS[arg.date.getDay()] ?? "";
              if (view !== "week") return weekday;
              return (
                <div className="lg-week-header">
                  <span>{weekday}</span>
                  <span className={arg.isToday ? "lg-day-num is-today" : "lg-day-num"}>
                    {arg.date.getDate()}
                  </span>
                </div>
              );
            }}
            dayCellClassNames={(arg) =>
              selectedDateKey === toDateKey(arg.date) ? ["is-selected"] : []
            }
            dayCellContent={(arg) => {
              const dateKey = toDateKey(arg.date);
              const holiday = holidayLabel(dateKey);
              if (view === "week") {
                return holiday ? <span className="lg-holiday">{holiday}</span> : <span />;
              }
              return (
                <div className="lg-day-cell">
                  <div className="lg-day-left">
                    {arg.date.getDay() === 0 ? (
                      <span className="lg-week">{weekNumberLabel(arg.date)}</span>
                    ) : null}
                    <span className={arg.isToday ? "lg-day-num is-today" : "lg-day-num"}>
                      {arg.date.getDate()}
                    </span>
                  </div>
                  {holiday ? <span className="lg-holiday">{holiday}</span> : null}
                </div>
              );
            }}
            eventContent={(arg) => {
              const task = arg.event.extendedProps.task as Task | undefined;
              if (!task) return arg.event.title;
              return <CalendarTask task={task} />;
            }}
            moreLinkContent={(arg) => `+${arg.num}`}
          />
        </div>
        {hint ? (
          <div className={cn("lg-scroll-hint", hintOn && "is-on")}>{hint}</div>
        ) : null}
      </div>
    );
  },
);

"use client";

import { addDays, differenceInCalendarDays } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import {
  holidayLabel,
  parseDueAt,
  toDateKey,
  weekNumberLabel,
} from "@lifegrid/domain";
import type { Task } from "@lifegrid/types";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { CalendarTask } from "./CalendarTask";
import { tasksToEvents } from "@/lib/task-events";
import "./calendar.css";

export type MonthCalendarHandle = {
  today: () => void;
  prev: () => void;
  next: () => void;
};

type Props = {
  tasks: Task[];
  selectedDateKey: string | null;
  onMonthChange: (date: Date) => void;
  onSelectDate: (dateKey: string, dayEl: HTMLElement) => void;
  onSelectTask: (task: Task) => void;
  onMoveTask: (id: string, startAt: string | null, dueAt: string) => Promise<void>;
  onMoveError: (message: string) => void;
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export const MonthCalendar = forwardRef<MonthCalendarHandle, Props>(
  function MonthCalendar(
    {
      tasks,
      selectedDateKey,
      onMonthChange,
      onSelectDate,
      onSelectTask,
      onMoveTask,
      onMoveError,
    },
    ref,
  ) {
    const calendarRef = useRef<FullCalendar>(null);
    const events = useMemo(() => tasksToEvents(tasks), [tasks]);

    useImperativeHandle(ref, () => ({
      today: () => calendarRef.current?.getApi().today(),
      prev: () => calendarRef.current?.getApi().prev(),
      next: () => calendarRef.current?.getApi().next(),
    }));

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
      <div className="lg-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={zhCnLocale}
          firstDay={0}
          headerToolbar={false}
          height="100%"
          fixedWeekCount
          navLinks={false}
          dayMaxEvents={4}
          displayEventTime={false}
          editable
          eventStartEditable
          eventDurationEditable={false}
          events={events}
          datesSet={(arg) => onMonthChange(arg.view.currentStart)}
          dateClick={(arg: DateClickArg) =>
            onSelectDate(toDateKey(arg.date), arg.dayEl)
          }
          eventClick={(arg: EventClickArg) => {
            arg.jsEvent.preventDefault();
            const task = arg.event.extendedProps.task as Task | undefined;
            if (task) onSelectTask(task);
          }}
          eventDrop={handleDrop}
          dayHeaderContent={(arg) => WEEKDAYS[arg.date.getDay()] ?? ""}
          dayCellClassNames={(arg) =>
            selectedDateKey === toDateKey(arg.date) ? ["is-selected"] : []
          }
          dayCellContent={(arg) => {
            const dateKey = toDateKey(arg.date);
            const holiday = holidayLabel(dateKey);
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
    );
  },
);

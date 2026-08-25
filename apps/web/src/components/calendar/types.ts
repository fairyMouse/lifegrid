import { addDays, addMonths } from "date-fns";
import { parseDueAt, toDateKey, todayKey } from "@lifegrid/domain";

export type CalendarView = "month" | "week";
export type CalendarHistory = "push" | "replace";

export function fcViewName(view: CalendarView): "monthStream" | "dayGridWeek" {
  return view === "week" ? "dayGridWeek" : "monthStream";
}

export function calendarViewFromParam(value: string | null): CalendarView {
  return value === "week" ? "week" : "month";
}

export function calendarDateFromParam(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return todayKey();
  const date = parseDueAt(value);
  if (Number.isNaN(date.getTime()) || toDateKey(date) !== value) return todayKey();
  return value;
}

export function weekStartSunday(dateKey: string): Date {
  const date = parseDueAt(dateKey);
  return addDays(date, -date.getDay());
}

export function shiftMonthKey(dateKey: string, amount: number): string {
  return toDateKey(addMonths(parseDueAt(dateKey), amount));
}

export function dateKeyInMonth(dateKey: string, month: Date): string {
  const day = parseDueAt(dateKey).getDate();
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return toDateKey(new Date(month.getFullYear(), month.getMonth(), Math.min(day, last)));
}

export function sameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function dateInWeek(dateKey: string, weekStart: Date, weekEndExclusive: Date): boolean {
  const key = dateKey;
  return key >= toDateKey(weekStart) && key < toDateKey(weekEndExclusive);
}

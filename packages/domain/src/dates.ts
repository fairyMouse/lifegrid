import {
  addDays,
  differenceInCalendarDays,
  format,
  getISOWeek,
  startOfDay,
} from "date-fns";
import { zhCN } from "date-fns/locale";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDueAt(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function todayKey(now = new Date()): string {
  return toDateKey(now);
}

export function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

export function formatWeekTitle(start: Date, endExclusive: Date): string {
  const end = addDays(endExclusive, -1);
  const startText = `${start.getMonth() + 1}月${start.getDate()}日`;
  const endText = `${end.getMonth() + 1}月${end.getDate()}日`;
  if (start.getFullYear() !== end.getFullYear()) {
    return `${start.getFullYear()}年${startText} – ${end.getFullYear()}年${endText}`;
  }
  return `${start.getFullYear()}年 ${startText} – ${endText}`;
}

export function weekdayLabel(date: Date): string {
  return format(date, "EEE", { locale: zhCN });
}

export function weekNumberLabel(date: Date): string {
  return `${getISOWeek(date)}周`;
}

export function formatDayHeading(dateKey: string, now = new Date()): string {
  if (dateKey === "inbox") return "收集箱";
  const date = parseDueAt(dateKey);
  const diff = differenceInCalendarDays(date, startOfDay(now));
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  if (diff === -1) return "昨天";
  return format(date, "M月d日");
}

export function formatTaskDateLabel(dateKey: string, now = new Date()): string {
  const date = parseDueAt(dateKey);
  const diff = differenceInCalendarDays(date, startOfDay(now));
  const md = format(date, "M月d日");
  const weekday = format(date, "EEEE", { locale: zhCN }).replace("星期", "周");

  if (diff === 0) return `今天，${md}`;
  if (diff === 1) return `明天，${md}`;
  if (diff === -1) return `昨天，${md}`;
  if (diff >= 2 && diff < 7) return `${weekday}，${md}`;
  if (diff >= 7 && diff < 14) return `下${weekday}，${md}`;
  return `${weekday}，${md}`;
}

export function addCalendarDays(dateKey: string, amount: number): string {
  return toDateKey(addDays(parseDueAt(dateKey), amount));
}

export function exclusiveEndKey(dueAt: string): string {
  return addCalendarDays(dueAt, 1);
}

export type CalendarView = "month" | "week";

export function fcViewName(view: CalendarView): "monthStream" | "dayGridWeek" {
  return view === "week" ? "dayGridWeek" : "monthStream";
}

export function calendarViewFromParam(value: string | null): CalendarView {
  return value === "week" ? "week" : "month";
}

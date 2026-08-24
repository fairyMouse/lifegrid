export type CalendarView = "month" | "week";

export function fcViewName(view: CalendarView): "monthStream" | "dayGridWeek" {
  return view === "week" ? "dayGridWeek" : "monthStream";
}

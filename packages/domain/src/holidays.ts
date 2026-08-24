export const HOLIDAYS: Record<string, string> = {
  "2026-08-19": "七夕",
  "2026-08-27": "中元节",
  "2026-09-25": "中秋节",
  "2026-10-01": "国庆节",
};

export function holidayLabel(dateKey: string): string | undefined {
  return HOLIDAYS[dateKey];
}

import { useNavigate, useSearch } from "@tanstack/react-router";

import { todayInput } from "@/domain/formatters/format-date";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import type { TeachingRole } from "../../api/timekeeping-teaching-api";
import { MONTH_PATTERN } from "../domain/teaching-model";

export const TEACHING_HOURS_PATH = "/employees/teaching-hours";

export type TeachingSearch = {
  /** `total` or a `yyyy-MM` month: the tab at the bottom. */
  sheet: string;
  year: number;
  role: TeachingRole;
  schoolId?: string;
  teacherId?: string;
  /** Narrows Total to one month (set by clicking a teacher in a month sheet). */
  month?: string;
};

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

/** `?sheet=&year=&role=&schoolId=&teacherId=&month=` of «Công tiết dạy»; ids, months and years only. Updates replace the history entry. */
export function useTeachingSearch() {
  const raw = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const sheet = text(raw.sheet);
  const month = text(raw.month);
  const year = Number(raw.year);
  const search: TeachingSearch = {
    sheet: sheet && MONTH_PATTERN.test(sheet) ? sheet : "total",
    year: Number.isInteger(year) && year > 2000 && year < 2100 ? year : Number(todayInput().slice(0, 4)),
    role: raw.role === "ASSISTANT" ? "ASSISTANT" : "MAIN",
    schoolId: text(raw.schoolId),
    teacherId: text(raw.teacherId),
    month: month && MONTH_PATTERN.test(month) ? month : undefined,
  };
  const update = (patch: Partial<Record<keyof TeachingSearch, string | number | undefined>>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...search, ...patch })) {
      if (value === undefined || value === "" || (key === "role" && value === "MAIN")) continue;
      next.set(key, String(value));
    }
    void navigate({ href: adminPath(`${TEACHING_HOURS_PATH}?${next.toString()}`), replace: true });
  };
  return { search, update };
}

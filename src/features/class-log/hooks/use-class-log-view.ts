import { useCallback } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { currentWeekStart, mondayOf } from "../domain/class-log-week";

export type ClassLogTab = "teacher" | "class" | "log";

const isTab = (value: string | null): value is ClassLogTab => value === "teacher" || value === "class" || value === "log";
const isIsoDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

/** Tab, week and class live in the URL (`?tab=teacher|class|log&week=yyyy-MM-dd&classId=`) so a link opens the same view. */
export function useClassLogView(defaultClassId: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.searchStr);
  const tabParam = params.get("tab");
  const weekParam = params.get("week");

  const update = useCallback((patch: Record<string, string>) => {
    const next = new URLSearchParams(location.searchStr);
    Object.entries(patch).forEach(([key, value]) => next.set(key, value));
    void navigate({ href: `${location.pathname}?${next.toString()}` });
  }, [location.pathname, location.searchStr, navigate]);

  return {
    tab: isTab(tabParam) ? tabParam : "teacher",
    weekStart: isIsoDate(weekParam) ? mondayOf(weekParam) : currentWeekStart(),
    classId: params.get("classId") || defaultClassId,
    update,
  };
}

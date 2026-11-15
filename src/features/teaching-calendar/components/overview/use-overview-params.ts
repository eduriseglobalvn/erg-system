import { useNavigate, useLocation } from "@tanstack/react-router";
import { useCallback } from "react";

import { weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { todayInput } from "@/domain/formatters/format-date";
import { adminPath } from "@/platform/workspaces/workspace-paths";

export type OverviewTab = "schools" | "teachers";
export type OverviewParams = { q: string; quick: string; schools: string[]; sort: "LOAD_ASC" | "LOAD_DESC"; tab: OverviewTab; week: string };

/** Trang thai bang tong nam tren URL: `?tab=&week=&schools=a,b&q=&quick=&sort=`. Doi gia tri = replace, khong them lich su. */
export function useOverviewParams() {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().searchStr);
  const current: OverviewParams = {
    q: params.get("q") ?? "",
    quick: params.get("quick") ?? "",
    schools: (params.get("schools") ?? "").split(",").filter(Boolean),
    sort: params.get("sort") === "LOAD_ASC" ? "LOAD_ASC" : "LOAD_DESC",
    tab: params.get("tab") === "teachers" ? "teachers" : "schools",
    week: weekStartOf(params.get("week") ?? todayInput()),
  };
  const search = params.toString();
  const update = useCallback((patch: Partial<OverviewParams>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(patch)) {
      const text = Array.isArray(value) ? value.join(",") : String(value);
      if (!text) next.delete(key); else next.set(key, text);
    }
    if (patch.tab && patch.tab !== new URLSearchParams(search).get("tab")) { next.delete("q"); next.delete("quick"); }
    const query = next.toString();
    void navigate({ href: `${adminPath("/calendar/overview")}${query ? `?${query}` : ""}`, replace: true });
  }, [navigate, search]);
  return { ...current, update };
}

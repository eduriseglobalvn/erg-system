import { useNavigate } from "@tanstack/react-router";

import { teacherPath } from "@/platform/workspaces/workspace-paths";
import type { RequestFormType } from "./request-model";

/** Moves between the views of /timekeeping/requests; every view is a search-param state of the one route. */
export function useRequestsNav() {
  const navigate = useNavigate();
  const go = (query: string, replace = false) => void navigate({ href: teacherPath(`/timekeeping/requests${query}`), replace });
  return {
    toList: (replace = false) => go("", replace),
    toPicker: () => go("?new="),
    toForm: (type: RequestFormType, date?: string) => go(`?new=${type}${date ? `&date=${date}` : ""}`),
    toEdit: (id: string) => go(`?edit=${encodeURIComponent(id)}`),
    toDetail: (id: string, replace = false) => go(`?id=${encodeURIComponent(id)}`, replace),
  };
}

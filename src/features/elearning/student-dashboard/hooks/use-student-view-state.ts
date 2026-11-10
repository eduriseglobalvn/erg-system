import { useEffect, useState } from "react";
import type { StudentViewState } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

const ASSIGNMENT_PARAM = "assignment";

/** The open assignment lives in the URL (?assignment=), so a reload returns to the quiz instead of the dashboard. */
export function useStudentViewState() {
  const [viewState, setViewState] = useState<StudentViewState>(() => {
    const assignmentId = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(ASSIGNMENT_PARAM);
    return assignmentId ? { type: "quiz", assignmentId } : { type: "dashboard" };
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const assignmentId = viewState.type === "quiz" ? viewState.assignmentId : null;
    if (url.searchParams.get(ASSIGNMENT_PARAM) === assignmentId) return;
    if (assignmentId) url.searchParams.set(ASSIGNMENT_PARAM, assignmentId);
    else url.searchParams.delete(ASSIGNMENT_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }, [viewState]);

  return [viewState, setViewState] as const;
}

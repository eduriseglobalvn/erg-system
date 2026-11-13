import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  STUDENT_ASSIGNMENT_PAGE_SIZE,
  studentDashboardQueryKeys,
  studentDashboardQueryOptions,
  type StudentDashboardQueryScope,
} from "@/features/elearning/student-dashboard/api/student-dashboard-query";

/** The student dashboard with a growing assignment list: "Xem thêm" asks the backend for 50 more. */
export function useStudentDashboardQuery(scope: Omit<StudentDashboardQueryScope, "assignmentLimit">) {
  const [assignmentLimit, setAssignmentLimit] = useState(STUDENT_ASSIGNMENT_PAGE_SIZE);
  const query = useQuery({
    ...studentDashboardQueryOptions({ ...scope, assignmentLimit }),
    // Keep the shown list while the longer one loads, but never carry another account's or tenant's data over.
    placeholderData: (previous, previousQuery) => {
      const workspace = studentDashboardQueryKeys.workspace(scope);
      return previousQuery && workspace.every((part, index) => previousQuery.queryKey[index] === part) ? previous : undefined;
    },
  });
  const loadMoreAssignments = () => setAssignmentLimit((limit) => limit + STUDENT_ASSIGNMENT_PAGE_SIZE);
  return { loadMoreAssignments, query };
}

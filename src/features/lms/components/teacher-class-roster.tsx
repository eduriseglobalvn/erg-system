import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import type { ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import { lmsAssignmentReadQueryKeys, lmsReadPersistMeta } from "@/features/lms/api/lms-assignment-command-query";
import { hasApiBase } from "@/lib/api-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

/**
 * Real roster of the selected class. Shares the query key of the "Lớp học" page, so both
 * screens read one cache entry. A load failure is surfaced, never rendered as an empty class.
 */
export function TeacherClassRoster({
  children,
  selectedClass,
}: {
  children: (students: ClassroomStudent[]) => ReactNode;
  selectedClass?: ClassroomSnapshot;
}) {
  const classId = selectedClass?.id ?? "";
  const query = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
      classId,
      schoolId: selectedClass?.schoolId ?? "",
      usage: "class-students-workspace",
    }),
    queryFn: ({ signal }) =>
      loadLmsClassWorkspace({
        assignmentPage: 0,
        assignmentSize: 50,
        assignmentStatus: "active",
        classId,
        page: 0,
        schoolId: selectedClass?.schoolId,
        size: 50,
        studentStatus: "active",
      }, signal),
    enabled: hasApiBase() && Boolean(classId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    meta: lmsReadPersistMeta(),
    refetchOnWindowFocus: false,
  });

  if (query.isError) {
    return (
      <Stack sx={{ p: 2 }}>
        <ErgErrorState
          action={<Button variant="outlined" onClick={() => void query.refetch()}>Thử lại</Button>}
          description="Không tải được danh sách học sinh của lớp. Vui lòng thử lại."
          title="Không tải được danh sách học sinh"
        />
      </Stack>
    );
  }
  if (query.isLoading) {
    return (
      <Stack aria-label="Đang tải danh sách học sinh" role="status" spacing={1.5} sx={{ p: 2 }}>
        <ErgSkeleton height={72} />
        <ErgSkeleton height={240} />
      </Stack>
    );
  }
  return <>{children(query.data ? mapClassWorkspaceToStudents(query.data, selectedClass) : [])}</>;
}

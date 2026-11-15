import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { classLogQueryKeys } from "../api/class-log-query-keys";
import { loadLessonReportMatrix, remindLessonReport } from "./lesson-report-api";

export const useLessonReportMatrix = (weekStart: string, schoolId: string) =>
  useQuery({
    queryKey: [...classLogQueryKeys.all, "report-matrix", weekStart, schoolId] as const,
    queryFn: ({ signal }) => loadLessonReportMatrix({ weekStart, schoolId }, signal),
    staleTime: 15_000,
  });

export const remindResultText = (sent: number) =>
  sent > 0 ? `Đã nhắc ${sent} giáo viên.` : "Không có giáo viên nào cần nhắc thêm hôm nay.";

export function useRemindTeachers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teacherIds: string[]) => remindLessonReport(teacherIds),
    onSuccess: (sent) => {
      toast.success(remindResultText(sent));
      void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all });
    },
    onError: () => toast.error("Không gửi được lời nhắc. Thử lại."),
  });
}

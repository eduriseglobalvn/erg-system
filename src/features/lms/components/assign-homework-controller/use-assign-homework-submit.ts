import type { useCreateLmsAssignmentMutation } from "@/features/lms/api/lms-assignment-command-query";
import {
  buildAssignmentRecipientInput,
  createAssignmentIdempotencyKey,
  parseAssignDateTime,
} from "@/features/lms/components/assign-homework-recipient";

type RecipientInput = Parameters<typeof buildAssignmentRecipientInput>[0];

export function useAssignHomeworkSubmit(params: {
  title: string;
  selectedResourceIds: Set<string>;
  setValidationError: (message: string) => void;
  setIsSubmitting: (value: boolean) => void;
  assignmentClass?: { id: string };
  selectedAssignmentGroupIds: RecipientInput["selectedAssignmentGroupIds"];
  selectedGradeClassIds: RecipientInput["selectedGradeClassIds"];
  gradeStudentIdsByClass: RecipientInput["gradeStudentIdsByClass"];
  selectedGradeStudentIdsByClass: RecipientInput["selectedGradeStudentIdsByClass"];
  selectedGroupStudentIdsByGroup: RecipientInput["selectedGroupStudentIdsByGroup"];
  selectedStudentIds: RecipientInput["selectedStudentIds"];
  activeAssignmentGroups: RecipientInput["assignmentGroups"];
  targetType: RecipientInput["targetType"];
  apiBacked: boolean;
  createAssignmentMutation: ReturnType<typeof useCreateLmsAssignmentMutation>;
  attemptLimit: number;
  endDate: string;
  startDate: string;
  maxDurationMinutes: number;
  selectedSubject?: { label: string };
  subject: string;
  onCreateAssignment: (title: string, subject: string) => void;
}) {
  const {
    title,
    selectedResourceIds,
    setValidationError,
    setIsSubmitting,
    assignmentClass,
    selectedAssignmentGroupIds,
    selectedGradeClassIds,
    gradeStudentIdsByClass,
    selectedGradeStudentIdsByClass,
    selectedGroupStudentIdsByGroup,
    selectedStudentIds,
    activeAssignmentGroups,
    targetType,
    apiBacked,
    createAssignmentMutation,
    attemptLimit,
    endDate,
    startDate,
    maxDurationMinutes,
    selectedSubject,
    subject,
    onCreateAssignment,
  } = params;

  const handleFinish = async () => {
    if (!title.trim()) {
      setValidationError("Vui lòng nhập tên bài tập.");
      return;
    }
    if (selectedResourceIds.size === 0) {
      setValidationError("Vui lòng chọn ít nhất một bài tập.");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    try {
      const recipient = buildAssignmentRecipientInput({
        assignmentClassId: assignmentClass?.id,
        selectedAssignmentGroupIds,
        selectedGradeClassIds,
        gradeStudentIdsByClass,
        selectedGradeStudentIdsByClass,
        selectedGroupStudentIdsByGroup,
        selectedStudentIds,
        assignmentGroups: activeAssignmentGroups,
        targetType,
      });
      if (recipient.recipientMode === "students" && (recipient.studentIds?.length ?? 0) === 0) {
        setValidationError("Vui lòng chọn ít nhất một học sinh hoặc nhóm/lớp hợp lệ.");
        setIsSubmitting(false);
        return;
      }

      if (apiBacked) {
        try {
          const result = await createAssignmentMutation.mutateAsync({
            attemptLimit,
            dueAt: parseAssignDateTime(endDate),
            idempotencyKey: createAssignmentIdempotencyKey({
              dueAt: endDate,
              quizIds: Array.from(selectedResourceIds),
              startAt: startDate,
              title,
            }),
            maxDurationMinutes,
            quizIds: Array.from(selectedResourceIds),
            startAt: parseAssignDateTime(startDate),
            teacherNote: selectedSubject?.label ?? subject,
            title,
            ...recipient,
          });
          if (result && typeof result === "object" && "status" in result && result.status === "pending") {
            setValidationError("Bài giao đã được giữ ở trạng thái chờ đồng bộ; chưa được xác nhận trên máy chủ.");
            setIsSubmitting(false);
            return;
          }
        } catch (apiError) {
          console.error("LMS assignment create error:", apiError);
          setValidationError(
            apiError instanceof Error
              ? `Lỗi khi lưu trên máy chủ: ${apiError.message}`
              : "Máy chủ không thể lưu bài tập. Vui lòng kiểm tra lại kết nối.",
          );
          setIsSubmitting(false);
          return;
        }
      }
      setValidationError("");
      onCreateAssignment(title, selectedSubject?.label ?? subject);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Không thể giao bài. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return handleFinish;
}

import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import { StudentAttendanceContextMenu } from "@/features/lms/components/student-attendance-context-menu";
import { createAttendanceStudentDraft } from "./attendance-sheet-model";
import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

export function AttendanceSheetOverlays({ controller }: { controller: AttendanceSheetController }) {
  const selectedStudent = controller.selectedStudent;
  return (
    <>
      <StudentAttendanceContextMenu
        menu={controller.contextMenu}
        onClose={() => controller.setContextMenu(null)}
        onAddStudent={() => controller.showAction("Đã mở thao tác thêm học sinh mới")}
        onAddNote={(student) => controller.showAction(`Đã thêm note nhanh cho ${student.name}`)}
        onChangeStatus={(student) => {
          const statuses = ["ahead", "steady", "support"] as const;
          const draft = controller.studentDrafts[student.id] ?? createAttendanceStudentDraft(student);
          const current = draft.status as (typeof statuses)[number];
          const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
          controller.setStudentDrafts((drafts) => ({ ...drafts, [student.id]: { ...draft, status: next } }));
          controller.showAction(`Đã đổi trạng thái ${student.name}`);
        }}
        onOpenNote={controller.openStudentDetail}
      />

      {selectedStudent && (
        <StudentProfileDetailDrawer
          draft={controller.studentDrafts[selectedStudent.id] ?? createAttendanceStudentDraft(selectedStudent)}
          onClose={() => controller.setSelectedStudentId(null)}
          onUpdate={(patch) => controller.setStudentDrafts((current) => ({
            ...current,
            [selectedStudent.id]: {
              ...(current[selectedStudent.id] ?? createAttendanceStudentDraft(selectedStudent)),
              ...patch,
            },
          }))}
          onStatusChange={(status) => controller.setStudentDrafts((current) => ({
            ...current,
            [selectedStudent.id]: {
              ...(current[selectedStudent.id] ?? createAttendanceStudentDraft(selectedStudent)),
              status,
            },
          }))}
          statusOptions={[
            { label: "Vượt tiến độ", value: "ahead" },
            { label: "Ổn định", value: "steady" },
            { label: "Cần hỗ trợ", value: "support" },
          ]}
          statusValue={(controller.studentDrafts[selectedStudent.id] ?? createAttendanceStudentDraft(selectedStudent)).status}
          student={selectedStudent}
        />
      )}
    </>
  );
}

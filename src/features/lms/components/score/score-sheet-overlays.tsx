import Add from "@mui/icons-material/Add";
import Lock from "@mui/icons-material/Lock";
import { Button, Chip, Stack, Typography } from "@mui/material";
import type { CSSProperties } from "react";

import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import {
  createScoreStudentDraft,
  getClassificationChipSx,
  type StudentState,
} from "./score-sheet-model";
import type { PendingClassification, ScoreSheetController } from "./use-score-sheet-controller";

export function ScoreSheetOverlays({ controller }: { controller: ScoreSheetController }) {
  const selectedStudent = controller.selectedStudent;
  return (
    <>
      {controller.contextMenu && (
        <div
          style={{
            position: "fixed",
            top: controller.contextMenu.y,
            left: controller.contextMenu.x,
            zIndex: 100,
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: 180,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{controller.contextMenu.student.name}</div>
          </div>
          <button
            onClick={() => {
              controller.setNotice("Đã mở thêm HS chuyển lớp");
              controller.setContextMenu(null);
            }}
            style={menuItemStyle}
          >
            <Add style={{ fontSize: 18 }} />
            Thêm HS chuyển lớp
          </button>
          <button
            onClick={() => {
              if (controller.contextMenu) controller.disableStudent(controller.contextMenu.student);
              controller.setContextMenu(null);
            }}
            style={{ ...menuItemStyle, color: "#dc2626" }}
          >
            <Lock style={{ fontSize: 18 }} />
            Nghỉ học / khóa
          </button>
        </div>
      )}
      {controller.contextMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => controller.setContextMenu(null)} />
      )}

      {selectedStudent && (
        <StudentProfileDetailDrawer
          draft={controller.studentDrafts[selectedStudent.id] ?? createScoreStudentDraft(selectedStudent, controller.studentStates[selectedStudent.id] ?? "active")}
          onClose={() => controller.setSelectedStudentId(null)}
          onUpdate={(patch) => controller.setStudentDrafts((current) => ({
            ...current,
            [selectedStudent.id]: {
              ...(current[selectedStudent.id] ?? createScoreStudentDraft(selectedStudent, controller.studentStates[selectedStudent.id] ?? "active")),
              ...patch,
            },
          }))}
          onStatusChange={(state) => controller.setStudentDrafts((current) => ({
            ...current,
            [selectedStudent.id]: {
              ...(current[selectedStudent.id] ?? createScoreStudentDraft(selectedStudent, controller.studentStates[selectedStudent.id] ?? "active")),
              state: state as StudentState,
            },
          }))}
          statusLabel="Trạng thái"
          statusOptions={[
            { label: "Đang học", value: "active" },
            { label: "Nghỉ học", value: "disabled" },
          ]}
          statusValue={(controller.studentDrafts[selectedStudent.id] ?? createScoreStudentDraft(selectedStudent, controller.studentStates[selectedStudent.id] ?? "active")).state}
          student={selectedStudent}
        />
      )}

      {controller.pendingClassification && (
        <ClassificationChangeDialog
          comment={controller.classificationComment}
          pending={controller.pendingClassification}
          onCancel={() => {
            controller.setPendingClassification(null);
            controller.setClassificationComment("");
          }}
          onCommentChange={controller.setClassificationComment}
          onSave={controller.saveClassificationChange}
        />
      )}
    </>
  );
}

const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "none",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "left",
};

function ClassificationChangeDialog({
  comment,
  pending,
  onCancel,
  onCommentChange,
  onSave,
}: {
  comment: string;
  pending: Exclude<PendingClassification, null>;
  onCancel: () => void;
  onCommentChange: (value: string) => void;
  onSave: () => void;
}) {
  const canSave = comment.trim().length > 0;
  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={onCancel}
    >
      <div style={{ width: 460, maxWidth: "90vw", backgroundColor: "white", borderRadius: 8, overflow: "hidden" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ padding: 16, borderBottom: "1px solid #e5e7eb" }}>
          <Typography sx={{ fontWeight: 600 }}>Đổi xếp loại học sinh</Typography>
          <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.5 }}>{pending.student.name}</Typography>
        </div>
        <div style={{ padding: 16 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Chip label={pending.from} sx={getClassificationChipSx(pending.from)} />
            <Typography sx={{ color: "#6b7280" }}>→</Typography>
            <Chip label={pending.to} sx={getClassificationChipSx(pending.to)} />
          </Stack>
          <div style={{ marginTop: 16 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 0.5, color: "#6b7280" }}>Comment bắt buộc</Typography>
            <textarea
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder="Nhập lý do đổi xếp loại..."
              autoFocus
              style={{ width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, resize: "vertical" }}
            />
          </div>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 1.5, textTransform: "none" }}>Hủy</Button>
          <Button
            onClick={onSave}
            disabled={!canSave}
            variant="contained"
            sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600, backgroundColor: "#696CFF", "&:hover": { backgroundColor: "#5a5ce6" } }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}

import Download from "@mui/icons-material/Download";
import Search from "@mui/icons-material/Search";
import { Box, Button, Chip, Stack, TextField } from "@mui/material";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { AttendanceCurriculumTable } from "./attendance-curriculum-table";
import { AttendanceStudentTable } from "./attendance-student-table";
import type { AttendanceSheetController } from "./use-attendance-sheet-controller";

export function DesktopAttendanceSheetPanel({
  controller,
  overlays,
  selectedClass,
}: {
  controller: AttendanceSheetController;
  overlays: ReactNode;
  selectedClass?: ClassroomSnapshot;
}) {
  const splitRef = useRef<HTMLDivElement | null>(null);
  const [curriculumWidth, setCurriculumWidth] = useState(500);

  function resizeCurriculum(event: PointerEvent<HTMLDivElement>) {
    const bounds = splitRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const nextWidth = bounds.right - event.clientX;
    setCurriculumWidth(Math.max(360, Math.min(720, nextWidth)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 16, gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 8, backgroundColor: "white", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, color: "#696CFF", fontStyle: "italic" }}>
              Gv phụ trách: <strong>{selectedClass?.homeroomTeacher ?? ""}</strong>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Số tiết đã dạy: <strong style={{ color: "#ef4444" }}>{controller.taughtLessonCount}</strong>
            </div>
          </div>

          {controller.notice && (
            <div style={{ fontSize: 13, color: "#696CFF", fontWeight: 600, padding: "4px 12px", backgroundColor: "#EEF2FF", borderRadius: 4 }}>
              {controller.notice}
            </div>
          )}

          {controller.offlinePending ? (
            <Chip label="Đang chờ đồng bộ" size="small" color="warning" />
          ) : null}

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Tìm học sinh"
              value={controller.searchQuery}
              onChange={(event) => controller.setSearchQuery(event.target.value)}
              slotProps={{ input: { startAdornment: <Search sx={{ fontSize: 18, color: "#696CFF" }} /> } }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size="small"
              type="date"
              value={controller.selectedDate}
              onChange={(event) => controller.clampSelectedDate(event.target.value)}
              sx={{ minWidth: 140 }}
            />
            <select
              value={controller.selectedSubject}
              onChange={(event) => controller.setSelectedSubject(event.target.value)}
              style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, minWidth: 140 }}
            >
              {controller.subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <Button
              variant="contained"
              startIcon={<Download sx={{ fontSize: 18 }} />}
              onClick={controller.exportXlsx}
              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600, backgroundColor: "#696CFF", "&:hover": { backgroundColor: "#5a5ce6" } }}
            >
              Xuất Excel
            </Button>
          </Stack>
        </div>
      </div>

      <Stack direction="row" spacing={1} sx={{ px: 2 }}>
        <Chip label="Có mặt ✓" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontSize: 11 }} />
        <Chip label="Đi muộn M" size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontSize: 11 }} />
        <Chip label="Vắng V" size="small" sx={{ bgcolor: "#fee2e2", color: "#dc2626", fontSize: 11 }} />
        <Chip label="Có phép P" size="small" sx={{ bgcolor: "#EEF2FF", color: "#4f46e5", fontSize: 11 }} />
      </Stack>

      <Box
        ref={splitRef}
        sx={{
          display: "grid",
          flex: 1,
          gap: 2,
          gridTemplateColumns: { lg: `minmax(0, 1fr) 8px ${curriculumWidth}px`, xs: "1fr" },
          minHeight: 0,
        }}
      >
        <AttendanceStudentTable controller={controller} />
        <Box
          role="separator"
          aria-label="Điều chỉnh độ rộng khung chương trình"
          aria-orientation="vertical"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setCurriculumWidth((current) => Math.min(720, current + 24));
            if (event.key === "ArrowRight") setCurriculumWidth((current) => Math.max(360, current - 24));
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            resizeCurriculum(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) resizeCurriculum(event);
          }}
          sx={{
            alignSelf: "stretch",
            bgcolor: "#D9E2EF",
            borderRadius: 1,
            cursor: "col-resize",
            display: { xs: "none", lg: "block" },
            minWidth: 8,
            outline: "none",
            position: "relative",
            "&::after": {
              bgcolor: "#696CFF",
              borderRadius: 1,
              content: '""',
              height: 44,
              left: 2,
              opacity: 0,
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              transition: "opacity 140ms ease",
              width: 4,
            },
            "&:hover::after, &:focus-visible::after": { opacity: 1 },
          }}
        />
        <AttendanceCurriculumTable controller={controller} />
      </Box>
      {overlays}
    </div>
  );
}

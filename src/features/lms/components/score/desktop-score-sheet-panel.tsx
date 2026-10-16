import type { ReactNode } from "react";
import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import FilterList from "@mui/icons-material/FilterList";
import Search from "@mui/icons-material/Search";
import { Button, Chip, Menu, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";

import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import {
  classificationOptions,
  formatScore,
  getClassificationBg,
  getClassificationBorder,
  getClassificationColor,
  getScoreBg,
  type Classification,
} from "./score-sheet-model";
import type { ScoreSheetController } from "./use-score-sheet-controller";

type DesktopScoreSheetPanelProps = {
  controller: ScoreSheetController;
  overlays: ReactNode;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

export function DesktopScoreSheetPanel({
  controller,
  overlays,
  selectedClass,
  selectedSchoolName,
  students,
}: DesktopScoreSheetPanelProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 16, gap: 16 }}>
      <div style={{ padding: 16, borderRadius: 8, backgroundColor: "white", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{selectedClass?.className ?? "Lớp học"}</Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              {selectedSchoolName} · {students.length} học sinh · {controller.scoreColumns.length} cột điểm
            </Typography>
          </div>

          {controller.notice && (
            <Chip label={controller.notice} size="small" sx={{ backgroundColor: "#EEF2FF", color: "#696CFF" }} />
          )}

          {controller.offlinePending ? <Chip label="Đang chờ đồng bộ" size="small" color="warning" /> : null}

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
            <select
              value={controller.selectedSubject}
              onChange={(event) => controller.setSelectedSubject(event.target.value)}
              style={{ height: 40, padding: "0 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, minWidth: 160 }}
            >
              {controller.subjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>

            <TextField
              size="small"
              placeholder="Tìm học sinh"
              value={controller.searchQuery}
              onChange={(event) => controller.setSearchQuery(event.target.value)}
              slotProps={{ input: { startAdornment: <Search sx={{ fontSize: 18, color: "#6b7280" }} /> } }}
              sx={{ minWidth: 180 }}
            />

            <Button
              size="small"
              onClick={(event) => controller.setFilterAnchor(event.currentTarget)}
              startIcon={<FilterList />}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 1.5,
                textTransform: "none",
                backgroundColor: controller.classificationFilter.length < classificationOptions.length ? "#EEF2FF" : "white",
              }}
            >
              Lọc
            </Button>
            <Menu anchorEl={controller.filterAnchor} open={Boolean(controller.filterAnchor)} onClose={() => controller.setFilterAnchor(null)}>
              <MenuItem onClick={() => controller.setClassificationSort(controller.classificationSort === "asc" ? "desc" : controller.classificationSort === "desc" ? null : "asc")}>
                <FilterList sx={{ mr: 1, fontSize: 18 }} />
                Sắp xếp: {controller.classificationSort === "asc" ? "A→Z" : controller.classificationSort === "desc" ? "Z→A" : "Mặc định"}
              </MenuItem>
              <div style={{ padding: "8px 16px", borderTop: "1px solid #e5e7eb" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>Xếp loại:</Typography>
                {classificationOptions.map((option) => (
                  <MenuItem
                    key={option}
                    onClick={() => controller.setClassificationFilter(
                      controller.classificationFilter.includes(option)
                        ? controller.classificationFilter.filter((value) => value !== option)
                        : [...controller.classificationFilter, option],
                    )}
                    dense
                  >
                    {controller.classificationFilter.includes(option) ? <Check sx={{ mr: 1, fontSize: 16 }} /> : <span style={{ width: 24 }} />}
                    <Chip
                      label={option}
                      size="small"
                      sx={{
                        backgroundColor: controller.classificationFilter.includes(option) ? getClassificationBg(option) : "#f3f4f6",
                        color: controller.classificationFilter.includes(option) ? getClassificationColor(option) : "inherit",
                      }}
                    />
                  </MenuItem>
                ))}
              </div>
            </Menu>

            <TextField
              size="small"
              placeholder="Tên cột offline"
              value={controller.offlineColumnName}
              onChange={(event) => controller.setOfflineColumnName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && controller.addOfflineColumn()}
              sx={{ width: 140 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={controller.addOfflineColumn}
              sx={{ backgroundColor: "#696CFF", "&:hover": { backgroundColor: "#5a5ce6" }, borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
            >
              Tạo cột
            </Button>
          </Stack>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
        <Chip label="Điểm mới nhất" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontSize: 11 }} />
        <Chip label="Hover xem lịch sử" size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontSize: 11 }} />
        <Chip label="- là chưa làm" size="small" sx={{ bgcolor: "#f3f4f6", color: "#6b7280", fontSize: 11 }} />
      </div>

      <div ref={controller.tableScrollRef} style={{ flex: 1, minHeight: 0, overflow: "auto", backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <table style={{ width: "100%", minWidth: 800, borderCollapse: "collapse", fontSize: 13, fontFamily: "inherit" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={thStyle(48)}>STT</th>
              <th style={thStyle(200)}>Học sinh</th>
              <th style={thStyle(80)}>Điểm +/-</th>
              <th style={thStyle(100)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  Xếp loại <FilterList style={{ fontSize: 14 }} />
                </div>
              </th>
              {controller.scoreColumns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    ...thStyle(140),
                    backgroundColor: column.kind === "offline" ? "#fef3c7" : "#f8fafc",
                    color: column.kind === "offline" ? "#92400e" : "#374151",
                  }}
                >
                  <Tooltip title={`Điểm tối đa: ${column.maxScore}`}>
                    <span style={{ cursor: "help" }}>{column.label}</span>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {controller.measuredVirtualRows.map((virtualRow) => {
              const student = controller.filteredStudents[virtualRow.index];
              if (!student) return null;
              const studentState = controller.studentStates[student.id] ?? "active";
              const classification = controller.getClassification(student);
              const isDisabled = studentState === "disabled";

              return (
                <tr key={student.id} style={{ height: virtualRow.end - virtualRow.start, opacity: isDisabled ? 0.5 : 1 }}>
                  <td style={tdStyle(48, "center")}>{virtualRow.index + 1}</td>
                  <td style={tdStyle(200)}>
                    <button
                      onClick={() => controller.openStudentDetail(student)}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        controller.setContextMenu({ x: event.clientX, y: event.clientY, student });
                      }}
                      style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 600, color: isDisabled ? "#9ca3af" : "#696CFF", cursor: "pointer", textAlign: "left" }}
                    >
                      {controller.studentNameFor(student)}
                    </button>
                  </td>
                  <td style={tdStyle(80, "center")}>
                    <input
                      type="text"
                      value={controller.bonusScores[student.id] ?? ""}
                      onChange={(event) => controller.updateBonusScore(student.id, event.target.value)}
                      style={{ width: "100%", height: 28, border: "1px solid #e5e7eb", borderRadius: 4, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "0 4px" }}
                    />
                  </td>
                  <td style={tdStyle(100, "center")}>
                    <select
                      value={classification}
                      onChange={(event) => controller.requestClassificationChange(student, event.target.value as Classification)}
                      style={{ minWidth: 56, height: 32, borderRadius: 16, fontSize: 12, fontWeight: 700, border: "1px solid", borderColor: getClassificationBorder(classification), backgroundColor: getClassificationBg(classification), color: getClassificationColor(classification), cursor: "pointer" }}
                    >
                      {classificationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                  {controller.scoreColumns.map((column, columnIndex) => {
                    const attempts = controller.attemptsFor(student, column, virtualRow.index, columnIndex);
                    const latest = attempts[0];
                    const score = controller.manualScores[`${column.id}:${student.id}`] ?? (latest ? formatScore(latest.score) : "");
                    return (
                      <td
                        key={column.id}
                        style={{
                          ...tdStyle(140, "center"),
                          backgroundColor: column.kind === "offline" ? "#fefce8" : latest ? getScoreBg(latest.score, column.maxScore) : "white",
                          cursor: "help",
                        }}
                      >
                        {column.kind === "offline" ? (
                          <input
                            type="text"
                            value={score}
                            onChange={(event) => controller.updateManualScore(column.id, student.id, event.target.value)}
                            onBlur={() => controller.commitScore(column.id, student.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                controller.commitScore(column.id, student.id);
                                event.currentTarget.blur();
                              }
                            }}
                            placeholder="-"
                            style={{ width: "100%", height: 32, border: "1px solid #fef3c7", borderRadius: 4, textAlign: "center", fontSize: 13, fontWeight: 600, padding: "0 4px", backgroundColor: "transparent" }}
                          />
                        ) : latest ? (
                          <Tooltip title={`${latest.duration} · ${latest.takenAt} · ${attempts.length} lần`}>
                            <span style={{ fontWeight: 600 }}>{formatScore(latest.score)}</span>
                          </Tooltip>
                        ) : <span style={{ color: "#d1d5db" }}>-</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {overlays}
    </div>
  );
}

const thStyle = (width?: string | number) => ({
  padding: "8px 4px",
  border: "1px solid #e5e7eb",
  borderTop: "none",
  fontSize: 11,
  fontWeight: 700,
  textAlign: "center" as const,
  position: "sticky" as const,
  top: 0,
  zIndex: 1,
  width,
});

const tdStyle = (width?: string | number, textAlign: "left" | "center" = "left") => ({
  padding: "4px",
  border: "1px solid #e5e7eb",
  textAlign,
  width,
});

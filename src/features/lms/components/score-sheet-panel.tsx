import { useMemo, useRef, useState } from "react";
import { Button, Chip, Menu, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Add, Check, FilterList, Lock, Search } from "@mui/icons-material";
import { toast } from "sonner";

import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { StudentProfileDetailDrawer } from "@/features/lms/classroom/components/student-profile-detail-drawer";
import { MobileScoreSheetPanel } from "@/features/lms/components/score/mobile-score-sheet-panel";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVirtualList } from "@/hooks/use-virtual-list";

export type ScoreColumn = {
  id: string;
  label: string;
  maxScore: number;
  kind: "topic" | "quiz" | "offline";
};

type ScoreAttempt = {
  id: string;
  score: number;
  duration: string;
  takenAt: string;
};

export type Classification = "A" | "B" | "C" | "D" | "E";
type ClassificationSort = "asc" | "desc" | null;
export type StudentState = "active" | "disabled";

type ScoreSheetPanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const baseScoreColumns: ScoreColumn[] = [
  { id: "topic-tech", label: "Căn bản CN", maxScore: 1000, kind: "topic" },
  { id: "topic-citizen", label: "Công dân số", maxScore: 1000, kind: "topic" },
  { id: "topic-info", label: "QL thông tin", maxScore: 1000, kind: "topic" },
  { id: "topic-content", label: "Sáng tạo ND", maxScore: 1000, kind: "topic" },
  { id: "topic-communication", label: "Giao tiếp", maxScore: 1000, kind: "topic" },
  { id: "topic-collab", label: "Cộng tác", maxScore: 1000, kind: "topic" },
  { id: "topic-security", label: "An toàn", maxScore: 1000, kind: "topic" },
  { id: "review-01", label: "Ôn thi IC3", maxScore: 1000, kind: "quiz" },
];

const classificationOptions: Classification[] = ["A", "B", "C", "D", "E"];

export function ScoreSheetPanel({ selectedClass, selectedSchoolName, students }: ScoreSheetPanelProps) {
  const isMobile = useIsMobile();
  const [offlineColumns, setOfflineColumns] = useState<ScoreColumn[]>([]);
  const [offlineColumnName, setOfflineColumnName] = useState("");
  const [manualScores, setManualScores] = useState<Record<string, string>>({});
  const [bonusScores, setBonusScores] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [classificationFilter, setClassificationFilter] = useState<Classification[]>(classificationOptions);
  const [classificationSort, setClassificationSort] = useState<ClassificationSort>(null);
  const [manualClassifications, setManualClassifications] = useState<Record<string, Classification>>({});
  const [pendingClassification, setPendingClassification] = useState<{ student: ClassroomStudent; from: Classification; to: Classification } | null>(null);
  const [classificationComment, setClassificationComment] = useState("");
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>({});
  const [studentDrafts, setStudentDrafts] = useState<Record<string, { name: string; username: string; password: string; state: StudentState; note: string }>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: ClassroomStudent } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);

  const scoreColumns = [...baseScoreColumns, ...offlineColumns];
  const selectedStudent = students.find((s) => s.id === selectedStudentId) ?? null;

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(query));
    }

    // Classification filter
    result = result.filter((s) => {
      const cls = getStudentClassification(s, manualClassifications);
      return classificationFilter.includes(cls);
    });

    // Sort by classification
    if (classificationSort) {
      result.sort((a, b) => {
        const clsA = getStudentClassification(a, manualClassifications);
        const clsB = getStudentClassification(b, manualClassifications);
        const idxA = classificationOptions.indexOf(clsA);
        const idxB = classificationOptions.indexOf(clsB);
        return classificationSort === "asc" ? idxA - idxB : idxB - idxA;
      });
    }

    // Disabled students at bottom
    const active = result.filter((s) => (studentStates[s.id] ?? "active") === "active");
    const disabled = result.filter((s) => (studentStates[s.id] ?? "active") === "disabled");
    return [...active, ...disabled];
  }, [students, debouncedSearchQuery, classificationFilter, classificationSort, manualClassifications, studentStates]);

  const rowVirtualizer = useVirtualList({
    count: filteredStudents.length,
    estimateSize: 40,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();

  function addOfflineColumn() {
    const label = offlineColumnName.trim() || `Offline ${offlineColumns.length + 1}`;
    setOfflineColumns((columns) => [
      ...columns,
      { id: `offline-${Date.now()}-${columns.length}`, label, maxScore: 10, kind: "offline" },
    ]);
    setOfflineColumnName("");
  }

  function updateManualScore(columnId: string, studentId: string, score: string) {
    if (!/^\d*([.,]\d*)?$/.test(score)) return;
    setManualScores((current) => ({ ...current, [`${columnId}:${studentId}`]: score.replace(",", ".") }));
  }

  function updateBonusScore(studentId: string, score: string) {
    if (!/^-?\d*([.,]\d*)?$/.test(score)) return;
    setBonusScores((current) => ({ ...current, [studentId]: score.replace(",", ".") }));
  }

  function requestClassificationChange(student: ClassroomStudent, next: Classification) {
    const previous = getStudentClassification(student, manualClassifications);
    if (previous === next) return;
    setPendingClassification({ student, from: previous, to: next });
    setClassificationComment("");
  }

  function saveClassificationChange() {
    if (!pendingClassification || !classificationComment.trim()) return;
    const { student, to } = pendingClassification;
    setManualClassifications((current) => ({ ...current, [student.id]: to }));
    setPendingClassification(null);
    setClassificationComment("");
    toast.success("Đã cập nhật xếp loại");
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentDraft(student, studentStates[student.id] ?? "active"),
    }));
  }

  function disableStudent(student: ClassroomStudent) {
    setStudentStates((current) => ({ ...current, [student.id]: "disabled" }));
    setNotice(`Đã khóa ${student.name}`);
    toast.success("Đã khóa tài khoản");
  }

  if (isMobile) {
    return (
      <>
        <MobileScoreSheetPanel
          addOfflineColumn={addOfflineColumn}
          bonusScores={bonusScores}
          commitScoreInputOnEnter={() => {}}
          getClassification={(s) => getStudentClassification(s, manualClassifications)}
          getStudentState={(s) => studentStates[s.id] ?? "active"}
          manualScores={manualScores}
          offlineColumnName={offlineColumnName}
          onOfflineColumnNameChange={setOfflineColumnName}
          onOpenStudentDetail={openStudentDetail}
          onRequestClassificationChange={requestClassificationChange}
          onSearchQueryChange={setSearchQuery}
          onSelectedSubjectChange={setSelectedSubject}
          onUpdateBonusScore={updateBonusScore}
          onUpdateManualScore={updateManualScore}
          scoreColumns={scoreColumns}
          searchQuery={searchQuery}
          selectedClass={selectedClass}
          selectedSchoolName={selectedSchoolName}
          selectedSubject={selectedSubject}
          sortedStudents={filteredStudents}
          studentNameFor={(s) => studentDrafts[s.id]?.name ?? s.name}
          subjectOptions={lmsSubjectOptions}
        />
        {selectedStudent && (
          <StudentProfileDetailDrawer
            draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")}
            onClose={() => setSelectedStudentId(null)}
            onUpdate={(patch) => setStudentDrafts((current) => ({ ...current, [selectedStudent.id]: { ...current[selectedStudent.id], ...patch } }))}
            onStatusChange={(state) => setStudentDrafts((current) => ({ ...current, [selectedStudent.id]: { ...current[selectedStudent.id], state } }))}
            statusLabel="Trạng thái"
            statusOptions={[
              { label: "Đang học", value: "active" },
              { label: "Nghỉ học", value: "disabled" },
            ]}
            statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")).state}
            student={selectedStudent}
          />
        )}
        {pendingClassification && (
          <ClassificationChangeDialog
            comment={classificationComment}
            pending={pendingClassification}
            onCancel={() => { setPendingClassification(null); setClassificationComment(""); }}
            onCommentChange={setClassificationComment}
            onSave={saveClassificationChange}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, padding: 16, gap: 16 }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderRadius: 8,
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{selectedClass?.className ?? "Lớp học"}</Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>
              {selectedSchoolName} · {students.length} học sinh · {scoreColumns.length} cột điểm
            </Typography>
          </div>

          {notice && (
            <Chip label={notice} size="small" sx={{ backgroundColor: "#EEF2FF", color: "#696CFF" }} />
          )}

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                height: 40,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                minWidth: 160,
              }}
            >
              {lmsSubjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <TextField
              size="small"
              placeholder="Tìm học sinh"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <Search sx={{ fontSize: 18, color: "#6b7280" }} />,
                },
              }}
              sx={{ minWidth: 180 }}
            />

            <Button
              size="small"
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              startIcon={<FilterList />}
              sx={{
                border: "1px solid #e5e7eb",
                borderRadius: 1.5,
                textTransform: "none",
                backgroundColor: classificationFilter.length < classificationOptions.length ? "#EEF2FF" : "white",
              }}
            >
              Lọc
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
            >
              <MenuItem onClick={() => setClassificationSort(classificationSort === "asc" ? "desc" : classificationSort === "desc" ? null : "asc")}>
                <FilterList sx={{ mr: 1, fontSize: 18 }} />
                Sắp xếp: {classificationSort === "asc" ? "A→Z" : classificationSort === "desc" ? "Z→A" : "Mặc định"}
              </MenuItem>
              <div style={{ padding: "8px 16px", borderTop: "1px solid #e5e7eb" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>Xếp loại:</Typography>
                {classificationOptions.map((opt) => (
                  <MenuItem
                    key={opt}
                    onClick={() => {
                      const next = classificationFilter.includes(opt)
                        ? classificationFilter.filter((o) => o !== opt)
                        : [...classificationFilter, opt];
                      setClassificationFilter(next);
                    }}
                    dense
                  >
                    {classificationFilter.includes(opt) ? <Check sx={{ mr: 1, fontSize: 16 }} /> : <span style={{ width: 24 }} />}
                    <Chip
                      label={opt}
                      size="small"
                      sx={{
                        backgroundColor: classificationFilter.includes(opt) ? getClassificationBg(opt) : "#f3f4f6",
                        color: classificationFilter.includes(opt) ? getClassificationColor(opt) : "inherit",
                      }}
                    />
                  </MenuItem>
                ))}
              </div>
            </Menu>

            <TextField
              size="small"
              placeholder="Tên cột offline"
              value={offlineColumnName}
              onChange={(e) => setOfflineColumnName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addOfflineColumn()}
              sx={{ width: 140 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={addOfflineColumn}
              sx={{
                backgroundColor: "#696CFF",
                "&:hover": { backgroundColor: "#5a5ce6" },
                borderRadius: 1.5,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Tạo cột
            </Button>
          </Stack>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 8, paddingLeft: 8 }}>
        <Chip label="Điểm mới nhất" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontSize: 11 }} />
        <Chip label="Hover xem lịch sử" size="small" sx={{ bgcolor: "#fef3c7", color: "#d97706", fontSize: 11 }} />
        <Chip label="- là chưa làm" size="small" sx={{ bgcolor: "#f3f4f6", color: "#6b7280", fontSize: 11 }} />
      </div>

      {/* Table Container */}
      <div
        ref={tableScrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        <table style={{
          width: "100%",
          minWidth: 800,
          borderCollapse: "collapse",
          fontSize: 13,
          fontFamily: "inherit",
        }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th style={thStyle(48)}>STT</th>
              <th style={thStyle(200)}>Học sinh</th>
              <th style={thStyle(80)}>Điểm +/-</th>
              <th style={thStyle(100)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  Xếp loại
                  <FilterList style={{ fontSize: 14 }} />
                </div>
              </th>
              {scoreColumns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    ...thStyle(140),
                    backgroundColor: col.kind === "offline" ? "#fef3c7" : "#f8fafc",
                    color: col.kind === "offline" ? "#92400e" : "#374151",
                  }}
                >
                  <Tooltip title={`Điểm tối đa: ${col.maxScore}`}>
                    <span style={{ cursor: "help" }}>{col.label}</span>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measuredVirtualRows.map((virtualRow) => {
              const student = filteredStudents[virtualRow.index];
              if (!student) return null;

              const studentState = studentStates[student.id] ?? "active";
              const classification = getStudentClassification(student, manualClassifications);
              const isDisabled = studentState === "disabled";

              return (
                <tr
                  key={student.id}
                  style={{
                    height: virtualRow.end - virtualRow.start,
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                >
                  <td style={tdStyle(48, "center")}>{virtualRow.index + 1}</td>
                  <td style={tdStyle(200)}>
                    <button
                      onClick={() => openStudentDetail(student)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, student });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: isDisabled ? "#9ca3af" : "#696CFF",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {studentDrafts[student.id]?.name ?? student.name}
                    </button>
                  </td>
                  <td style={tdStyle(80, "center")}>
                    <input
                      type="text"
                      value={bonusScores[student.id] ?? ""}
                      onChange={(e) => updateBonusScore(student.id, e.target.value)}
                      style={{
                        width: "100%",
                        height: 28,
                        border: "1px solid #e5e7eb",
                        borderRadius: 4,
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        padding: "0 4px",
                      }}
                    />
                  </td>
                  <td style={tdStyle(100, "center")}>
                    <select
                      value={classification}
                      onChange={(e) => requestClassificationChange(student, e.target.value as Classification)}
                      style={{
                        minWidth: 56,
                        height: 32,
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 700,
                        border: "1px solid",
                        borderColor: getClassificationBorder(classification),
                        backgroundColor: getClassificationBg(classification),
                        color: getClassificationColor(classification),
                        cursor: "pointer",
                      }}
                    >
                      {classificationOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  {scoreColumns.map((col) => {
                    const attempts = getMockAttempts(student, col, virtualRow.index, scoreColumns.indexOf(col));
                    const latest = attempts[0];
                    const score = manualScores[`${col.id}:${student.id}`] ?? (latest ? formatScore(latest.score) : "");

                    return (
                      <td
                        key={col.id}
                        style={{
                          ...tdStyle(140, "center"),
                          backgroundColor: col.kind === "offline"
                            ? "#fefce8"
                            : latest
                              ? getScoreBg(latest?.score, col.maxScore)
                              : "white",
                          cursor: "help",
                        }}
                      >
                        {col.kind === "offline" ? (
                          <input
                            type="text"
                            value={score}
                            onChange={(e) => updateManualScore(col.id, student.id, e.target.value)}
                            placeholder="-"
                            style={{
                              width: "100%",
                              height: 32,
                              border: "1px solid #fef3c7",
                              borderRadius: 4,
                              textAlign: "center",
                              fontSize: 13,
                              fontWeight: 600,
                              padding: "0 4px",
                              backgroundColor: "transparent",
                            }}
                          />
                        ) : latest ? (
                          <Tooltip title={`${latest.duration} · ${latest.takenAt} · ${attempts.length} lần`}>
                            <span style={{ fontWeight: 600 }}>{formatScore(latest.score)}</span>
                          </Tooltip>
                        ) : (
                          <span style={{ color: "#d1d5db" }}>-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
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
            <div style={{ fontSize: 13, fontWeight: 600 }}>{contextMenu.student.name}</div>
          </div>
          <button
            onClick={() => { setNotice("Đã mở thêm HS chuyển lớp"); setContextMenu(null); }}
            style={menuItemStyle}
          >
            <Add style={{ fontSize: 18 }} />
            Thêm HS chuyển lớp
          </button>
          <button
            onClick={() => { disableStudent(contextMenu.student); setContextMenu(null); }}
            style={{ ...menuItemStyle, color: "#dc2626" }}
          >
            <Lock style={{ fontSize: 18 }} />
            Nghỉ học / khóa
          </button>
        </div>
      )}
      {contextMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => setContextMenu(null)}
        />
      )}

      {/* Student Detail */}
      {selectedStudent && (
        <StudentProfileDetailDrawer
          draft={studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")}
          onClose={() => setSelectedStudentId(null)}
          onUpdate={(patch) => setStudentDrafts((current) => ({ ...current, [selectedStudent.id]: { ...current[selectedStudent.id], ...patch } }))}
          onStatusChange={(state) => setStudentDrafts((current) => ({ ...current, [selectedStudent.id]: { ...current[selectedStudent.id], state } }))}
          statusLabel="Trạng thái"
          statusOptions={[
            { label: "Đang học", value: "active" },
            { label: "Nghỉ học", value: "disabled" },
          ]}
          statusValue={(studentDrafts[selectedStudent.id] ?? createStudentDraft(selectedStudent, studentStates[selectedStudent.id] ?? "active")).state}
          student={selectedStudent}
        />
      )}

      {/* Classification Change Dialog */}
      {pendingClassification && (
        <ClassificationChangeDialog
          comment={classificationComment}
          pending={pendingClassification}
          onCancel={() => { setPendingClassification(null); setClassificationComment(""); }}
          onCommentChange={setClassificationComment}
          onSave={saveClassificationChange}
        />
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
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
  pending: { student: ClassroomStudent; from: Classification; to: Classification };
  onCancel: () => void;
  onCommentChange: (value: string) => void;
  onSave: () => void;
}) {
  const canSave = comment.trim().length > 0;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 460,
          maxWidth: "90vw",
          backgroundColor: "white",
          borderRadius: 8,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Nhập lý do đổi xếp loại..."
              autoFocus
              style={{
                width: "100%",
                minHeight: 80,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                resize: "vertical",
              }}
            />
          </div>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: 1.5, textTransform: "none" }}>
            Hủy
          </Button>
          <Button
            onClick={onSave}
            disabled={!canSave}
            variant="contained"
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#696CFF",
              "&:hover": { backgroundColor: "#5a5ce6" },
            }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
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

function getMockAttempts(student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number): ScoreAttempt[] {
  if ((studentIndex + columnIndex) % 6 === 0) return [];
  const count = ((studentIndex + columnIndex) % 4) + 1;
  return Array.from({ length: count }, (_, attemptIndex) => {
    const base = student.averageScore / 10 + ((columnIndex % 3) - 1) * 0.55 - attemptIndex * 0.25;
    const rawScore = (base / 10) * column.maxScore;
    const score = Math.max(0, Math.min(column.maxScore, column.maxScore >= 100 ? Math.round(rawScore) : Math.round(rawScore * 10) / 10));
    return {
      id: `${student.id}-${column.id}-${attemptIndex}`,
      score,
      duration: `${18 + ((studentIndex + attemptIndex * 7) % 32)} phút`,
      takenAt: `${String(18 + attemptIndex).padStart(2, "0")}/05/2026`,
    };
  });
}

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getStudentClassification(student: ClassroomStudent, manual: Record<string, Classification>): Classification {
  if (manual[student.id]) return manual[student.id];
  if (student.averageScore >= 90) return "A";
  if (student.averageScore >= 80) return "B";
  if (student.averageScore >= 70) return "C";
  if (student.averageScore >= 60) return student.status === "support" ? "E" : "D";
  return "E";
}

function getClassificationBg(c: Classification) {
  switch (c) {
    case "A": return "#dcfce7";
    case "B": return "#dbeafe";
    case "C": return "#fef3c7";
    case "D": return "#fed7aa";
    case "E": return "#fee2e2";
    default: return "#fee2e2";
  }
}

function getClassificationColor(c: Classification) {
  switch (c) {
    case "A": return "#16a34a";
    case "B": return "#2563eb";
    case "C": return "#d97706";
    case "D": return "#ea580c";
    case "E": return "#dc2626";
    default: return "#dc2626";
  }
}

function getClassificationBorder(c: Classification) {
  switch (c) {
    case "A": return "#bbf7d0";
    case "B": return "#bfdbfe";
    case "C": return "#fde68a";
    case "D": return "#fdba74";
    case "E": return "#fecaca";
    default: return "#fecaca";
  }
}

function getClassificationChipSx(c: Classification) {
  return {
    backgroundColor: getClassificationBg(c),
    color: getClassificationColor(c),
    fontWeight: 700,
    fontSize: 14,
  };
}

function getScoreBg(score: number | undefined, maxScore: number) {
  if (score === undefined) return "white";
  const rate = score / maxScore;
  if (rate < 0.5) return "#fee2e2";
  if (rate >= 0.8) return "#dcfce7";
  return "white";
}

function createStudentDraft(student: ClassroomStudent, state: StudentState) {
  return {
    name: student.name,
    username: student.name.toLowerCase().replace(/[^a-z0-9]+/g, "."),
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    state,
    note: student.mentorNote,
  };
}

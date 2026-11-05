import { useMemo, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";

import { ErgButton, ErgIconButton, ErgSearchField, ErgSelect } from "@/components/erg-mui";
import type { ClassroomSnapshot, ClassroomStudent } from "@/domain/school/classroom-types";
import type { Classification, ScoreColumn, StudentState } from "@/features/lms/components/score/score-sheet-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type MobileScoreMode = "student" | "column" | "sheet";

type MobileScoreEditor = {
  column: ScoreColumn;
  student: ClassroomStudent;
  value: string;
} | null;

type MobileScoreSheetPanelProps = {
  addOfflineColumn: () => void;
  bonusScores: Record<string, string>;
  getClassification: (student: ClassroomStudent) => Classification;
  getStudentState: (student: ClassroomStudent) => StudentState;
  offlineColumnName: string;
  onOfflineColumnNameChange: (value: string) => void;
  onCommitScore: (columnId: string, studentId: string, value?: string) => void;
  onOpenStudentDetail: (student: ClassroomStudent) => void;
  onRequestClassificationChange: (student: ClassroomStudent, next: Classification) => void;
  onUpdateBonusScore: (studentId: string, score: string) => void;
  onUpdateManualScore: (columnId: string, studentId: string, score: string) => void;
  offlinePending?: boolean;
  scoreColumns: ScoreColumn[];
  scoreValueFor: (student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number) => string;
  searchQuery: string;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  selectedSubject: string;
  sortedStudents: ClassroomStudent[];
  studentNameFor: (student: ClassroomStudent) => string;
  onSearchQueryChange: (value: string) => void;
  onSelectedSubjectChange: (value: string) => void;
  subjectOptions: string[];
};

const primaryTint = (theme: Theme) => alpha(theme.palette.primary.main, 0.1);
const cardSx = { border: 1, borderColor: "divider", bgcolor: "background.paper", boxShadow: ergEnterpriseTokens.shadow.sm } as const;
const gridCellSx = { borderBottom: 1, borderRight: 1, borderColor: "divider" } as const;
const lineClamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;
const nativeInputSx = {
  height: 44,
  borderRadius: 1.5,
  border: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  color: "text.primary",
  px: 1,
  font: "inherit",
  outline: "none",
  "&:focus": { borderColor: "primary.main", boxShadow: ergEnterpriseTokens.shadow.focus },
} as const;
const primaryIconButtonSx = { width: 44, height: 44, borderRadius: 1.5, bgcolor: "primary.main", color: "primary.contrastText", "&:hover": { bgcolor: "primary.dark" } } as const;

export function MobileScoreSheetPanel({
  addOfflineColumn,
  bonusScores,
  getClassification,
  getStudentState,
  offlineColumnName,
  onOfflineColumnNameChange,
  onCommitScore,
  onOpenStudentDetail,
  onRequestClassificationChange,
  onSearchQueryChange,
  onSelectedSubjectChange,
  onUpdateBonusScore,
  onUpdateManualScore,
  offlinePending,
  scoreColumns,
  scoreValueFor,
  searchQuery,
  selectedClass,
  selectedSchoolName,
  selectedSubject,
  sortedStudents,
  studentNameFor,
  subjectOptions,
}: MobileScoreSheetPanelProps) {
  const [mode, setMode] = useState<MobileScoreMode>("student");
  const [activeColumnId, setActiveColumnId] = useState(scoreColumns[0]?.id ?? "");
  const [editor, setEditor] = useState<MobileScoreEditor>(null);
  const activeColumn = scoreColumns.find((column) => column.id === activeColumnId) ?? scoreColumns[0];
  const visibleStudents = sortedStudents;

  const classSummary = useMemo(() => {
    const activeCount = visibleStudents.filter((student) => getStudentState(student) === "active").length;
    return `${selectedSchoolName} · ${visibleStudents.length} học sinh · ${activeCount} đang học`;
  }, [getStudentState, selectedSchoolName, visibleStudents]);

  function openEditor(column: ScoreColumn, student: ClassroomStudent, studentIndex: number, columnIndex: number) {
    setEditor({ column, student, value: scoreValueFor(student, column, studentIndex, columnIndex) });
  }

  function saveEditor() {
    if (!editor) return;
    onUpdateManualScore(editor.column.id, editor.student.id, editor.value);
    onCommitScore(editor.column.id, editor.student.id, editor.value);
    setEditor(null);
  }

  return (
    <Box sx={{ display: "flex", height: "100%", minHeight: 0, flexDirection: "column", overflow: "hidden", bgcolor: "background.default" }}>
      <Box component="section" sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1.5, boxShadow: ergEnterpriseTokens.shadow.xs }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: "fontWeightBold" }}>Bảng điểm{selectedClass?.className ? ` · ${selectedClass.className}` : ""}</Typography>
          <Typography variant="caption" component="div" noWrap sx={{ mt: 0.25, color: "text.secondary", fontWeight: "fontWeightMedium" }}>{classSummary}</Typography>
        </Box>

        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "minmax(0,1fr) 112px", gap: 1 }}>
          <ErgSearchField
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm học sinh"
            sx={{ minWidth: 0, "& .MuiInputBase-root": { height: 44, bgcolor: "background.paper" } }}
          />
          <ErgSelect
            size="small"
            value={selectedSubject}
            onChange={(event) => onSelectedSubjectChange(String(event.target.value))}
            options={subjectOptions.map((subject) => ({ value: subject, label: subject }))}
            slotProps={{ select: { SelectDisplayProps: { "aria-label": "Chọn môn học" } } }}
            sx={{ "& .MuiInputBase-root": { minHeight: 44 } }}
          />
        </Box>

        {offlinePending ? (
          <Typography variant="caption" component="div" sx={{ mt: 1, borderRadius: 1.5, bgcolor: "warning.light", color: "warning.main", px: 1.5, py: 1, fontWeight: "fontWeightBold" }}>
            Đang chờ đồng bộ
          </Typography>
        ) : null}

        <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 0.5, borderRadius: 2, bgcolor: primaryTint, p: 0.75 }}>
          {[
            ["student", "Học sinh"],
            ["column", "Cột điểm"],
            ["sheet", "Sheet"],
          ].map(([value, label]) => (
            <ButtonBase
              key={value}
              onClick={() => setMode(value as MobileScoreMode)}
              sx={[
                { minHeight: 44, borderRadius: 1.5, px: 1, typography: "body2", fontWeight: "fontWeightBold", color: "text.secondary", transition: "all 0.15s ease" },
                mode === value && { bgcolor: "background.paper", color: "primary.main", boxShadow: ergEnterpriseTokens.shadow.xs },
              ]}
            >
              {label}
            </ButtonBase>
          ))}
        </Box>
      </Box>

      {mode === "student" ? (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", px: 1.5, py: 1.5 }}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {visibleStudents.map((student, studentIndex) => {
              const state = getStudentState(student);
              const classification = getClassification(student);
              return (
                <Box
                  component="article"
                  key={student.id}
                  sx={[{ ...cardSx, borderRadius: 2, p: 1.5 }, state === "disabled" && { bgcolor: "background.default", color: "text.disabled" }]}
                >
                  <Box sx={{ display: "flex", minWidth: 0, alignItems: "flex-start", gap: 1.5 }}>
                    <ErgIconButton
                      label={`Mở hồ sơ ${studentNameFor(student)}`}
                      onClick={() => onOpenStudentDetail(student)}
                      sx={{ width: 44, height: 44, flexShrink: 0, bgcolor: primaryTint, color: "primary.main" }}
                    >
                      <PersonOutlineIcon fontSize="small" />
                    </ErgIconButton>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <ButtonBase
                        onClick={() => onOpenStudentDetail(student)}
                        sx={{ display: "block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left", typography: "subtitle1", fontWeight: "fontWeightBold", color: "inherit" }}
                      >
                        {studentNameFor(student)}
                      </ButtonBase>
                      <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
                        <Typography
                          variant="caption"
                          component="span"
                          sx={[{ borderRadius: 0.75, border: 1, px: 1, py: 0.5, fontWeight: "fontWeightBold" }, classificationSx(classification)]}
                        >
                          {classification}
                        </Typography>
                        <Box
                          component="input"
                          value={bonusScores[student.id] ?? ""}
                          onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateBonusScore(student.id, event.target.value)}
                          inputMode="decimal"
                          aria-label={`Điểm cộng trừ của ${studentNameFor(student)}`}
                          placeholder="+/-"
                          sx={{ ...nativeInputSx, height: 40, width: 80, textAlign: "center", typography: "body2", fontWeight: "fontWeightBold" }}
                        />
                      </Box>
                    </Box>
                    <ErgButton
                      variant="outlined"
                      onClick={() => onRequestClassificationChange(student, nextClassification(classification))}
                      sx={{ height: 44, borderRadius: 1.5, px: 1.5, flexShrink: 0 }}
                    >
                      Đổi loại
                    </ErgButton>
                  </Box>
                  <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
                    {scoreColumns.slice(0, 4).map((column, columnIndex) => (
                      <ButtonBase
                        key={column.id}
                        onClick={() => openEditor(column, student, studentIndex, columnIndex)}
                        sx={{ minHeight: 56, borderRadius: 1.75, border: 1, borderColor: "divider", bgcolor: "background.default", px: 1, py: 1, display: "block", textAlign: "left" }}
                      >
                        <Typography variant="caption" component="span" noWrap sx={{ display: "block", fontWeight: "fontWeightBold", color: "text.secondary" }}>{column.label}</Typography>
                        <Typography variant="subtitle1" component="span" sx={{ mt: 0.5, display: "block", fontWeight: "fontWeightBold" }}>
                          {scoreValueFor(student, column, studentIndex, columnIndex) || "-"}
                        </Typography>
                      </ButtonBase>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      ) : null}

      {mode === "column" && activeColumn ? (
        <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
          <Box sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1 }}>
            <ErgSelect
              size="small"
              label="Cột"
              value={activeColumn.id}
              onChange={(event) => setActiveColumnId(String(event.target.value))}
              options={scoreColumns.map((column) => ({ value: column.id, label: column.label }))}
              slotProps={{ select: { SelectDisplayProps: { "aria-label": "Chọn cột điểm" } } }}
            />
          </Box>
          <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", px: 1.5, py: 1.5 }}>
            <Box sx={{ display: "grid", gap: 1 }}>
              {visibleStudents.map((student, studentIndex) => {
                const columnIndex = Math.max(0, scoreColumns.findIndex((column) => column.id === activeColumn.id));
                return (
                  <Box
                    key={student.id}
                    sx={{ ...cardSx, display: "grid", minHeight: 58, gridTemplateColumns: "minmax(0,1fr) 96px", alignItems: "center", gap: 1, borderRadius: 1.75, px: 1.5, py: 1 }}
                  >
                    <ButtonBase onClick={() => onOpenStudentDetail(student)} sx={{ minWidth: 0, display: "block", textAlign: "left" }}>
                      <Typography variant="body2" component="span" noWrap sx={{ display: "block", fontWeight: "fontWeightBold" }}>{studentNameFor(student)}</Typography>
                      <Typography variant="caption" component="span" sx={{ mt: 0.25, display: "block", fontWeight: "fontWeightMedium", color: "text.secondary" }}>{activeColumn.label}</Typography>
                    </ButtonBase>
                    <Box
                      component="input"
                      value={scoreValueFor(student, activeColumn, studentIndex, columnIndex)}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => onUpdateManualScore(activeColumn.id, student.id, event.target.value)}
                      onBlur={(event: FocusEvent<HTMLInputElement>) => onCommitScore(activeColumn.id, student.id, event.currentTarget.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                      }}
                      inputMode="decimal"
                      aria-label={`${studentNameFor(student)} ${activeColumn.label}`}
                      sx={{ ...nativeInputSx, minWidth: 0, textAlign: "center", typography: "subtitle1", fontWeight: "fontWeightBold" }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      ) : null}

      {mode === "sheet" ? (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto", bgcolor: "background.paper" }}>
          <Box sx={{ display: "grid", minWidth: "max-content", gridTemplateColumns: `148px repeat(${scoreColumns.length}, 88px)` }}>
            <Typography variant="caption" component="div" sx={{ ...gridCellSx, position: "sticky", left: 0, top: 0, zIndex: 20, bgcolor: "background.default", px: 1, py: 1, fontWeight: "fontWeightBold", color: "text.secondary" }}>
              Học sinh
            </Typography>
            {scoreColumns.map((column) => (
              <Typography
                key={column.id}
                variant="caption"
                component="div"
                sx={{ ...gridCellSx, position: "sticky", top: 0, zIndex: 10, bgcolor: "background.default", px: 1, py: 1, textAlign: "center", fontWeight: "fontWeightBold" }}
              >
                <Box component="span" sx={lineClamp2}>{column.label}</Box>
              </Typography>
            ))}
            {visibleStudents.map((student, studentIndex) => (
              <Box key={student.id} sx={{ display: "contents" }}>
                <ButtonBase
                  onClick={() => onOpenStudentDetail(student)}
                  sx={{ ...gridCellSx, position: "sticky", left: 0, zIndex: 10, minHeight: 48, bgcolor: "background.paper", px: 1, justifyContent: "flex-start", textAlign: "left", typography: "caption", fontWeight: "fontWeightBold", color: "primary.main" }}
                >
                  <Box component="span" sx={lineClamp2}>{studentNameFor(student)}</Box>
                </ButtonBase>
                {scoreColumns.map((column, columnIndex) => (
                  <ButtonBase
                    key={`${student.id}-${column.id}`}
                    onClick={() => openEditor(column, student, studentIndex, columnIndex)}
                    sx={[
                      { ...gridCellSx, minHeight: 48, px: 0.5, textAlign: "center", typography: "body2", fontWeight: "fontWeightBold" },
                      scoreToneSx(scoreValueFor(student, column, studentIndex, columnIndex), column.maxScore),
                    ]}
                  >
                    {scoreValueFor(student, column, studentIndex, columnIndex) || "-"}
                  </ButtonBase>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 52px", gap: 1 }}>
          <Box
            component="input"
            value={offlineColumnName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onOfflineColumnNameChange(event.target.value)}
            placeholder="Tên cột offline"
            sx={{ ...nativeInputSx, minWidth: 0, px: 1.5, typography: "body2", fontWeight: "fontWeightMedium" }}
          />
          <ErgIconButton label="Tạo cột offline" onClick={addOfflineColumn} sx={primaryIconButtonSx}>
            <AddIcon fontSize="small" />
          </ErgIconButton>
        </Box>
      </Box>

      {editor ? (
        <Box
          role="dialog"
          aria-modal="true"
          aria-label="Chỉnh điểm"
          sx={(theme) => ({ position: "fixed", inset: 0, zIndex: 120, display: "flex", alignItems: "flex-end", bgcolor: alpha(theme.palette.text.primary, 0.35) })}
        >
          <Box
            component="button"
            type="button"
            aria-label="Đóng chỉnh điểm"
            onClick={() => setEditor(null)}
            sx={{ position: "absolute", inset: 0, m: 0, p: 0, border: 0, bgcolor: "transparent", cursor: "default" }}
          />
          <Box
            sx={{ position: "relative", width: "100%", borderTopLeftRadius: 20, borderTopRightRadius: 20, border: 1, borderColor: "divider", bgcolor: "background.paper", p: 2, pb: "max(16px, env(safe-area-inset-bottom))", boxShadow: ergEnterpriseTokens.shadow.md }}
          >
            <Box sx={{ mx: "auto", mb: 1.5, height: 4, width: 48, borderRadius: 9999, bgcolor: "divider" }} />
            <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "text.secondary" }}>{editor.column.label}</Typography>
            <Typography variant="h6" noWrap sx={{ mt: 0.5, fontWeight: "fontWeightBold" }}>{studentNameFor(editor.student)}</Typography>
            <Box component="label" sx={{ mt: 2, display: "block" }}>
              <Typography variant="body2" component="span" sx={{ mb: 0.5, display: "block", fontWeight: "fontWeightBold", color: "text.secondary" }}>Điểm</Typography>
              <Box
                component="input"
                value={editor.value}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setEditor({ ...editor, value: event.target.value })}
                inputMode="decimal"
                autoFocus
                sx={{ ...nativeInputSx, height: 48, width: "100%", px: 1.5, textAlign: "center", typography: "h6", fontWeight: "fontWeightBold" }}
              />
            </Box>
            <Box sx={{ mt: 1.5, borderRadius: 1.75, border: 1, borderColor: "divider", bgcolor: "background.default", p: 1.5 }}>
              <Typography variant="body2" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "fontWeightBold", color: "text.secondary" }}>
                <HistoryIcon fontSize="small" sx={{ color: "primary.main" }} />
                Lịch sử gần đây
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: "fontWeightMedium", color: "text.secondary" }}>Mobile dùng tap sheet thay hover. Dữ liệu lịch sử thật sẽ nối API sau.</Typography>
            </Box>
            <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1 }}>
              <ErgButton variant="outlined" onClick={() => setEditor(null)} sx={{ height: 44, borderRadius: 1.5 }}>
                Hủy
              </ErgButton>
              <ErgButton variant="contained" startIcon={<EditIcon fontSize="small" />} onClick={saveEditor} sx={{ height: 44, borderRadius: 1.5 }}>
                Lưu
              </ErgButton>
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function nextClassification(current: Classification): Classification {
  if (current === "A") return "B";
  if (current === "B") return "C";
  if (current === "C") return "D";
  if (current === "D") return "E";
  return "A";
}

function classificationSx(classification: Classification) {
  const tone = classification === "A" ? "success" : classification === "B" ? "info" : classification === "C" || classification === "D" ? "warning" : "error";
  return { borderColor: `${tone}.main`, bgcolor: `${tone}.light`, color: `${tone}.main` };
}

function scoreToneSx(value: string, maxScore: number) {
  const score = Number(value);
  if (!Number.isFinite(score)) return { bgcolor: "background.paper", color: "text.disabled" };
  const rate = score / maxScore;
  if (rate < 0.5) return { bgcolor: "error.light", color: "error.main" };
  if (rate >= 0.8) return { bgcolor: "success.light", color: "success.main" };
  return { bgcolor: "background.paper", color: "text.primary" };
}

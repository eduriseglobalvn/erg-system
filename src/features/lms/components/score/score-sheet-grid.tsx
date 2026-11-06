import { useRef, type ClipboardEvent, type KeyboardEvent, type MouseEvent } from "react";
import FilterList from "@mui/icons-material/FilterList";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import { ErgSelect } from "@/components/erg-mui";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

import { nextScoreCell } from "./score-paste";
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

const { color } = ergEnterpriseTokens;
const cellBorder = `1px solid ${color.border}`;

const thSx = {
  bgcolor: color.surfaceSubtle,
  border: cellBorder,
  borderTop: "none",
  p: 1,
  position: "sticky",
  textAlign: "center",
  top: 0,
  typography: "caption",
  fontWeight: "fontWeightMedium",
  zIndex: 1,
} as const;
const tdSx = { border: cellBorder, p: 0.5, textAlign: "center" } as const;

/** Excel-like score grid: Tab / Enter / arrows move between editable cells; a block copied from Excel can be pasted. */
export function ScoreSheetGrid({ controller }: { controller: ScoreSheetController }) {
  const gridRef = useRef<HTMLTableElement>(null);
  const editable = controller.editableColumns;
  const size = { rows: controller.filteredStudents.length, cols: editable.length };

  function focusCell(row: number, col: number) {
    gridRef.current?.querySelector<HTMLInputElement>(`input[data-score-cell="${row}:${col}"]`)?.focus();
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, row: number, col: number) {
    const input = event.currentTarget;
    const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
    // Arrow left/right only leave the cell when the caret is already at the edge, like a spreadsheet in edit mode.
    if (horizontal && (event.key === "ArrowLeft" ? input.selectionStart !== 0 : input.selectionEnd !== input.value.length)) return;
    const next = nextScoreCell({ row, col }, event.key, size, event.shiftKey);
    // Leaving the cell (focus move or blur) commits the score through onBlur.
    if (!next) {
      if (event.key === "Enter") input.blur();
      return;
    }
    event.preventDefault();
    focusCell(next.row, next.col);
  }

  function onCellPaste(event: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>, row: number, col: number) {
    if (controller.pasteScores(row, col, event.clipboardData.getData("text/plain"))) event.preventDefault();
  }

  return (
    <Box
      ref={controller.tableScrollRef}
      sx={{ bgcolor: "background.paper", border: cellBorder, borderRadius: 2, flex: 1, minHeight: 0, overflow: "auto" }}
    >
      <Box component="table" ref={gridRef} sx={{ borderCollapse: "collapse", minWidth: 800, typography: "body2", width: "100%" }}>
        <thead>
          <Box component="tr">
            <Box component="th" sx={{ ...thSx, width: 48 }}>STT</Box>
            <Box component="th" sx={{ ...thSx, width: 200 }}>Học sinh</Box>
            <Box component="th" sx={{ ...thSx, width: 80 }}>Điểm +/-</Box>
            <Box component="th" sx={{ ...thSx, width: 100 }}>
              Xếp loại <FilterList fontSize="inherit" sx={{ verticalAlign: "middle" }} />
            </Box>
            {controller.scoreColumns.map((column) => (
              <Box
                component="th"
                key={column.id}
                sx={{ ...thSx, width: 140, ...(column.kind === "offline" && { bgcolor: color.warningSoft, color: ergEnterpriseTokens.statusTint.warning.color }) }}
              >
                <Tooltip title={`Điểm tối đa: ${column.maxScore}`}>
                  <span>{column.label}</span>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </thead>
        <tbody>
          {controller.measuredVirtualRows.map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const student = controller.filteredStudents[rowIndex];
            if (!student) return null;
            const classification = controller.getClassification(student);
            const isDisabled = (controller.studentStates[student.id] ?? "active") === "disabled";
            const studentName = controller.studentNameFor(student);

            return (
              <Box component="tr" key={student.id} sx={{ height: virtualRow.end - virtualRow.start, opacity: isDisabled ? 0.5 : 1 }}>
                <Box component="td" sx={{ ...tdSx, width: 48 }}>{rowIndex + 1}</Box>
                <Box component="td" sx={{ ...tdSx, textAlign: "left", width: 200 }}>
                  <Box
                    component="button"
                    onClick={() => controller.openStudentDetail(student)}
                    onContextMenu={(event: MouseEvent) => {
                      event.preventDefault();
                      controller.setContextMenu({ x: event.clientX, y: event.clientY, student });
                    }}
                    sx={{ background: "none", border: "none", color: isDisabled ? color.textSoft : "primary.main", cursor: "pointer", fontFamily: "inherit", fontWeight: "fontWeightMedium", p: 0, textAlign: "left", typography: "body2" }}
                  >
                    {studentName}
                  </Box>
                </Box>
                <Box component="td" sx={{ ...tdSx, width: 80 }}>
                  <InputBase
                    inputProps={{ "aria-label": `${studentName} · Điểm +/-`, style: { textAlign: "center" } }}
                    onChange={(event) => controller.updateBonusScore(student.id, event.target.value)}
                    sx={{ border: cellBorder, borderRadius: 1, px: 0.5, width: "100%" }}
                    value={controller.bonusScores[student.id] ?? ""}
                  />
                </Box>
                <Box component="td" sx={{ ...tdSx, width: 100 }}>
                  <ErgSelect
                    size="small"
                    fullWidth={false}
                    value={classification}
                    onChange={(event) => controller.requestClassificationChange(student, event.target.value as Classification)}
                    options={classificationOptions.map((option) => ({ value: option, label: option }))}
                    slotProps={{ select: { SelectDisplayProps: { "aria-label": `Xếp loại ${studentName}` } } }}
                    sx={{
                      minWidth: 72,
                      "& .MuiOutlinedInput-root": { bgcolor: getClassificationBg(classification) },
                      "& .MuiOutlinedInput-root fieldset": { borderColor: getClassificationBorder(classification) },
                      "& .MuiSelect-select": { color: getClassificationColor(classification), py: 0.5, typography: "caption", fontWeight: "fontWeightMedium" },
                    }}
                  />
                </Box>
                {controller.scoreColumns.map((column, columnIndex) => {
                  const attempts = controller.attemptsFor(student, column, rowIndex, columnIndex);
                  const latest = attempts[0];
                  const score = controller.manualScores[`${column.id}:${student.id}`] ?? (latest ? formatScore(latest.score) : "");
                  const editableCol = editable.findIndex((item) => item.id === column.id);
                  return (
                    <Box
                      component="td"
                      key={column.id}
                      sx={{ ...tdSx, bgcolor: column.kind === "offline" ? color.surfaceSubtle : latest ? getScoreBg(latest.score, column.maxScore) : "background.paper", width: 140 }}
                    >
                      {editableCol >= 0 ? (
                        <InputBase
                          inputProps={{
                            "aria-label": `${studentName} · ${column.label}`,
                            "data-score-cell": `${rowIndex}:${editableCol}`,
                            inputMode: "decimal",
                            onPaste: (event: ClipboardEvent<HTMLInputElement>) => onCellPaste(event, rowIndex, editableCol),
                            style: { textAlign: "center" },
                          }}
                          onBlur={() => controller.commitScore(column.id, student.id)}
                          onChange={(event) => controller.updateManualScore(column.id, student.id, event.target.value)}
                          onFocus={(event) => event.target.select()}
                          onKeyDown={(event) => onCellKeyDown(event, rowIndex, editableCol)}
                          placeholder="-"
                          sx={{ border: cellBorder, borderRadius: 1, px: 0.5, width: "100%" }}
                          value={score}
                        />
                      ) : latest ? (
                        <Tooltip title={`${latest.duration} · ${latest.takenAt} · ${attempts.length} lần`}>
                          <Box component="span" sx={{ fontWeight: "fontWeightMedium" }}>{formatScore(latest.score)}</Box>
                        </Tooltip>
                      ) : <Box component="span" sx={{ color: color.textSoft }}>-</Box>}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </tbody>
      </Box>
    </Box>
  );
}

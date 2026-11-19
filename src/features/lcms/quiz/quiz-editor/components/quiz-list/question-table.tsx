import AddIcon from "@mui/icons-material/Add";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSearchField } from "@/components/erg-mui/erg-form";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { readSlideReadiness } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/slide-question";
import { useI18n } from "@/platform/i18n";
import { QuestionTableRow, type QuestionListRow } from "./question-table-row";

type Filter = "all" | "missing";

/** The questions of the open topic's quiz, or of every topic in "Tất cả" (`topicLabel` null: view only). */
export function QuestionTable({ rows, topicLabel, onOpenRow, onAdd, onMove, onImportExcel }: {
  rows: QuestionListRow[];
  topicLabel: string | null;
  onOpenRow: (row: QuestionListRow) => void;
  onAdd: () => void;
  /** Move the checked questions of the open quiz to another level/topic. */
  onMove?: (slideIds: string[]) => void;
  onImportExcel?: () => void;
}) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const assessed = useMemo(() => rows.map((row) => ({ row, readiness: readSlideReadiness(row.slide, t) })), [rows, t]);
  const needle = search.trim().toLowerCase();
  const shown = assessed.filter(
    ({ row, readiness }) => (filter === "all" || !readiness.ready) && (!needle || row.slide.title.toLowerCase().includes(needle)),
  );
  const showTopic = topicLabel === null;
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  // Only ids still in the list count: switching topic or moving the questions leaves stale ones behind.
  const picked = showTopic || !onMove ? [] : rows.filter((row) => checked.has(row.slide.id)).map((row) => row.slide.id);
  const selectable = !showTopic && Boolean(onMove);
  const toggle = (id: string) => setChecked((current) => {
    const next = new Set(current);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const allShown = shown.length > 0 && shown.every(({ row }) => checked.has(row.slide.id));
  const headers = ["#", "Câu hỏi", ...(showTopic ? ["Chủ đề"] : []), "Dạng", "Mức sẵn sàng", "Máy chủ"];

  const toolbar = (
    <Box sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1, p: 2 }}>
      {(["all", "missing"] as const).map((value) => (
        <Chip
          aria-pressed={filter === value}
          color={filter === value ? "primary" : "default"}
          key={value}
          label={value === "all" ? "Tất cả" : "Còn thiếu"}
          onClick={() => setFilter(value)}
          variant={filter === value ? "filled" : "outlined"}
        />
      ))}
      <ErgSearchField
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Tìm câu hỏi"
        slotProps={{ htmlInput: { "aria-label": "Tìm câu hỏi" } }}
        sx={{ maxWidth: 280 }}
        value={search}
      />
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, ml: "auto" }}>
        {picked.length ? (
          <ErgButton onClick={() => onMove?.(picked)} startIcon={<DriveFileMoveOutlinedIcon />} variant="outlined">
            {`Chuyển ${picked.length} câu sang…`}
          </ErgButton>
        ) : null}
        {showTopic ? (
          <Typography color="text.secondary" variant="body2">Chọn một chủ đề để thêm câu hỏi</Typography>
        ) : (
          <>
          {onImportExcel ? (
            <ErgButton onClick={onImportExcel} startIcon={<UploadFileOutlinedIcon />} variant="outlined">Nhập từ Excel</ErgButton>
          ) : null}
          <ErgButton onClick={onAdd} startIcon={<AddIcon />} variant="outlined">
            {`Thêm câu hỏi vào “${topicLabel}”`}
          </ErgButton>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <ErgDataTableShell sx={{ flex: 1, minWidth: 0 }} toolbar={toolbar}>
      <ErgTable>
        <TableHead>
          <TableRow>
            {selectable ? (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allShown}
                  disabled={!shown.length}
                  onChange={() => setChecked(allShown ? new Set() : new Set(shown.map(({ row }) => row.slide.id)))}
                  slotProps={{ input: { "aria-label": "Chọn tất cả câu đang hiện" } }}
                />
              </TableCell>
            ) : null}
            {headers.map((header) => <TableCell key={header} sx={{ whiteSpace: "nowrap" }}>{header}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map(({ row, readiness }) => (
            <QuestionTableRow
              key={`${row.topic?.quizId ?? ""}:${row.slide.id}`}
              onOpen={() => onOpenRow(row)}
              onToggleSelect={selectable ? () => toggle(row.slide.id) : undefined}
              readiness={readiness}
              row={row}
              selected={checked.has(row.slide.id)}
              showTopic={showTopic}
            />
          ))}
        </TableBody>
      </ErgTable>
      {shown.length ? null : (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }} variant="body2">
          {rows.length ? "Không có câu hỏi phù hợp." : "Chưa có câu hỏi nào."}
        </Typography>
      )}
    </ErgDataTableShell>
  );
}

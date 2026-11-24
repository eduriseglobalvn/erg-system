import AddIcon from "@mui/icons-material/Add";
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import type { RowBankEntry } from "@/features/lcms/quiz/quiz-editor/hooks/use-level-bank-questions";
import { useI18n } from "@/platform/i18n";
import { QuestionTableRow, type QuestionListRow } from "./question-table-row";
import { RandomPickDialog } from "./random-pick-dialog";

type Filter = "all" | "missing";

// Slide ids repeat across quizzes, so in "Tất cả" a row is told apart by its quiz too.
const rowKey = (row: QuestionListRow) => `${row.topic?.quizId ?? ""}:${row.slide.id}`;

/** The questions of the open topic's quiz, or of every topic in "Tất cả" (`topicLabel` null). */
export function QuestionTable({ rows, topicLabel, highlightSlideId, topics, onAssignTopic, onOpenRow, onAdd, onMove, onImportExcel, usage, onCreatePackage }: {
  rows: QuestionListRow[];
  topicLabel: string | null;
  /** The question just added: tinted so it is easy to spot at the top. */
  highlightSlideId?: string | null;
  /** "Tất cả": the topics a question without one can be put in. */
  topics?: readonly { id: string; label: string }[];
  onAssignTopic?: (slideId: string, topic: { id: string; label: string }) => void;
  onOpenRow: (row: QuestionListRow) => void;
  onAdd: () => void;
  /** Move the checked questions of the open quiz to another level/topic. */
  onMove?: (slideIds: string[]) => void;
  onImportExcel?: () => void;
  /** "Đã dùng": each row's bank row and how many packages hold it. */
  usage?: ReadonlyMap<QuestionListRow, RowBankEntry | null>;
  /** "Tạo gói bài tập" from the checked rows; `onDone` clears the selection once the package is made. */
  onCreatePackage?: (rows: QuestionListRow[], onDone: () => void) => void;
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
  const [randomOpen, setRandomOpen] = useState(false);
  const canMove = !showTopic && Boolean(onMove);
  const selectable = canMove || Boolean(onCreatePackage);
  // Only rows still in the list count: switching topic or moving the questions leaves stale keys behind.
  const picked = selectable ? rows.filter((row) => checked.has(rowKey(row))) : [];
  const toggle = (id: string) => setChecked((current) => {
    const next = new Set(current);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const allShown = shown.length > 0 && shown.every(({ row }) => checked.has(rowKey(row)));
  const headers = ["#", "Câu hỏi", ...(showTopic ? ["Chủ đề"] : []), "Dạng", "Mức sẵn sàng", ...(usage ? ["Đã dùng"] : []), "Máy chủ"];

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
        {selectable ? (
          <ErgButton disabled={!shown.length} onClick={() => setRandomOpen(true)} startIcon={<CasinoOutlinedIcon />} variant="outlined">Bốc ngẫu nhiên…</ErgButton>
        ) : null}
        {onImportExcel ? (
          <ErgButton onClick={onImportExcel} startIcon={<UploadFileOutlinedIcon />} variant="outlined">Nhập từ Excel</ErgButton>
        ) : null}
        <ErgButton onClick={onAdd} startIcon={<AddIcon />} variant="outlined">
          {showTopic ? "Thêm câu hỏi" : `Thêm câu hỏi vào “${topicLabel}”`}
        </ErgButton>
      </Box>
    </Box>
  );
  const selectionBar = picked.length ? (
    <Box sx={{ alignItems: "center", bgcolor: "action.selected", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1, px: 2, py: 1 }}>
      <Typography sx={{ fontWeight: "fontWeightMedium", mr: 1 }} variant="body2">{`Đã chọn ${picked.length} câu`}</Typography>
      <Button onClick={() => setChecked(new Set())} size="small" variant="text">Bỏ chọn</Button>
      {canMove ? (
        <Button onClick={() => onMove?.(picked.map((row) => row.slide.id))} size="small" variant="outlined">Chuyển chủ đề</Button>
      ) : null}
      {onCreatePackage ? (
        <Button onClick={() => onCreatePackage(picked, () => setChecked(new Set()))} size="small" variant="outlined">Tạo gói bài tập</Button>
      ) : null}
    </Box>
  ) : null;

  return (
    <ErgDataTableShell sx={{ flex: 1, minWidth: 0 }} toolbar={<>{toolbar}{selectionBar}</>}>
      <ErgTable>
        <TableHead>
          <TableRow>
            {selectable ? (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allShown}
                  disabled={!shown.length}
                  onChange={() => setChecked(allShown ? new Set() : new Set(shown.map(({ row }) => rowKey(row))))}
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
              highlighted={row.groupId !== null && row.slide.id === highlightSlideId}
              key={rowKey(row)}
              onAssignTopic={row.groupId && onAssignTopic && topics?.length ? (topic) => onAssignTopic(row.slide.id, topic) : undefined}
              onOpen={() => onOpenRow(row)}
              onToggleSelect={selectable ? () => toggle(rowKey(row)) : undefined}
              packages={usage ? (usage.get(row)?.packages ?? 0) : undefined}
              readiness={readiness}
              row={row}
              selected={checked.has(rowKey(row))}
              showTopic={showTopic}
              topics={topics}
            />
          ))}
        </TableBody>
      </ErgTable>
      {shown.length ? null : (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }} variant="body2">
          {rows.length ? "Không có câu hỏi phù hợp." : "Chưa có câu hỏi nào."}
        </Typography>
      )}
      {randomOpen ? (
        <RandomPickDialog
          candidates={shown.map(({ row, readiness }) => ({ key: rowKey(row), ready: readiness.ready }))}
          onClose={() => setRandomOpen(false)}
          onPick={(keys) => {
            setChecked(new Set(keys));
            setRandomOpen(false);
          }}
        />
      ) : null}
    </ErgDataTableShell>
  );
}

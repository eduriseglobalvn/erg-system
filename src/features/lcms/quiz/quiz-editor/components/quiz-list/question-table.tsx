import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
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
export function QuestionTable({ rows, topicLabel, onOpenRow, onAdd }: {
  rows: QuestionListRow[];
  topicLabel: string | null;
  onOpenRow: (row: QuestionListRow) => void;
  onAdd: () => void;
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
      <Box sx={{ ml: "auto" }}>
        {showTopic ? (
          <Typography color="text.secondary" variant="body2">Chọn một chủ đề để thêm câu hỏi</Typography>
        ) : (
          <ErgButton onClick={onAdd} startIcon={<AddIcon />} variant="outlined">
            {`Thêm câu hỏi vào “${topicLabel}”`}
          </ErgButton>
        )}
      </Box>
    </Box>
  );

  return (
    <ErgDataTableShell sx={{ flex: 1, minWidth: 0 }} toolbar={toolbar}>
      <ErgTable>
        <TableHead>
          <TableRow>
            {headers.map((header) => <TableCell key={header}>{header}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {shown.map(({ row, readiness }) => (
            <QuestionTableRow key={`${row.topic?.quizId ?? ""}:${row.slide.id}`} onOpen={() => onOpenRow(row)} readiness={readiness} row={row} showTopic={showTopic} />
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

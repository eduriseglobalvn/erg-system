import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import {
  parseQuestionMatrix,
  QUESTION_IMPORT_TYPE_LABEL,
  QUESTION_TEMPLATE_EXAMPLES,
  QUESTION_TEMPLATE_GUIDE,
  QUESTION_TEMPLATE_HEADERS,
  type QuestionImportLabels,
  type QuestionImportRow,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([[...QUESTION_TEMPLATE_HEADERS], ...QUESTION_TEMPLATE_EXAMPLES]);
  sheet["!cols"] = QUESTION_TEMPLATE_HEADERS.map((_, index) => ({ wch: index === 1 ? 48 : index === 9 ? 36 : 16 }));
  XLSX.utils.book_append_sheet(workbook, sheet, "Câu hỏi");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(QUESTION_TEMPLATE_GUIDE), "Hướng dẫn");
  XLSX.writeFile(workbook, "mau-nhap-cau-hoi.xlsx");
}

function QuestionExcelImportDialog({ topicLabel, labels, createId, onClose, onImport }: {
  topicLabel: string;
  labels: QuestionImportLabels;
  createId: () => string;
  onClose: () => void;
  onImport: (questions: QuestionBankQuestion[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const valid = rows.flatMap((row) => (row.question ? [row.question] : []));
  const invalidCount = rows.length - valid.length;

  async function readFile(file: File) {
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
      const matrix = sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) : [];
      const result = parseQuestionMatrix(matrix, labels, createId);
      setRows(result.rows);
      setFileError(result.error);
    } catch {
      setRows([]);
      setFileError("Không đọc được file. Hãy lưu lại dạng .xlsx rồi thử lại.");
    }
  }

  return (
    <ErgDialog
      open
      maxWidth="md"
      title={`Nhập câu hỏi từ Excel vào “${topicLabel}”`}
      description="Tải file mẫu, điền mỗi dòng một câu, rồi chọn file. Các dòng lỗi được bỏ qua; sửa trong file rồi nhập lại."
      onClose={onClose}
      actions={(
        <>
          <Button onClick={onClose} variant="text">Huỷ</Button>
          <ErgButton
            disabled={!valid.length}
            onClick={() => {
              onImport(valid);
              toast.success(`Đã thêm ${valid.length} câu vào “${topicLabel}”.`);
              onClose();
            }}
            variant="contained"
          >
            {valid.length ? `Nhập ${valid.length} câu` : "Nhập"}
          </ErgButton>
        </>
      )}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => void downloadTemplate()} startIcon={<DownloadOutlinedIcon />} variant="outlined">Tải file mẫu</Button>
          <Button onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">
            {fileName ? "Chọn file khác" : "Chọn file Excel"}
          </Button>
          <input
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void readFile(file);
            }}
            ref={inputRef}
            type="file"
          />
        </Box>
        {fileName ? <Typography color="text.secondary" variant="body2">{fileName}</Typography> : null}
        {fileError ? <Alert severity="error">{fileError}</Alert> : null}
        {rows.length ? (
          <Alert severity={invalidCount ? "warning" : "success"}>
            {`${valid.length} câu hợp lệ${invalidCount ? `, ${invalidCount} dòng lỗi sẽ bị bỏ qua` : ""}.`}
          </Alert>
        ) : null}
        {rows.length ? (
          <Stack component="ol" divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} sx={{ border: 1, borderColor: "divider", borderRadius: 1, listStyle: "none", m: 0, maxHeight: 360, overflow: "auto", p: 0 }}>
            {rows.map((row) => (
              <Box component="li" key={row.rowNumber} sx={{ display: "flex", gap: 1.5, px: 2, py: 1 }}>
                <Typography color="text.secondary" sx={{ flexShrink: 0, width: 56 }} variant="body2">{`Dòng ${row.rowNumber}`}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ overflowWrap: "anywhere" }} variant="body2">
                    {row.stem || "(trống)"}
                  </Typography>
                  <Typography color={row.error ? "error" : "text.secondary"} variant="caption">
                    {row.error ?? (row.type ? QUESTION_IMPORT_TYPE_LABEL[row.type] : "")}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </ErgDialog>
  );
}

/** "Nhập từ Excel" for the open topic: returns the opener (undefined in "Tất cả") and the dialog to render. */
export function useQuestionExcelImport({ topicLabel, labels, createId, onImport }: {
  topicLabel: string | null;
  labels: Omit<QuestionImportLabels, "topic">;
  createId: (prefix: string) => string;
  onImport: (questions: QuestionBankQuestion[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = open && topicLabel !== null ? (
    <QuestionExcelImportDialog
      createId={() => createId("xlsx-question")}
      labels={{ ...labels, topic: topicLabel }}
      onClose={() => setOpen(false)}
      onImport={onImport}
      topicLabel={topicLabel}
    />
  ) : null;
  return { openImport: topicLabel === null ? undefined : () => setOpen(true), dialog };
}

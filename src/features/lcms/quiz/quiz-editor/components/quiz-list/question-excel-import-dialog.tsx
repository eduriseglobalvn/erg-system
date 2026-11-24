import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import {
  matchSheetsToTopics,
  parseQuestionMatrix,
  QUESTION_IMPORT_TYPE_LABEL,
  QUESTION_TEMPLATE_EXAMPLES,
  QUESTION_TEMPLATE_GUIDE,
  QUESTION_TEMPLATE_GUIDE_SHEET,
  QUESTION_TEMPLATE_HEADERS,
  type QuestionImportLabels,
  type QuestionImportRow,
  topicSheetNames,
  withTypeDropdown,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import";
import { moveQuestionsToTopic } from "@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic";
import type { QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { createQuizSlideFromBankQuestion, unlinkFromBank } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

type ImportTopic = { id: string; label: string };
/** One sheet's questions; `topic` is null when the sheet matches no topic (all-topics mode only). */
type ImportSection = { sheetName: string; topic: ImportTopic | null; rows: QuestionImportRow[]; error: string | null };
type ImportBatch = { topic: ImportTopic | null; questions: QuestionBankQuestion[] };

const COLUMN_WIDTHS = QUESTION_TEMPLATE_HEADERS.map((_, index) => ({ wch: index === 1 ? 44 : index === 8 ? 40 : index === 9 ? 30 : 18 }));

/** A sheet of the all-topics template for questions that get no topic; they stay in "Tất cả". */
const NO_TOPIC_SHEET = "Chưa có chủ đề";

/** One question sheet with the examples, or (all topics) one empty sheet per topic, one for no topic, plus an example sheet. */
async function downloadTemplate(topics: readonly ImportTopic[] | null) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const questionSheet = (rows: string[][]) => {
    const sheet = XLSX.utils.aoa_to_sheet([[...QUESTION_TEMPLATE_HEADERS], ...rows]);
    sheet["!cols"] = COLUMN_WIDTHS;
    return sheet;
  };
  const names = topics ? [...topicSheetNames(topics.map((topic) => topic.label)), NO_TOPIC_SHEET, "Ví dụ"] : ["Câu hỏi"];
  names.forEach((name, index) =>
    XLSX.utils.book_append_sheet(workbook, questionSheet(!topics || index === names.length - 1 ? QUESTION_TEMPLATE_EXAMPLES : []), name));
  const guide = XLSX.utils.aoa_to_sheet(QUESTION_TEMPLATE_GUIDE);
  guide["!cols"] = [{ wch: 18 }, { wch: 48 }, { wch: 56 }];
  XLSX.utils.book_append_sheet(workbook, guide, QUESTION_TEMPLATE_GUIDE_SHEET);
  const file = withTypeDropdown(XLSX, XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer, names.length);
  const url = URL.createObjectURL(new Blob([file], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = topics ? "mau-nhap-cau-hoi-theo-chu-de.xlsx" : "mau-nhap-cau-hoi.xlsx";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const normalizeSheet = (name: string) => name.trim().toLowerCase();
const validQuestions = (rows: readonly QuestionImportRow[]) => rows.flatMap((row) => (row.question ? [row.question] : []));

function ImportRowList({ sections, showTopic }: { sections: readonly ImportSection[]; showTopic: boolean }) {
  return (
    <Stack component="ol" sx={{ border: 1, borderColor: "divider", borderRadius: 1, listStyle: "none", m: 0, maxHeight: 360, overflow: "auto", p: 0 }}>
      {sections.map((section) => (
        <Box component="li" key={section.sheetName}>
          {showTopic ? (
            <Typography sx={{ bgcolor: "action.hover", px: 2, py: 0.75 }} variant="subtitle2">
              {`${section.topic?.label ?? `${section.sheetName} → Tất cả (chưa có chủ đề)`} · ${validQuestions(section.rows).length} câu`}
            </Typography>
          ) : null}
          <Stack component="ol" divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />} sx={{ listStyle: "none", m: 0, p: 0 }}>
            {section.rows.map((row) => (
              <Box component="li" key={row.rowNumber} sx={{ display: "flex", gap: 1.5, px: 2, py: 1 }}>
                <Typography color="text.secondary" sx={{ flexShrink: 0, width: 56 }} variant="body2">{`Dòng ${row.rowNumber}`}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ overflowWrap: "anywhere" }} variant="body2">
                    {row.stem || "(trống)"}
                  </Typography>
                  <Typography color={row.error ? "error" : row.warning ? "info.main" : "text.secondary"} sx={{ display: "block" }} variant="caption">
                    {row.error ?? [row.type ? QUESTION_IMPORT_TYPE_LABEL[row.type] : "", row.warning].filter(Boolean).join(" · ")}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

function QuestionExcelImportDialog({ topicLabel, topics, labels, createId, onClose, onImport }: {
  /** The open topic; null in "Tất cả", where each sheet goes to the topic it is named after, or stays in "Tất cả". */
  topicLabel: string | null;
  topics: readonly ImportTopic[];
  labels: Omit<QuestionImportLabels, "topic">;
  createId: () => string;
  onClose: () => void;
  onImport: (batches: ImportBatch[]) => Promise<void> | void;
}) {
  const allTopics = topicLabel === null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [sections, setSections] = useState<ImportSection[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const usable = sections.filter((section) => section.rows.length);
  const valid = usable.flatMap((section) => validQuestions(section.rows));
  const invalidCount = usable.reduce((sum, section) => sum + section.rows.length, 0) - valid.length;
  const unmatched = allTopics ? usable.filter((section) => !section.topic && normalizeSheet(section.sheetName) !== normalizeSheet(NO_TOPIC_SHEET)) : [];
  const usedTopics = new Set(usable.filter((section) => section.topic && validQuestions(section.rows).length).map((section) => section.topic!.id)).size;
  const looseCount = usable.filter((section) => !section.topic).reduce((sum, section) => sum + validQuestions(section.rows).length, 0);
  const where = [usedTopics ? `${usedTopics} chủ đề` : "", looseCount ? `${looseCount} câu chưa có chủ đề ở Tất cả` : ""].filter(Boolean).join(", ");
  const questionOnly = usable.flatMap((section) => section.rows.filter((row) => row.question && row.warning));
  const questionOnlyTypes = [...new Set(questionOnly.map((row) => QUESTION_IMPORT_TYPE_LABEL[row.type!]))];

  async function readFile(file: File) {
    setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const matrixOf = (name: string) => {
        const sheet = workbook.Sheets[name];
        return sheet ? XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) : [];
      };
      if (!allTopics) {
        const sheetName = workbook.SheetNames[0] ?? "";
        const result = parseQuestionMatrix(matrixOf(sheetName), { ...labels, topic: topicLabel }, createId);
        setSections([{ sheetName, topic: null, rows: result.rows, error: result.error }]);
        setFileError(result.error);
        return;
      }
      const next = matchSheetsToTopics(workbook.SheetNames, topics).map(({ sheetName, topic }) => {
        const result = parseQuestionMatrix(matrixOf(sheetName), { ...labels, topic: topic?.label ?? "" }, createId);
        return { sheetName, topic, rows: result.rows, error: result.error };
      });
      setSections(next);
      setFileError(next.some((section) => section.rows.length) ? null : "File không có câu hỏi nào. Hãy dùng file mẫu: mỗi chủ đề một sheet, tên sheet là tên chủ đề.");
    } catch {
      setSections([]);
      setFileError("Không đọc được file. Hãy lưu lại dạng .xlsx rồi thử lại.");
    }
  }

  async function confirm() {
    setSaving(true);
    try {
      await onImport(usable.map((section) => ({ topic: section.topic, questions: validQuestions(section.rows) })).filter((batch) => batch.questions.length));
      toast.success(allTopics ? `Đã thêm ${valid.length} câu (${where}).` : `Đã thêm ${valid.length} câu vào “${topicLabel}”.`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Chưa nhập được câu hỏi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErgDialog
      open
      maxWidth="md"
      title={allTopics ? "Nhập câu hỏi từ Excel theo chủ đề" : `Nhập câu hỏi từ Excel vào “${topicLabel}”`}
      description={allTopics
        ? `File mẫu có sẵn mỗi chủ đề một sheet, tên sheet là tên chủ đề. Điền câu hỏi vào sheet của chủ đề đó (mỗi dòng một câu, chọn loại ở cột A) rồi chọn file. Câu ở sheet “${NO_TOPIC_SHEET}” hoặc sheet không trùng tên chủ đề nào vào Tất cả, chọn chủ đề sau. Sheet Ví dụ và Hướng dẫn không được nhập. Dòng lỗi được bỏ qua.`
        : "Tải file mẫu, chọn loại câu ở cột A (danh sách thả xuống), điền mỗi dòng một câu rồi chọn file. Cách điền từng loại có ở trang Hướng dẫn trong file mẫu. Dòng lỗi được bỏ qua; sửa trong file rồi nhập lại."}
      onClose={saving ? () => undefined : onClose}
      actions={(
        <>
          <Button disabled={saving} onClick={onClose} variant="text">Huỷ</Button>
          <ErgButton disabled={!valid.length} loading={saving} onClick={() => void confirm()} variant="contained">
            {valid.length ? `Nhập ${valid.length} câu` : "Nhập"}
          </ErgButton>
        </>
      )}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => void downloadTemplate(allTopics ? topics : null)} startIcon={<DownloadOutlinedIcon />} variant="outlined">Tải file mẫu</Button>
          <Button disabled={saving} onClick={() => inputRef.current?.click()} startIcon={<UploadFileOutlinedIcon />} variant="outlined">
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
        {usable.length ? (
          <Alert severity={invalidCount ? "warning" : "success"}>
            {`${valid.length} câu hợp lệ${allTopics && where ? ` (${where})` : ""}${invalidCount ? `, ${invalidCount} dòng lỗi sẽ bị bỏ qua` : ""}.`}
          </Alert>
        ) : null}
        {unmatched.length ? (
          <Alert severity="info">
            {`Sheet ${unmatched.map((section) => `“${section.sheetName}”`).join(", ")} không trùng tên chủ đề nào nên câu ở đó vào Tất cả, chưa có chủ đề. Chọn chủ đề cho từng câu ở cột Chủ đề, hoặc đổi tên sheet cho đúng tên chủ đề rồi chọn lại file.`}
          </Alert>
        ) : null}
        {questionOnly.length ? (
          <Alert severity="info">
            {`${questionOnly.length} câu loại ${questionOnlyTypes.join(", ")} chỉ nhập phần câu hỏi, đáp án trong file bị bỏ qua. ` +
              "Sau khi nhập, mở từng câu trong trình soạn để thêm đáp án (vẽ vùng đúng, thêm danh sách lựa chọn hoặc chỉnh thang)."}
          </Alert>
        ) : null}
        {usable.length ? <ImportRowList sections={usable} showTopic={allTopics} /> : null}
      </Stack>
    </ErgDialog>
  );
}

/**
 * "Nhập từ Excel": into the open topic's quiz (the editor state), or in "Tất cả" into each topic's own quiz,
 * saved on the server the way "Chuyển sang…" does, one topic after another; questions with no topic go into
 * the open topicless quiz (the editor state), last, so a failed topic leaves nothing half-added there.
 */
export function useQuestionExcelImport({ topicLabel, topics, subjectId, levelId, labels, createId, questionDefaults, onImport }: {
  topicLabel: string | null;
  topics: readonly ImportTopic[];
  subjectId: string;
  levelId: string | null;
  labels: Omit<QuestionImportLabels, "topic">;
  createId: (prefix: string) => string;
  questionDefaults: QuizProjectSettings["questionDefaults"];
  onImport: (questions: QuestionBankQuestion[]) => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const available = topicLabel !== null || Boolean(levelId);

  async function importBatches(batches: ImportBatch[]) {
    if (topicLabel !== null) return onImport(batches.flatMap((batch) => batch.questions));
    const done: string[] = [];
    for (const { topic, questions } of batches) {
      if (!topic || !levelId) continue;
      const slides = questions.map((question) => unlinkFromBank(createQuizSlideFromBankQuestion(question, createId, questionDefaults)));
      try {
        await moveQuestionsToTopic(queryClient, { subjectId, levelId, topicId: topic.id, topicLabel: topic.label }, slides);
      } catch (error) {
        const reason = error instanceof Error && error.message ? ` (${error.message})` : "";
        // Topics saved before the failure stay saved: say which, so they are not imported twice.
        throw new Error(`Chưa nhập được chủ đề “${topic.label}”${reason}.${done.length ? ` Đã nhập xong ${done.join(", ")}; khi nhập lại hãy bỏ các sheet này.` : ""}`);
      }
      done.push(`“${topic.label}”`);
    }
    const loose = batches.flatMap((batch) => (batch.topic ? [] : batch.questions));
    if (loose.length) onImport(loose);
  }

  const dialog = open ? (
    <QuestionExcelImportDialog
      createId={() => createId("xlsx-question")}
      labels={labels}
      onClose={() => setOpen(false)}
      onImport={importBatches}
      topicLabel={topicLabel}
      topics={topics}
    />
  ) : null;
  return { openImport: available ? () => setOpen(true) : undefined, dialog };
}

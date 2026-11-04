import { useState } from "react";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { parsePortableResult } from "@/features/elearning/portable-exam/api/portable-exam-result";
import {
  importPortableResult,
  portableImportErrorMessage,
  type ImportedPortableAttempt,
} from "@/features/elearning/portable-exam/api/portable-result-import-api";
import type { ApiRequestOptions } from "@/lib/api-client";

type ImportRow =
  | { name: string; status: "done"; result: ImportedPortableAttempt }
  | { name: string; status: "error"; message: string };

const scoreText = (result: ImportedPortableAttempt) =>
  `${result.score}/${result.maxScore} điểm${result.late ? " (nộp muộn)" : ""}`;

/** Uploads `.ergresult` files collected offline (student: own result; teacher: results gathered from a class). */
export function PortableResultImportCard({ portal }: { portal: ApiRequestOptions["portal"] }) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    const next: ImportRow[] = [];
    // One file at a time: each is graded and recorded server-side, and a failure must not hide the others.
    for (const file of files) {
      try {
        const parsed = await parsePortableResult(await file.text());
        next.push({ name: file.name, status: "done", result: await importPortableResult(parsed, { portal }) });
      } catch (error) {
        next.push({ name: file.name, status: "error", message: portableImportErrorMessage(error) });
      }
    }
    setRows(next);
    setBusy(false);
  }

  return (
    <Card variant="outlined" sx={{ borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography component="h2" variant="subtitle1">Nộp kết quả lên hệ thống</Typography>
            <Typography color="text.secondary" variant="body2">
              Dùng cho tệp kết quả (đuôi .ergresult) tạo sau khi làm bài không cần mạng. Hệ thống chấm lại bài từ câu trả lời
              trong tệp; điểm ghi trong tệp không được dùng. Nộp cùng một tệp nhiều lần chỉ tạo một lượt làm bài.
            </Typography>
          </Stack>
          <Button
            component="label"
            disabled={busy}
            startIcon={<UploadFileRoundedIcon />}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
            variant="outlined"
          >
            Nộp kết quả lên hệ thống
            <input accept=".ergresult,application/json" hidden multiple onChange={(event) => void handleFiles(event)} type="file" />
          </Button>
          {busy ? <LinearProgress aria-label="Đang nộp kết quả" /> : null}
          {rows.map((row, index) =>
            row.status === "done" ? (
              <Alert key={`${index}:${row.name}`} severity={row.result.duplicate ? "info" : "success"}>
                {row.name}: {row.result.duplicate ? "đã nộp trước đó" : "đã nộp"} — {scoreText(row.result)}
                {row.result.status === "needs_review" ? ", chờ giáo viên chấm các câu tự luận" : ""}.
              </Alert>
            ) : (
              <Alert key={`${index}:${row.name}`} severity="error">{row.name}: {row.message}</Alert>
            ),
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

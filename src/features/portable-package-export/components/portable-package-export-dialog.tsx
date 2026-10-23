import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DesktopWindowsRoundedIcon from "@mui/icons-material/DesktopWindowsRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useExportQuizEditorBundleMutation } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorApiPortal } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import type { PortableExamPackageEnvelope } from "@/features/elearning/portable-exam/types/portable-exam-types";
import {
  downloadPortablePackage,
  portablePackageFileName,
  publishedDesktopArtifactUrl,
} from "@/features/portable-package-export/api/portable-package-download";

export type PortablePackageQuiz = {
  id: string;
  title: string;
  status?: string | null;
  currentVersionLabel?: string | null;
};

export function PortablePackageExportDialog({
  onClose,
  open,
  portal,
  quiz,
}: {
  onClose: () => void;
  open: boolean;
  portal: QuizEditorApiPortal;
  quiz: PortablePackageQuiz;
}) {
  const exportMutation = useExportQuizEditorBundleMutation();
  const [bundle, setBundle] = useState<PortableExamPackageEnvelope | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const isPublished = !quiz.status || ["published", "ready"].includes(quiz.status.toLowerCase());
  const releaseUrl = bundle ? publishedDesktopArtifactUrl(bundle) : undefined;
  const fileName = useMemo(
    () => portablePackageFileName(quiz.title, bundle?.versionLabel ?? quiz.currentVersionLabel ?? undefined),
    [bundle?.versionLabel, quiz.currentVersionLabel, quiz.title],
  );
  const buildCommand = `bun run portable:build -- --package "${fileName}"`;

  useEffect(() => {
    setBundle(null);
    setError("");
    setCopied(false);
  }, [open, quiz.id]);

  async function handleDownloadPackage() {
    setError("");
    try {
      const nextBundle = await exportMutation.mutateAsync({ portal, quizId: quiz.id });
      downloadPortablePackage(nextBundle, quiz.title);
      setBundle(nextBundle);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo gói portable.");
    }
  }

  async function handleCopyCommand() {
    try {
      await navigator.clipboard.writeText(buildCommand);
      setCopied(true);
    } catch {
      setError("Trình duyệt không cho phép sao chép lệnh build.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="portable-package-title">
      <DialogTitle id="portable-package-title" sx={{ pb: 1 }}>
        <Typography component="span" sx={{ display: "block", fontSize: 20, fontWeight: 850 }}>Đóng gói bài kiểm tra portable</Typography>
        <Typography component="span" color="text.secondary" sx={{ display: "block", fontSize: 13.5, fontWeight: 600, mt: 0.5 }}>
          {quiz.title}{quiz.currentVersionLabel ? ` · ${quiz.currentVersionLabel}` : ""}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {!isPublished ? <Alert severity="warning">Chỉ phiên bản đã xuất bản mới có thể đóng gói và ký.</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {bundle ? <Alert icon={<CheckCircleRoundedIcon />} severity="success">Gói đề đã ký và tải xuống thành công.</Alert> : null}

          <PackageStep
            icon={<ArchiveRoundedIcon color="primary" />}
            title="1. Gói đề đã ký (.ergquiz)"
            description="Chứa câu hỏi, đáp án theo chế độ chấm và toàn bộ media ngoại tuyến. Không chứa giao diện Admin/Teacher/Student."
            action={(
              <Button
                disabled={!isPublished || exportMutation.isPending}
                onClick={() => void handleDownloadPackage()}
                startIcon={<DownloadRoundedIcon />}
                variant="contained"
              >
                {exportMutation.isPending ? "Đang ký và đóng gói…" : "Tạo và tải .ergquiz"}
              </Button>
            )}
          />

          <PackageStep
            icon={<DesktopWindowsRoundedIcon color="primary" />}
            title="2. Ứng dụng portable EXE / DMG"
            description="Release runner dùng đúng gói .ergquiz ở bước 1 để tạo ứng dụng fullscreen chỉ có đề thi. Khóa ký riêng tư không bao giờ đi qua trình duyệt."
            action={releaseUrl ? (
              <Button component="a" href={releaseUrl} rel="noopener noreferrer" target="_blank" startIcon={<DownloadRoundedIcon />} variant="outlined">
                Tải artifact đã phát hành
              </Button>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                <Box component="code" sx={{ bgcolor: "grey.100", borderRadius: 1, color: "text.secondary", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, px: 1.25, py: 1 }}>
                  {buildCommand}
                </Box>
                <Button disabled={!bundle} onClick={() => void handleCopyCommand()} startIcon={<ContentCopyRoundedIcon />} size="small" variant="outlined">
                  {copied ? "Đã sao chép" : "Sao chép lệnh"}
                </Button>
              </Stack>
            )}
            status={releaseUrl ? <Chip color="success" label="Đã phát hành" size="small" /> : <Chip label="Chờ release runner" size="small" variant="outlined" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

function PackageStep({ action, description, icon, status, title }: {
  action: ReactNode;
  description: string;
  icon: ReactNode;
  status?: ReactNode;
  title: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ alignItems: "center", bgcolor: "rgba(15,108,189,0.08)", borderRadius: 1.5, display: "flex", height: 40, justifyContent: "center", width: 40 }}>{icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 820 }}>{title}</Typography>{status}
          </Stack>
          <Typography color="text.secondary" sx={{ fontSize: 13.5, lineHeight: 1.6, mt: 0.5 }}>{description}</Typography>
          <Box sx={{ mt: 1.5 }}>{action}</Box>
        </Box>
      </Stack>
    </Paper>
  );
}

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import {
  portableAccessPasswordHash,
  portableAccessPasswordProblem,
} from "@/features/elearning/portable-exam/api/portable-exam-password";
import { useExportQuizEditorBundleMutation } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorApiPortal } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import type { PortableExamPackageEnvelope } from "@/features/elearning/portable-exam/types/portable-exam-types";
import {
  downloadPortablePackage,
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
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [triedExport, setTriedExport] = useState(false);
  const passwordProblem = portableAccessPasswordProblem(password, confirmation);
  const isPublished = !quiz.status || ["published", "ready"].includes(quiz.status.toLowerCase());
  const releaseUrl = bundle ? publishedDesktopArtifactUrl(bundle) : undefined;

  useEffect(() => {
    setBundle(null);
    setError("");
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setTriedExport(false);
  }, [open, quiz.id]);

  async function handleDownloadPackage() {
    setError("");
    setTriedExport(true);
    if (passwordProblem) return;
    try {
      const nextBundle = await exportMutation.mutateAsync({ portal, quizId: quiz.id });
      // The password is salted with the package id; without one the lock could not be checked, so nothing is downloaded.
      if (!nextBundle.packageId) throw new Error("Gói đề thiếu mã gói nên không gắn được mật khẩu. Hãy thử xuất lại.");
      // Only the hash travels in the file; the typed password is never stored or sent anywhere.
      const accessPasswordHash = await portableAccessPasswordHash(nextBundle.packageId, password);
      downloadPortablePackage({ ...nextBundle, accessPasswordHash }, quiz.title);
      setBundle(nextBundle);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo gói portable.");
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
              <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Typography variant="subtitle2">Đặt mật khẩu mở bài</Typography>
                <ErgTextField
                  autoComplete="new-password"
                  helperText="Bắt buộc, ít nhất 4 ký tự. Học sinh phải nhập đúng mật khẩu này mới mở được bài."
                  label="Mật khẩu mở bài"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  size="small"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            edge="end"
                            onClick={() => setShowPassword((shown) => !shown)}
                            size="small"
                          >
                            {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <ErgTextField
                  autoComplete="new-password"
                  error={triedExport && Boolean(passwordProblem)}
                  helperText={triedExport && passwordProblem ? passwordProblem : "Nhập lại để chắc chắn không gõ nhầm."}
                  label="Nhập lại mật khẩu"
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                  size="small"
                  type={showPassword ? "text" : "password"}
                  value={confirmation}
                />
                <Button
                  disabled={!isPublished || exportMutation.isPending}
                  onClick={() => void handleDownloadPackage()}
                  startIcon={<DownloadRoundedIcon />}
                  variant="contained"
                >
                  {exportMutation.isPending ? "Đang ký và đóng gói…" : "Tạo và tải .ergquiz"}
                </Button>
              </Stack>
            )}
          />

          <PackageStep
            icon={<SendRoundedIcon color="primary" />}
            title="2. Gửi tệp cho học sinh"
            description="Gửi tệp .ergquiz vừa tải (Zalo, email, USB…). Học sinh cài ứng dụng ERG Exam Player một lần trên máy Windows, sau đó nhấp đúp vào tệp để làm bài, không cần mạng."
            action={releaseUrl ? (
              <Button component="a" href={releaseUrl} rel="noopener noreferrer" target="_blank" startIcon={<DownloadRoundedIcon />} variant="outlined">
                Tải ứng dụng đã phát hành
              </Button>
            ) : null}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}><Button variant="outlined" onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

function PackageStep({ action, description, icon, title }: {
  action: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ alignItems: "center", bgcolor: "rgba(0, 113, 227,0.08)", borderRadius: 1.5, display: "flex", height: 40, justifyContent: "center", width: 40 }}>{icon}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 820 }}>{title}</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ fontSize: 13.5, lineHeight: 1.6, mt: 0.5 }}>{description}</Typography>
          {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
        </Box>
      </Stack>
    </Paper>
  );
}

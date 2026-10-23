import { useEffect, useState } from "react";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PlayerShellRuntime } from "@/components/quiz/player-shell-runtime";
import { loadPortableQuizPackage } from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import { PortableExamVerificationError } from "@/features/elearning/portable-exam/types/portable-exam-types";
import type { QuizPackage } from "@/lib/types";

export type PortableArtifactState =
  | { status: "loading" }
  | { status: "ready"; quizPackage: QuizPackage }
  | { status: "error"; message: string };

export function PortableArtifactApp({ packageUrl = "/portable-exam.ergquiz" }: { packageUrl?: string }) {
  const [state, setState] = useState<PortableArtifactState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadEmbeddedPortablePackage(packageUrl)
      .then((quizPackage) => {
        if (!cancelled) setState({ status: "ready", quizPackage });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", message: portableArtifactErrorMessage(error) });
      });
    return () => { cancelled = true; };
  }, [packageUrl]);

  if (state.status === "loading") {
    return (
      <Box component="main" aria-busy="true" sx={{ bgcolor: "background.default", minHeight: "100dvh", p: { xs: 2, md: 4 } }}>
        <Stack spacing={2} sx={{ mx: "auto", maxWidth: 1120 }}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height="calc(100dvh - 144px)" />
          <Typography aria-live="polite" sx={{ position: "absolute", height: 1, width: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Đang kiểm tra gói bài thi…
          </Typography>
        </Stack>
      </Box>
    );
  }

  if (state.status === "error") {
    return (
      <Box component="main" sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", minHeight: "100dvh", justifyContent: "center", p: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 540, textAlign: "center" }}>
          <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 48 }} />
          <Typography component="h1" variant="h5" sx={{ fontWeight: 850 }}>Không thể mở bài thi</Typography>
          <Typography color="text.secondary">{state.message}</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="main" data-portable-artifact="question-only" sx={{ bgcolor: "#f3f6ff", minHeight: "100dvh", p: { xs: 0.5, md: 1 } }}>
      <PlayerShellRuntime
        portableOffline={state.quizPackage.gradingMode === "client-first"}
        portablePackage={state.quizPackage}
        runtimePortal="elearning"
        startImmediately
      />
    </Box>
  );
}

export async function loadEmbeddedPortablePackage(packageUrl: string) {
  const response = await fetch(packageUrl, { cache: "no-store", credentials: "omit" });
  if (!response.ok) throw new Error(`PACKAGE_HTTP_${response.status}`);
  const bytes = await response.arrayBuffer();
  const { quizPackage } = await loadPortableQuizPackage(bytes, {
    persist: false,
    runtimeVersion: import.meta.env.VITE_PORTABLE_RUNTIME_VERSION ?? "1.0.0",
    source: "tauri-cache",
  });
  return quizPackage;
}

function portableArtifactErrorMessage(error: unknown) {
  const code = error instanceof PortableExamVerificationError ? error.code : undefined;
  if (code === "KEY_NOT_TRUSTED") return "Khóa phát hành của gói bài thi không được tin cậy.";
  if (code === "INVALID_SIGNATURE" || code === "INVALID_CONTENT_HASH") return "Nội dung bài thi đã bị thay đổi hoặc không còn toàn vẹn.";
  if (code === "EXPIRED" || code === "REVOKED") return "Gói bài thi đã hết hạn hoặc bị thu hồi.";
  if (code === "MIN_RUNTIME") return "Gói bài thi yêu cầu phiên bản ứng dụng mới hơn.";
  return "Gói bài thi không hợp lệ, bị thiếu hoặc không tương thích với phiên bản này.";
}

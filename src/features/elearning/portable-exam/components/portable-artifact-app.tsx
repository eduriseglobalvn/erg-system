import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";

import { PortablePasswordStep } from "@/features/elearning/portable-exam/components/portable-password-step";
import { PlayerShellRuntime } from "@/features/lcms/quiz/player/player-shell-runtime";
import { loadPortableQuizPackage } from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import { portableArtifactErrorMessage } from "@/features/elearning/portable-exam/components/portable-exam-error-message";
import type { QuizPackage } from "@/domain/quiz/types";
import { PortableExamVerificationError } from "@/features/elearning/portable-exam/types/portable-exam-types";
import { readOpenedExamFile } from "@/platform/desktop/opened-exam-file";

export type PortableArtifactState =
  | { status: "loading" }
  | { status: "pick" }
  | { status: "ready"; quizPackage: QuizPackage; passwordHash?: string }
  | { status: "error"; message: string };

export function PortableArtifactApp({ packageUrl = "/portable-exam.ergquiz" }: { packageUrl?: string }) {
  const [state, setState] = useState<PortableArtifactState>({ status: "loading" });
  const [unlocked, setUnlocked] = useState(false);
  // A fresh attempt per launch: lab PCs are shared, so the next student must not resume the previous one's attempt.
  const [attemptAccountId] = useState(() => `portable:${crypto.randomUUID()}`);

  useEffect(() => {
    let cancelled = false;
    loadEmbeddedPortablePackage(packageUrl)
      .then((opened) => {
        if (!cancelled) setState(opened ? { status: "ready", ...opened } : { status: "pick" });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: "error", message: portableArtifactErrorMessage(error) });
      });
    return () => { cancelled = true; };
  }, [packageUrl]);

  function handlePickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setState({ status: "loading" });
    openPortablePackage(file)
      .then((opened) => setState({ status: "ready", ...opened }))
      .catch((error: unknown) => setState({ status: "error", message: portableArtifactErrorMessage(error) }));
  }

  if (state.status === "pick") {
    return (
      <Box component="main" sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", minHeight: "100dvh", justifyContent: "center", p: 3 }}>
        <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 540, textAlign: "center" }}>
          <Typography component="h1" variant="h5">ERG Exam Player</Typography>
          <Typography color="text.secondary">Mở tệp bài thi (.ergquiz) giáo viên gửi để bắt đầu làm bài. Lần sau có thể nhấp đúp vào tệp để mở thẳng.</Typography>
          <ExamFilePickButton label="Chọn tệp bài thi" onChange={handlePickFile} />
        </Stack>
      </Box>
    );
  }

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
          <ExamFilePickButton label="Chọn tệp khác" onChange={handlePickFile} />
        </Stack>
      </Box>
    );
  }

  if (state.passwordHash && !unlocked) {
    return (
      <PortablePasswordStep
        onUnlock={() => setUnlocked(true)}
        packageId={state.quizPackage.id}
        passwordHash={state.passwordHash}
        title={state.quizPackage.quiz.title}
      />
    );
  }

  return (
    // A fixed height lets the player's full-height layout stretch to the window instead of hugging its content;
    // the app window is the whole screen, so the player's inner area drops the web's 1600px centring and uses the full width,
    // and the question plus its answers sit in one centred column instead of the web's left-aligned reading cap.
    <Box
      component="main"
      data-portable-artifact="question-only"
      sx={{
        bgcolor: "background.default",
        height: "100dvh",
        "& main": { px: 3 },
        "& .quiz-player-shell": { "--quiz-answer-max-width": "100%", "--quiz-answer-wide-max-width": "100%" },
        "& .quiz-player-question-body > *": { maxWidth: 1120, mx: "auto", width: "100%" },
      }}
    >
      <PlayerShellRuntime
        identityAccountId={attemptAccountId}
        portableOffline={state.quizPackage.gradingMode === "client-first"}
        portablePackage={state.quizPackage}
        runtimePortal="elearning"
        startImmediately
      />
    </Box>
  );
}

function ExamFilePickButton({ label, onChange }: { label: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <ErgButton component="label" sx={{ minHeight: 44 }}>
      {label}
      <input hidden type="file" accept=".ergquiz,application/json" onChange={onChange} />
    </ErgButton>
  );
}

/** Null when there is nothing to play yet: the shared Player was started without a file. */
export async function loadEmbeddedPortablePackage(packageUrl: string) {
  // The shared Exam Player bundles no exam: it plays the .ergquiz Windows opened it with; per-exam builds embed theirs.
  const bytes = (await readOpenedExamFile()) ?? (await fetchEmbeddedPackage(packageUrl));
  return bytes ? openPortablePackage(bytes) : null;
}

async function openPortablePackage(bytes: ArrayBuffer | File) {
  const { quizPackage, verified } = await loadPortableQuizPackage(bytes, {
    persist: false,
    runtimeVersion: import.meta.env.VITE_PORTABLE_RUNTIME_VERSION ?? "1.0.0",
    source: "tauri-cache",
  });
  // The app has no server session: a server-graded package would only fail at submit, after the student did the whole exam.
  if (quizPackage.gradingMode !== "client-first") {
    throw new PortableExamVerificationError("NOT_OFFLINE_GRADABLE", "Package is graded on the server.");
  }
  return { quizPackage, passwordHash: verified.envelope.accessPasswordHash };
}

async function fetchEmbeddedPackage(packageUrl: string) {
  const response = await fetch(packageUrl, { cache: "no-store", credentials: "omit" });
  // The Tauri asset server answers a missing file with index.html, a plain server with 404.
  if (response.status === 404 || response.headers.get("content-type")?.includes("text/html")) return null;
  if (!response.ok) throw new Error(`PACKAGE_HTTP_${response.status}`);
  return response.arrayBuffer();
}

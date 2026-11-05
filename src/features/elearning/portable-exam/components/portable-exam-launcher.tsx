import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  loadPortableQuizPackage,
  type LoadPortableExamPackageOptions,
} from "@/features/elearning/portable-exam/api/portable-exam-runtime";
import { portableArtifactErrorMessage } from "@/features/elearning/portable-exam/components/portable-exam-error-message";
import type { PortableExamScope } from "@/features/elearning/portable-exam/types/portable-exam-types";
import type { QuizPackage } from "@/domain/quiz/types";

export type PortableExamLauncherProps = {
  onPackageReady: (quizPackage: QuizPackage) => void;
  scope?: PortableExamScope;
  verification?: Omit<LoadPortableExamPackageOptions, "persist" | "scope">;
};

/**
 * Shared Teacher/Student import surface. It only loads a signed package and
 * hands the normalised QuizPackage to the existing player; it never renders a
 * second question UI and it never handles credentials.
 */
export function PortableExamLauncher({ onPackageReady, scope, verification }: PortableExamLauncherProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    async function handleLaunchFile(event: Event) {
      const customEvent = event as CustomEvent<{ file: File }>;
      const file = customEvent.detail?.file;
      if (!file) return;

      setState("loading");
      setMessage(null);
      try {
        const result = await loadPortableQuizPackage(file, {
          ...verification,
          persist: Boolean(scope),
          scope,
        });
        onPackageReady(result.quizPackage);
        setState("ready");
        setMessage(`Đã xác thực ${result.quizPackage.quiz.title}. Gói bài thi sẵn sàng để bắt đầu.`);
      } catch (error) {
        setState("error");
        setMessage(portableArtifactErrorMessage(error));
      }
    }

    window.addEventListener("erg:pwa:launch-file", handleLaunchFile);
    return () => {
      window.removeEventListener("erg:pwa:launch-file", handleLaunchFile);
    };
  }, [onPackageReady, scope, verification]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setState("loading");
    setMessage(null);
    try {
      const result = await loadPortableQuizPackage(file, {
        ...verification,
        persist: Boolean(scope),
        scope,
      });
      onPackageReady(result.quizPackage);
      setState("ready");
      setMessage(`Đã xác thực ${result.quizPackage.quiz.title}. Gói bài thi sẵn sàng để bắt đầu.`);
    } catch (error) {
      setState("error");
      setMessage(portableArtifactErrorMessage(error));
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" component="h2">
              Mở bài thi từ tệp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dùng khi giáo viên gửi cho bạn tệp bài thi (đuôi .ergquiz).
            </Typography>
            <Typography component="ol" variant="body2" color="text.secondary" sx={{ m: 0, pl: 2.5 }}>
              <li>Bấm "Chọn tệp bài thi" bên dưới.</li>
              <li>Chọn tệp .ergquiz mà giáo viên đã gửi.</li>
              <li>Chờ hệ thống kiểm tra tệp, sau đó bắt đầu làm bài.</li>
            </Typography>
          </Stack>
          <Button
            component="label"
            variant="contained"
            disabled={state === "loading"}
            sx={{ alignSelf: "flex-start", minHeight: 44 }}
          >
            Chọn tệp bài thi
            <input
              ref={inputRef}
              hidden
              type="file"
              accept=".ergquiz,application/json"
              onChange={handleFileChange}
            />
          </Button>
          {state === "loading" ? <LinearProgress aria-label="Đang xác thực gói bài thi" /> : null}
          {state === "ready" && message ? <Alert severity="success">{message}</Alert> : null}
          {state === "error" && message ? <Alert severity="error">{message} Bạn có thể chọn lại tệp để thử lại.</Alert> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}


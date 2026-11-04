import { useMemo, useState } from "react";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PlayerShellRuntime } from "@/features/lcms/quiz/player/player-shell-runtime";
import {
  PortableExamLauncher,
  type PortableExamScope,
} from "@/features/elearning/portable-exam";
import type { QuizPackage } from "@/domain/quiz/types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";

export type PortableExamPageProps = {
  workspace: "TEACHER" | "STUDENT";
};

export function PortableExamPage({ workspace }: PortableExamPageProps) {
  const [quizPackage, setQuizPackage] = useState<QuizPackage | null>(null);
  const viewer = getCurrentElearningViewerSession();
  const scope = useMemo<PortableExamScope | undefined>(() => {
    const accountId = viewer?.id?.trim();
    if (!accountId) return undefined;
    return {
      accountId,
      tenantId: getDefaultTenantId(),
      workspace,
    };
  }, [viewer?.id, workspace]);

  const studentPortalKind = "elearning" as const;
  const teacherPortalKind = "lms" as const;
  const activeRuntimePortal = workspace === "STUDENT" ? studentPortalKind : teacherPortalKind;

  if (quizPackage) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 0.5, md: 1 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: { xs: 1, md: 2 }, py: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBack />}
            variant="outlined"
            onClick={() => setQuizPackage(null)}
          >
            Chọn bài khác
          </Button>
          <Typography variant="caption" color="text.secondary">
            Gói bài thi đã xác thực
          </Typography>
        </Stack>
        <PlayerShellRuntime
          portableOffline={quizPackage.gradingMode === "client-first"}
          portablePackage={quizPackage}
          runtimePortal={activeRuntimePortal}
          welcomeMeta={{
            courseLabel: quizPackage.quiz.title,
            reviewContent: quizPackage.quiz.description,
            subjectLabel: "Bài thi từ tệp",
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Button
              href={workspace === "STUDENT" ? "/student" : "/teacher"}
              size="small"
              startIcon={<ArrowBack />}
              sx={{ alignSelf: "flex-start" }}
              variant="text"
            >
              Về trang chủ
            </Button>
            <Typography variant="h1">Làm bài thi từ tệp</Typography>
            <Typography color="text.secondary">
              Mở tệp bài thi giáo viên đã gửi. Bài làm dùng cùng trình làm bài như trên web.
            </Typography>
          </Stack>
          <PortableExamLauncher onPackageReady={setQuizPackage} scope={scope} />
        </Stack>
      </Container>
    </Box>
  );
}

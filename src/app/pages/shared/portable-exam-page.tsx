import { useMemo, useState } from "react";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PlayerShellRuntime } from "@/components/quiz/player-shell-runtime";
import {
  PortableExamLauncher,
  type PortableExamScope,
} from "@/features/elearning/portable-exam";
import type { QuizPackage } from "@/lib/types";
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

  if (quizPackage) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6ff", p: { xs: 0.5, md: 1 } }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: { xs: 1, md: 2 }, py: 1 }}>
          <Button
            size="small"
            startIcon={<ArrowBack />}
            variant="outlined"
            onClick={() => setQuizPackage(null)}
            sx={{ borderRadius: 1.5, fontWeight: 800 }}
          >
            Chọn bài khác
          </Button>
          <Typography variant="caption" color="text.secondary">
            {workspace === "STUDENT" ? "Student workspace" : "Teacher workspace"} · Gói đã xác thực
          </Typography>
        </Stack>
        <PlayerShellRuntime
          portableOffline={quizPackage.gradingMode === "client-first"}
          portablePackage={quizPackage}
          runtimePortal={workspace === "STUDENT" ? "elearning" : "lms"}
          welcomeMeta={{
            courseLabel: quizPackage.quiz.title,
            reviewContent: quizPackage.quiz.description,
            subjectLabel: "Portable exam",
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6ff", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 900, letterSpacing: 1 }}>
              ERG · {workspace === "STUDENT" ? "Student" : "Teacher"}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1 }}>
              Portable exam runtime
            </Typography>
            <Typography color="text.secondary">
              Mở tệp bài kiểm tra đã phát hành và sử dụng đúng Player chung với web/PWA.
            </Typography>
          </Stack>
          <PortableExamLauncher onPackageReady={setQuizPackage} scope={scope} />
        </Stack>
      </Container>
    </Box>
  );
}

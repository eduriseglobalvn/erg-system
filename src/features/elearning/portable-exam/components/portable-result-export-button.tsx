import { useState } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Button from "@mui/material/Button";

import type { PortableStudentIdentity } from "@/features/elearning/portable-exam/api/portable-exam-identity";
import {
  buildPortableResult,
  downloadPortableResult,
  portableResultFileName,
} from "@/features/elearning/portable-exam/api/portable-exam-result";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import type { Attempt, QuizPackage } from "@/domain/quiz/types";

/** 8.4.5: writes the `.ergresult` file the student hands to the teacher. */
export function PortableResultExportButton({ attempt, identity, quizPackage, session }: {
  attempt: Attempt;
  identity: PortableStudentIdentity;
  quizPackage: QuizPackage;
  session: LocalQuizAttemptSession;
}) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const file = await buildPortableResult({
        quizPackage,
        identity,
        attemptId: session.attemptId,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt ?? new Date().toISOString(),
        answers: session.answers,
        attempt,
      });
      downloadPortableResult(file, portableResultFileName(identity, quizPackage.quizId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button disabled={busy} onClick={() => void handleExport()} startIcon={<DownloadRoundedIcon />} variant="outlined">
      Tải kết quả
    </Button>
  );
}

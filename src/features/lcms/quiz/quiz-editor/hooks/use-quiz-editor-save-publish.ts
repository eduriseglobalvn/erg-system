import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import { usePublishQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorCreateInput, QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { resolveNewQuizScope } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import type { QuizDraftSyncStatus } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-sync-engine";
import type { useQuizDraftSync } from "@/features/lcms/quiz/quiz-editor/sync/use-quiz-draft-sync";

/** What the sync engine sends to create the quiz the first time a new draft reaches the server. */
export function buildQuizCreateInput({ doc, subjects, courseId, levelId, topicId }: {
  doc: QuizEditorDraftDocument;
  subjects: QuestionBankSubject[];
  courseId: string;
  levelId: string | null;
  topicId: string;
}): Omit<QuizEditorCreateInput, "idempotencyKey"> {
  const scope = resolveNewQuizScope(subjects, courseId, levelId, topicId);
  return {
    title: doc.settings.info?.title?.trim() || "Bài kiểm tra mới",
    subtitle: scope.subtitle,
    kind: "train",
    subjectId: scope.subjectId,
    levelId: scope.levelId,
    categoryId: scope.categoryId,
    questionIds: doc.tree.flatMap((g) => g.slides.map((s) => s.id)),
  };
}

function blockedReason(status: QuizDraftSyncStatus): string | null {
  if (status.kind === "offline") return "Cần có mạng để xuất bản.";
  if (status.kind === "conflict") return "Cần chọn bản để giữ trước khi xuất bản.";
  return null;
}

/** Publishes the whole quiz (the server compiles every question), after the last edit reached the server. */
export function useQuizEditorPublish({ sync, questionSlideIds, setSlidesPublished, onPublished }: {
  sync: ReturnType<typeof useQuizDraftSync>;
  questionSlideIds: string[];
  setSlidesPublished: (ids: string[]) => void;
  onPublished: () => void;
}): { handlePublish: () => Promise<void>; isPublishing: boolean; publishBlockedReason: string | null } {
  const publishMutation = usePublishQuizEditorDraftMutation();
  const [isPublishing, setIsPublishing] = useState(false);
  const publishingRef = useRef(false);
  // flushNow re-renders with the new status and docVersion before it resolves; read them from here, not the closure.
  const latest = useRef(sync);
  useLayoutEffect(() => {
    latest.current = sync;
  });
  const publishBlockedReason = blockedReason(sync.status);

  async function handlePublish() {
    if (publishBlockedReason || publishingRef.current) return;
    if (!questionSlideIds.length) {
      toast.error("Thêm ít nhất 1 câu hỏi trước khi xuất bản.");
      return;
    }
    publishingRef.current = true;
    setIsPublishing(true);
    try {
      await latest.current.flushNow();
      const { status, quizId, docVersion } = latest.current;
      if (status.kind !== "saved" || !quizId) {
        toast.error("Chưa gửi được thay đổi lên máy chủ nên chưa xuất bản.");
        return;
      }
      // Same key for the same draft version, so a retried click cannot publish twice.
      await publishMutation.mutateAsync({ quizId, docVersion, idempotencyKey: `quiz-editor-publish:${quizId}:${docVersion}` });
      // Publishing does not change the server draft's docVersion, so the engine's base stays as it is.
      setSlidesPublished(questionSlideIds);
      toast.success("Đã xuất bản bài kiểm tra.");
      onPublished();
    } catch {
      // The global mutation handler already shows the error.
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
    }
  }

  return { handlePublish, isPublishing, publishBlockedReason };
}

import { useLayoutEffect, useRef, useState, type SetStateAction } from "react";
import { toast } from "sonner";

import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import { usePublishQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorCreateInput, QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { resolveNewQuizScope } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import { recordPublished } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { QuizDraftSyncStatus } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-sync-engine";
import type { useQuizDraftSync } from "@/features/lcms/quiz/quiz-editor/sync/use-quiz-draft-sync";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** What the sync engine sends to create the quiz the first time a new draft reaches the server. */
export function buildQuizCreateInput({ doc, subjects, courseId, levelId, topicId }: {
  doc: QuizEditorDraftDocument;
  subjects: QuestionBankSubject[];
  courseId: string;
  levelId: string | null;
  topicId: string;
}): Omit<QuizEditorCreateInput, "idempotencyKey"> {
  const scope = resolveNewQuizScope(subjects, courseId, levelId, topicId);
  const title = doc.settings.info?.title?.trim();
  return {
    // A blank draft is titled "Bài kiểm tra mới"; a topic quiz takes the topic name until the teacher renames it.
    title: (title && title !== "Bài kiểm tra mới" ? title : scope.subtitle) || "Bài kiểm tra mới",
    subtitle: scope.subtitle,
    kind: "train",
    subjectId: scope.subjectId,
    levelId: scope.levelId,
    categoryId: scope.categoryId,
    questionIds: doc.tree.flatMap((g) => g.slides.map((s) => s.id)),
  };
}

function blockedReason(status: QuizDraftSyncStatus, questionCount: number): string | null {
  if (!questionCount) return "Chưa có câu hỏi để xuất bản.";
  if (status.kind === "offline") return "Cần có mạng để xuất bản.";
  if (status.kind === "conflict") return "Cần chọn bản để giữ trước khi xuất bản.";
  return null;
}

/** Publishes the whole quiz (the server compiles every question), after the last edit reached the server. */
export function useQuizEditorPublish({ sync, draftId, questionSlides, setSlidesPublished, updateQuizProject, onPublished }: {
  sync: ReturnType<typeof useQuizDraftSync>;
  /** Id of the server draft being edited: a fork starts a new draft whose docVersion counts from 0 again. */
  draftId: string;
  questionSlides: QuizEditorSlide[];
  setSlidesPublished: (ids: string[]) => void;
  updateQuizProject: (update: SetStateAction<QuizProjectSettings>) => void;
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
  const publishBlockedReason = blockedReason(sync.status, questionSlides.length);

  async function handlePublish() {
    if (publishBlockedReason || publishingRef.current) return;
    publishingRef.current = true;
    setIsPublishing(true);
    try {
      await latest.current.flushNow();
      const { status, quizId, docVersion, hasUnsyncedChanges } = latest.current;
      // A full device still publishes when every change reached the server.
      const sent = status.kind === "saved" || (status.kind === "storage-full" && !hasUnsyncedChanges);
      if (!sent || !quizId) {
        toast.error("Chưa gửi được thay đổi lên máy chủ nên chưa xuất bản.");
        return;
      }
      // Same key for the same draft version, so a retried click cannot publish twice.
      const idempotencyKey = `quiz-editor-publish:${quizId}:${draftId}:${docVersion}`;
      await publishMutation.mutateAsync({ quizId, docVersion, idempotencyKey });
      // Publishing does not change the server draft's docVersion, so the engine's base stays as it is.
      setSlidesPublished(questionSlides.map((slide) => slide.id));
      // The slides as clicked are what the flush sent. The new fingerprints reach the server with the next autosave.
      updateQuizProject((current) => recordPublished(current, questionSlides));
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

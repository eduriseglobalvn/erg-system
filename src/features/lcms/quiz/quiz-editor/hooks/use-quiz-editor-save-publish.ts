import { useLayoutEffect, useMemo, useRef, useState, type SetStateAction } from "react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client/errors";
import { useI18n } from "@/platform/i18n";

import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import { usePublishQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorCreateInput, QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { readinessLabel } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-readiness";
import { readSlideReadiness } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/slide-question";
import { resolveNewQuizScope } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import { fingerprintedSlides, recordPublished } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
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

export type NotReadyQuestion = { slideId: string; number: number; title: string; label: string };
/** What the server said when it refused to publish: its message, and the per-question lines it sent along. */
export type PublishFailure = { message: string; items: string[] };

/** `readinessOnly`: nothing but unfinished questions blocks it, so the button explains instead of going dead. */
function blockedReason(status: QuizDraftSyncStatus, questionCount: number, notReadyCount: number): { text: string; readinessOnly: boolean } | null {
  if (!questionCount) return { text: "Chưa có câu hỏi để xuất bản.", readinessOnly: false };
  if (status.kind === "offline") return { text: "Cần có mạng để xuất bản.", readinessOnly: false };
  if (status.kind === "conflict") return { text: "Cần chọn bản để giữ trước khi xuất bản.", readinessOnly: false };
  return notReadyCount ? { text: `Còn ${notReadyCount} câu chưa sẵn sàng`, readinessOnly: true } : null;
}

function toPublishFailure(error: unknown): PublishFailure {
  const details = error instanceof ApiClientError && Array.isArray(error.details) ? error.details : [];
  const items = details.flatMap((item: unknown) => {
    if (typeof item === "string") return [item];
    const message = item && typeof item === "object" ? (item as { message?: unknown }).message : null;
    return typeof message === "string" ? [message] : [];
  });
  return { message: error instanceof Error && error.message ? error.message : "Chưa xuất bản được. Thử lại sau.", items };
}

/** Publishes the whole quiz (the server compiles every question), after the last edit reached the server. */
export function useQuizEditorPublish({ sync, draftId, questionSlides, setSlidesPublished, updateQuizProject }: {
  sync: ReturnType<typeof useQuizDraftSync>;
  /** Id of the server draft being edited: a fork starts a new draft whose docVersion counts from 0 again. */
  draftId: string;
  questionSlides: QuizEditorSlide[];
  setSlidesPublished: (ids: string[]) => void;
  updateQuizProject: (update: SetStateAction<QuizProjectSettings>) => void;
}): {
  handlePublish: () => Promise<void>;
  isPublishing: boolean;
  publishBlockedReason: string | null;
  /** Blocked only because some questions are unfinished: the button explains instead of going dead. */
  publishReadinessOnly: boolean;
  notReady: NotReadyQuestion[];
  publishFailure: PublishFailure | null;
  dismissPublishFailure: () => void;
} {
  const { t } = useI18n();
  const publishMutation = usePublishQuizEditorDraftMutation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFailure, setPublishFailure] = useState<PublishFailure | null>(null);
  const publishingRef = useRef(false);
  // flushNow re-renders with the new status and docVersion before it resolves; read them from here, not the closure.
  const latest = useRef(sync);
  useLayoutEffect(() => {
    latest.current = sync;
  });
  // Intro and instruction slides stay in the draft but are never counted or listed.
  const questions = useMemo(() => fingerprintedSlides(questionSlides), [questionSlides]);
  const notReady = useMemo(
    () => questions.flatMap((slide, index) => {
      const readiness = readSlideReadiness(slide, t);
      return readiness.ready ? [] : [{ slideId: slide.id, number: index + 1, title: slide.title, label: readinessLabel(readiness) }];
    }),
    [questions, t],
  );
  const blocked = blockedReason(sync.status, questions.length, notReady.length);
  const publishBlockedReason = blocked?.text ?? null;
  const publishReadinessOnly = blocked?.readinessOnly ?? false;

  async function handlePublish() {
    if (publishBlockedReason || publishingRef.current) return;
    publishingRef.current = true;
    setIsPublishing(true);
    setPublishFailure(null);
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
      toast.success("Đã xuất bản");
    } catch (error) {
      // The mutation is silent: the server's reason is shown in place, not as a toast.
      setPublishFailure(toPublishFailure(error));
    } finally {
      publishingRef.current = false;
      setIsPublishing(false);
    }
  }

  return { handlePublish, isPublishing, publishBlockedReason, publishReadinessOnly, notReady, publishFailure, dismissPublishFailure: () => setPublishFailure(null) };
}

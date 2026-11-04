import { useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";

import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import {
  useCreateQuizEditorQuizMutation,
  usePublishQuizEditorDraftMutation,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { clearLocalQuizDraft, saveLocalQuizDraft } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft";
import {
  createClientIdempotencyKey,
  resolveNewQuizScope,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import type {
  QuizEditorGroup,
  QuizEditorSlide,
  QuizPlayerTemplate,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { getDefaultTenantId } from "@/lib/graphql-client";

/** Save-draft and publish flows. publishingRef blocks a double click from creating a second quiz. */
export function useQuizEditorSavePublish({
  effectiveQuizId,
  activeDraftKey,
  serverDraft,
  quizProject,
  playerTemplate,
  groups,
  questionManagerSlides,
  questionBankSubjects,
  selectedCourseId,
  selectedLevelId,
  selectedTopicId,
  hydratedDraftSignatureRef,
  setActiveQuizId,
  onQuizCreated,
  markAllAsSavedDraft,
  setSlidesPublished,
  onPublished,
}: {
  effectiveQuizId: string;
  activeDraftKey: string;
  serverDraft: QuizEditorDraftDocument | undefined;
  quizProject: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  groups: QuizEditorGroup[];
  questionManagerSlides: QuizEditorSlide[];
  questionBankSubjects: QuestionBankSubject[];
  selectedCourseId: string;
  selectedLevelId: string | null;
  selectedTopicId: string;
  hydratedDraftSignatureRef: MutableRefObject<string>;
  setActiveQuizId: (quizId: string | null) => void;
  onQuizCreated?: (quizId: string) => void;
  markAllAsSavedDraft: () => void;
  setSlidesPublished: (slideIds: string[]) => void;
  onPublished: () => void;
}) {
  const createQuizMutation = useCreateQuizEditorQuizMutation();
  const saveDraftMutation = useSaveQuizEditorDraftMutation();
  const publishDraftMutation = usePublishQuizEditorDraftMutation();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const publishingRef = useRef(false);

  async function createQuizForTree(tree: QuizEditorGroup[], idempotencyPrefix: string) {
    const scope = resolveNewQuizScope(questionBankSubjects, selectedCourseId, selectedLevelId, selectedTopicId);
    const created = await createQuizMutation.mutateAsync({
      title: quizProject.info?.title?.trim() || "Bài kiểm tra mới",
      subtitle: scope.subtitle,
      kind: "train",
      subjectId: scope.subjectId,
      levelId: scope.levelId,
      categoryId: scope.categoryId,
      questionIds: tree.flatMap((g) => g.slides.map((s) => s.id)),
      idempotencyKey: createClientIdempotencyKey(idempotencyPrefix),
    });
    setActiveQuizId(created.quizId);
    onQuizCreated?.(created.quizId);
    return created;
  }

  async function handleSaveDraft() {
    setIsSavingDraft(true);
    try {
      const updatedGroups = groups.map((g) => ({
        ...g,
        slides: g.slides.map((s) => ({
          ...s,
          status: s.status === "published" ? ("published" as const) : ("draft" as const),
        })),
      }));

      let targetQuizId = effectiveQuizId;
      let targetDocVersion = serverDraft?.docVersion ?? 0;

      if (!targetQuizId) {
        const created = await createQuizForTree(updatedGroups, "quiz-editor-create");
        targetQuizId = created.quizId;
        targetDocVersion = created.docVersion;
      }

      const saveResult = await saveDraftMutation.mutateAsync({
        quizId: targetQuizId,
        docVersion: targetDocVersion,
        settings: quizProject,
        playerTemplate,
        tree: updatedGroups,
      });

      const nextDocVersion = saveResult.docVersion ?? targetDocVersion + 1;
      hydratedDraftSignatureRef.current = `${targetQuizId}:${nextDocVersion}`;

      markAllAsSavedDraft();

      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), targetQuizId, {
        quizId: targetQuizId,
        draftId: serverDraft?.draftId ?? `server-${targetQuizId}`,
        docVersion: nextDocVersion,
        settings: quizProject,
        playerTemplate,
        tree: updatedGroups,
      });

      if (activeDraftKey && activeDraftKey !== targetQuizId) {
        clearLocalQuizDraft(getDefaultTenantId(), activeDraftKey);
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setLastSavedTime(timeStr);
      toast.success("Đã lưu bản nháp lên cơ sở dữ liệu máy chủ thành công.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu bản nháp lên máy chủ.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleOpenPublish(targetSlideIds?: string[]) {
    const idsToPublish = targetSlideIds && targetSlideIds.length > 0
      ? targetSlideIds
      : questionManagerSlides.map((s) => s.id);

    if (!idsToPublish.length) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi để xuất bản.");
      return;
    }
    if (publishingRef.current) return; // a second click must not create a second quiz
    publishingRef.current = true;
    try {
      const publishTree = groups.map((g) => ({
        ...g,
        slides: g.slides.map((s) =>
          idsToPublish.includes(s.id) ? { ...s, status: "published" as const } : s,
        ),
      }));

      let targetQuizId = effectiveQuizId;
      let targetDocVersion = serverDraft?.docVersion ?? 0;

      if (!targetQuizId) {
        const created = await createQuizForTree(publishTree, "quiz-editor-publish-create");
        targetQuizId = created.quizId;
        targetDocVersion = created.docVersion;
      }

      const savedDraft = await saveDraftMutation.mutateAsync({
        quizId: targetQuizId,
        docVersion: targetDocVersion,
        settings: quizProject,
        playerTemplate,
        tree: publishTree,
      });

      await publishDraftMutation.mutateAsync({
        quizId: targetQuizId,
        docVersion: savedDraft.docVersion,
        idempotencyKey: createClientIdempotencyKey(`quiz-editor-publish:${targetQuizId}:${savedDraft.docVersion}`),
      });

      const nextDocVersion = (savedDraft.docVersion ?? targetDocVersion) + 1;
      hydratedDraftSignatureRef.current = `${targetQuizId}:${nextDocVersion}`;

      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), targetQuizId, {
        quizId: targetQuizId,
        draftId: serverDraft?.draftId ?? `server-${targetQuizId}`,
        docVersion: nextDocVersion,
        settings: quizProject,
        playerTemplate,
        tree: publishTree,
      });

      setSlidesPublished(idsToPublish); // only mark published once the server accepted it
      toast.success(`Đã xuất bản thành công ${idsToPublish.length} câu hỏi.`);
      onPublished();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xuất bản thất bại.");
    } finally {
      publishingRef.current = false;
    }
  }

  return { isSavingDraft, lastSavedTime, setLastSavedTime, handleSaveDraft, handleOpenPublish };
}

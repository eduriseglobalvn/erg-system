import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PlayerTemplateDialog } from "@/features/lcms/quiz/quiz-editor/components/player-template-dialog";
import { QuestionEditorDialog } from "@/features/lcms/quiz/quiz-editor/components/question-editor-dialog";
import { QuestionManagerTable } from "@/features/lcms/quiz/quiz-editor/components/question-manager-table";
import { QuizEditorRibbon } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-ribbon";
import {
  SlidePreviewDialog,
  type SlidePreviewDialogMode,
} from "@/features/lcms/quiz/quiz-editor/components/slide-preview-dialog";
import {
  useCreateQuizEditorQuizMutation,
  usePublishQuizEditorDraftMutation,
  useQuizEditorDraftQuery,
  useQuizEditorWorkspaceQuery,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import {
  createEmptyQuizEditorGroups,
  createMockPlayerTemplate,
  createNewQuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/api/mock-quiz-editor-project";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useI18n } from "@/platform/i18n";
import type {
  QuestionCreationPreset,
  QuestionType,
  QuizEditorSlide,
  QuizProjectSettings,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { isQuestionManagerSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT, hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";
import {
  clearLocalQuizDraft,
  loadLocalQuizDraft,
  saveLocalQuizDraft,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import "@/features/lcms/quiz/quiz-editor/styles/classic-editor.css";

type CourseScopeOption = {
  id: string;
  label: string;
  meta: string;
};

type LevelScopeOption = {
  id: string;
  courseId: string;
  label: string;
  meta: string;
};

type TopicOption = {
  id: string;
  label: string;
  description: string;
  count: number;
};

const courseScopeOptions: CourseScopeOption[] = [
  {
    id: "ic3-gs6",
    label: "IC3 GS6",
    meta: "Digital Literacy · 3 levels · 36 chủ đề",
  },
  {
    id: "life-science-a2",
    label: "Khoa học đời sống A2",
    meta: "Bài 03 · Dinh dưỡng cân bằng",
  },
  {
    id: "teacher-method-foundation",
    label: "Phương pháp giảng dạy",
    meta: "Foundation · Thiết kế hoạt động học",
  },
];

const levelScopeOptions: LevelScopeOption[] = [
  {
    id: "ic3-gs6-level-1",
    courseId: "ic3-gs6",
    label: "Level 1",
    meta: "Máy tính căn bản, internet, công dân số",
  },
  {
    id: "ic3-gs6-level-2",
    courseId: "ic3-gs6",
    label: "Level 2",
    meta: "Ứng dụng văn phòng, cộng tác, dữ liệu",
  },
  {
    id: "ic3-gs6-level-3",
    courseId: "ic3-gs6",
    label: "Level 3",
    meta: "An toàn số, dữ liệu nâng cao, dự án",
  },
];

const emptyCourseScopeOption: CourseScopeOption = {
  id: "",
  label: "",
  meta: "",
};

function createClientIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

export function QuizEditorWorkspace({
  activeLeaf,
  quizId,
  onQuizCreated,
  pendingImportedQuestions = [],
  onImportedQuestionsHandled,
}: {
  activeLeaf: DashboardLeaf;
  quizId?: string | null;
  onQuizCreated?: (quizId: string) => void;
  pendingImportedQuestions?: QuestionBankQuestion[];
  onImportedQuestionsHandled?: () => void;
}) {
  void activeLeaf;
  const { t } = useI18n();
  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => quizId ?? null);

  useEffect(() => {
    if (quizId) {
      setActiveQuizId(quizId);
    }
  }, [quizId]);

  const [selectedCourseId, setSelectedCourseId] = useState(() => (hasApiBase() ? "" : courseScopeOptions[0]!.id));
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(() => (hasApiBase() ? null : levelScopeOptions[0]?.id ?? null));
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [playerTemplateOpen, setPlayerTemplateOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<SlidePreviewDialogMode | null>(null);
  const [importNoticeCount, setImportNoticeCount] = useState(0);
  const importedSignatureRef = useRef("");
  const hydratedDraftSignatureRef = useRef("");
  const draftReadyForRecoveryRef = useRef(false);

  const questionBankFilters = useMemo(
    () => ({
      levelId: selectedLevelId || undefined,
      page: 0,
      size: 50,
      status: "ready",
      subjectId: selectedCourseId || undefined,
      topicId: selectedTopicId === "all" ? undefined : selectedTopicId,
    }),
    [selectedCourseId, selectedLevelId, selectedTopicId],
  );
  const questionBankQuery = useQuestionBankWorkspaceQuery(undefined, questionBankFilters);
  const effectiveQuizId = activeQuizId ?? quizId ?? "";
  function isLegacyMockDraft(doc?: QuizEditorDraftDocument | null): boolean {
  if (!doc?.tree?.length) return false;
  const slides = doc.tree.flatMap((g) => g.slides);
  return slides.some((s) => s.id === "slide-elearning-json-intro" || s.id === "slide-matching" || s.id.startsWith("lcms-q") || s.id === "slide-intro-1");
}

const activeDraftKey = effectiveQuizId.trim()
    || (selectedCourseId ? `new-quiz:${selectedCourseId}:${selectedLevelId || "all"}` : "new-quiz:default");

  const initialLocalDraft = useMemo(() => {
    clearLocalQuizDraft(getDefaultTenantId(), "default-quiz-draft");
    const loaded = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), activeDraftKey)?.payload ?? null;
    if (isLegacyMockDraft(loaded)) {
      clearLocalQuizDraft(getDefaultTenantId(), activeDraftKey);
      return null;
    }
    return loaded;
  }, [activeDraftKey]);

  const quizEditorDraftQuery = useQuizEditorDraftQuery(effectiveQuizId);
  const createQuizMutation = useCreateQuizEditorQuizMutation();
  const saveDraftMutation = useSaveQuizEditorDraftMutation();
  const publishDraftMutation = usePublishQuizEditorDraftMutation();
  const workspaceQuery = useQuizEditorWorkspaceQuery({ size: 20 });
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const scopeMatchingDraft = useMemo(() => {
    const items = workspaceQuery.data?.quizzes.items;
    if (!items || items.length === 0 || !selectedCourseId) return null;

    if (selectedTopicId !== "all") {
      const topicMatch = items.find(
        (q) => q.status === "draft" && q.subjectId === selectedCourseId && (!selectedLevelId || q.levelId === selectedLevelId) && q.categoryId === selectedTopicId,
      );
      if (topicMatch) return topicMatch;
    }

    if (selectedLevelId) {
      const levelMatch = items.find(
        (q) => q.status === "draft" && q.subjectId === selectedCourseId && q.levelId === selectedLevelId,
      );
      if (levelMatch) return levelMatch;
    }

    return items.find((q) => q.status === "draft" && q.subjectId === selectedCourseId) ?? null;
  }, [selectedCourseId, selectedLevelId, selectedTopicId, workspaceQuery.data?.quizzes.items]);

  const recentServerDraft = scopeMatchingDraft;

  function handleOpenRecentDraft(targetId: string) {
    setActiveQuizId(targetId);
    onQuizCreated?.(targetId);
  }

  const {
    filteredGroups,
    groups,
    resultSlide,
    quizProject,
    playerTemplate,
    selectedThemeId,
    searchValue,
    selectedGroup,
    selectedNode,
    selectedSlide,
    totalSlides,
    setSearchValue,
    selectSlide,
    importQuestionBankQuestions,
    addQuestion,
    addIntroduction,
    duplicateSelected,
    deleteSelected,
    deleteSlides,
    duplicateSlides,
    markAllAsSavedDraft,
    setSlidesPublished,
    replaceSelectedSlide,
    updatePlayerTemplate,
    hydrateDraftDocument,
    setSelectedThemeId,
  } = useQuizEditorState(initialLocalDraft);

  function handleCreateNewQuiz() {
    setActiveQuizId(null);
    hydrateDraftDocument({
      quizId: "",
      draftId: "local-new-quiz",
      docVersion: 0,
      settings: createNewQuizProjectSettings("Bài kiểm tra mới"),
      playerTemplate: createMockPlayerTemplate(),
      tree: createEmptyQuizEditorGroups(),
    });
    setLastSavedTime(null);
  }

  // Do not auto-hijack editor with existing server draft on reload; user can click banner to open

  const activeKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (effectiveQuizId) return;

    if (activeKeyRef.current === activeDraftKey) return;
    activeKeyRef.current = activeDraftKey;

    const localDraft = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), activeDraftKey);
    if (localDraft?.payload && !isLegacyMockDraft(localDraft.payload)) {
      hydrateDraftDocument(localDraft.payload);
    } else {
      hydrateDraftDocument({
        quizId: activeDraftKey,
        draftId: `local-${activeDraftKey}`,
        docVersion: 0,
        settings: createNewQuizProjectSettings("Bài kiểm tra mới"),
        playerTemplate: createMockPlayerTemplate(),
        tree: createEmptyQuizEditorGroups(),
      });
    }
    draftReadyForRecoveryRef.current = true;
  }, [activeDraftKey, effectiveQuizId, hydrateDraftDocument]);

  useEffect(() => {
    if (!effectiveQuizId || !quizEditorDraftQuery.data) return;

    const draftSignature = `${quizEditorDraftQuery.data.quizId}:${quizEditorDraftQuery.data.docVersion}`;
    if (draftSignature === hydratedDraftSignatureRef.current) return;

    hydratedDraftSignatureRef.current = draftSignature;
    const localDraft = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), effectiveQuizId);
    const serverUpdatedAt = Date.parse(quizEditorDraftQuery.data.updatedAt ?? "");
    const localUpdatedAt = Date.parse(localDraft?.savedAt ?? "");
    hydrateDraftDocument(
      localDraft && (!Number.isFinite(serverUpdatedAt) || localUpdatedAt > serverUpdatedAt)
        ? localDraft.payload
        : quizEditorDraftQuery.data,
    );
    draftReadyForRecoveryRef.current = true;
  }, [effectiveQuizId, hydrateDraftDocument, quizEditorDraftQuery.data]);

  useEffect(() => {
    if (!draftReadyForRecoveryRef.current) return;
    const currentKey = effectiveQuizId || activeDraftKey;
    const timer = window.setTimeout(() => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), currentKey, {
        quizId: currentKey,
        draftId: quizEditorDraftQuery.data?.draftId ?? `local-${currentKey}`,
        docVersion: quizEditorDraftQuery.data?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [activeDraftKey, effectiveQuizId, groups, playerTemplate, quizEditorDraftQuery.data?.docVersion, quizEditorDraftQuery.data?.draftId, quizProject]);

  useEffect(() => {
    if (!draftReadyForRecoveryRef.current) return;
    const currentKey = effectiveQuizId || activeDraftKey;
    const persistRecoveryDraft = () => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), currentKey, {
        quizId: currentKey,
        draftId: quizEditorDraftQuery.data?.draftId ?? `local-${currentKey}`,
        docVersion: quizEditorDraftQuery.data?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    };
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
    window.addEventListener("pagehide", persistRecoveryDraft);
    window.addEventListener("beforeunload", persistRecoveryDraft);
    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
      window.removeEventListener("pagehide", persistRecoveryDraft);
      window.removeEventListener("beforeunload", persistRecoveryDraft);
    };
  }, [activeDraftKey, effectiveQuizId, groups, playerTemplate, quizEditorDraftQuery.data?.docVersion, quizEditorDraftQuery.data?.draftId, quizProject]);

  const pendingImportSignature = pendingImportedQuestions.map((question) => question.id).join("|");

  useEffect(() => {
    if (!pendingImportedQuestions.length) {
      return;
    }

    if (pendingImportSignature === importedSignatureRef.current) {
      return;
    }

    importedSignatureRef.current = pendingImportSignature;
    importQuestionBankQuestions(pendingImportedQuestions);
    setImportNoticeCount(pendingImportedQuestions.length);
    onImportedQuestionsHandled?.();
  }, [importQuestionBankQuestions, onImportedQuestionsHandled, pendingImportSignature, pendingImportedQuestions]);

  const questionManagerGroups = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        slides: group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)),
      })),
    [groups],
  );

  const filteredQuestionManagerGroups = useMemo(
    () =>
      filteredGroups.map((group) => ({
        ...group,
        slides: group.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)),
      })),
    [filteredGroups],
  );

  const questionManagerSlides = useMemo(
    () => questionManagerGroups.flatMap((group) => group.slides),
    [questionManagerGroups],
  );

  const questionBankSubjects = questionBankQuery.data?.subjects ?? [];
  const apiBackedTaxonomy = hasApiBase() && questionBankSubjects.length > 0;
  const courseOptions = useMemo<CourseScopeOption[]>(
    () =>
      apiBackedTaxonomy
        ? questionBankSubjects.map((subject) => ({
            id: subject.id,
            label: subject.label,
            meta: `${subject.description || subject.label} · ${subject.levels.length} levels · ${subject.categories.length} chủ đề`,
          }))
        : courseScopeOptions,
    [apiBackedTaxonomy, questionBankSubjects],
  );

  const selectedSubject = useMemo(
    () => questionBankSubjects.find((subject) => subject.id === selectedCourseId) ?? null,
    [questionBankSubjects, selectedCourseId],
  );

  const levelOptions = useMemo<LevelScopeOption[]>(
    () =>
      apiBackedTaxonomy && selectedSubject
        ? selectedSubject.levels.map((level) => ({
            id: level.id,
            courseId: selectedSubject.id,
            label: level.label,
            meta: level.description,
          }))
        : apiBackedTaxonomy
          ? []
          : levelScopeOptions.filter((option) => option.courseId === selectedCourseId),
    [apiBackedTaxonomy, selectedCourseId, selectedSubject],
  );

  const selectedCourse =
    courseOptions.find((option) => option.id === selectedCourseId) ?? courseOptions[0] ?? emptyCourseScopeOption;
  const selectedLevel = levelOptions.find((option) => option.id === selectedLevelId) ?? levelOptions[0] ?? null;
  const selectedLevelScopeId = selectedLevel?.id ?? null;
  const selectedLevelLabel = selectedLevel?.label ?? null;
  const selectedLevelMeta = selectedLevel?.meta ?? null;
  const levelTopics = useMemo(
    () =>
      selectedSubject?.categories.filter((topic) => !selectedLevelScopeId || topic.levelId === selectedLevelScopeId) ?? [],
    [selectedLevelScopeId, selectedSubject],
  );

  useEffect(() => {
    if (!questionBankSubjects.length) return;

    const nextSubject = questionBankSubjects.find((subject) => subject.id === selectedCourseId) ?? questionBankSubjects[0]!;
    const nextLevel = nextSubject.levels.find((level) => level.id === selectedLevelId) ?? nextSubject.levels[0] ?? null;
    const nextLevelId = nextLevel?.id ?? null;
    const topicStillExists =
      selectedTopicId === "all" ||
      nextSubject.categories.some((topic) => topic.id === selectedTopicId && (!nextLevelId || topic.levelId === nextLevelId));

    if (nextSubject.id !== selectedCourseId) {
      setSelectedCourseId(nextSubject.id);
    }
    if (nextLevelId !== selectedLevelId) {
      setSelectedLevelId(nextLevelId);
    }
    if (!topicStillExists) {
      setSelectedTopicId("all");
    }
  }, [questionBankSubjects, selectedCourseId, selectedLevelId, selectedTopicId]);

  useEffect(() => {
    if (!effectiveQuizId || !workspaceQuery.data?.quizzes.items) return;
    const currentQuizMeta = workspaceQuery.data.quizzes.items.find((q) => q.id === effectiveQuizId);
    if (!currentQuizMeta) return;

    if (currentQuizMeta.subjectId && currentQuizMeta.subjectId !== selectedCourseId) {
      setSelectedCourseId(currentQuizMeta.subjectId);
    }
    if (currentQuizMeta.levelId !== undefined && currentQuizMeta.levelId !== selectedLevelId) {
      setSelectedLevelId(currentQuizMeta.levelId);
    }
    if (currentQuizMeta.categoryId && currentQuizMeta.categoryId !== selectedTopicId) {
      setSelectedTopicId(currentQuizMeta.categoryId);
    }
  }, [effectiveQuizId, workspaceQuery.data?.quizzes.items]);

  const topicOptions = useMemo<TopicOption[]>(
    () => [
      {
        id: "all",
        label: "Tất cả chủ đề",
        description: selectedLevelLabel ? `${selectedCourse.label} · ${selectedLevelLabel}` : selectedCourse.label,
        count: questionBankQuery.data?.questions.length ?? questionManagerSlides.length,
      },
      ...levelTopics.map((topic) => ({
        id: topic.id,
        label: topic.label,
        description: topic.label,
        count: questionBankQuery.data?.questions.filter((question) => question.categoryId === topic.id).length ?? 0,
      })),
    ],
    [levelTopics, questionBankQuery.data?.questions, questionManagerSlides.length, selectedCourse.label, selectedLevelLabel],
  );
  const selectedTopic = topicOptions.find((topic) => topic.id === selectedTopicId) ?? topicOptions[0]!;

  const questionEntries = useMemo(
    () =>
      questionManagerGroups.flatMap((group) =>
        group.slides.map((slide) => ({
          groupId: group.id,
          slideId: slide.id,
          title: slide.title,
        })),
      ),
    [questionManagerGroups],
  );

  const quizInformationSlide = useMemo(
    () => createQuizInformationSlide(quizProject),
    [quizProject],
  );

  const configuredResultSlide = useMemo(
    () => createConfiguredResultSlide(resultSlide, quizProject),
    [quizProject, resultSlide],
  );

  const previewSlides = useMemo(
    () => [
      ...(quizInformationSlide ? [quizInformationSlide] : []),
      ...questionManagerSlides,
      configuredResultSlide,
    ],
    [configuredResultSlide, questionManagerSlides, quizInformationSlide],
  );

  const managerGroups = useMemo(
    () => filteredQuestionManagerGroups.filter((group) => group.slides.length > 0),
    [filteredQuestionManagerGroups],
  );

  const exportPayload = useMemo(
    () => ({
      quizProject,
      playerTemplate,
      themeId: selectedThemeId,
      groups,
      quizInformationSlide,
      resultSlide: configuredResultSlide,
    }),
    [configuredResultSlide, groups, playerTemplate, quizInformationSlide, quizProject, selectedThemeId],
  );

  const selectedGroupSlides = selectedGroup?.slides.filter((slide) => isQuestionManagerSlideKind(slide.kind)) ?? [];
  const selectedSlideIndex =
    selectedSlide ? selectedGroupSlides.findIndex((slide) => slide.id === selectedSlide.id) + 1 : 1;
  const selectedGroupSlideTotal = selectedGroupSlides.length || questionManagerSlides.length || totalSlides;

  const statusText =
    selectedNode.type === "result"
      ? t("quiz.resultStatus")
      : selectedSlide
        ? t("quiz.questionStatus", {
            current: selectedSlideIndex,
            total: selectedGroupSlideTotal,
        })
        : t("quiz.noQuestions");

  function handleCourseChange(nextCourseId: string) {
    const nextSubject = questionBankSubjects.find((subject) => subject.id === nextCourseId) ?? null;
    const nextLevel = nextSubject?.levels[0]
      ? {
          id: nextSubject.levels[0].id,
          courseId: nextSubject.id,
          label: nextSubject.levels[0].label,
          meta: nextSubject.levels[0].description,
        }
      : apiBackedTaxonomy
        ? null
        : levelScopeOptions.find((option) => option.courseId === nextCourseId) ?? null;
    setSelectedCourseId(nextCourseId);
    setSelectedLevelId(nextLevel?.id ?? null);
    setSelectedTopicId("all");
    setActiveQuizId(null);
  }

  function handleLevelChange(nextLevelId: string) {
    setSelectedLevelId(nextLevelId);
    setSelectedTopicId("all");
    setActiveQuizId(null);
  }

  function handleTopicChange(nextTopicId: string) {
    setSelectedTopicId(nextTopicId);
    setActiveQuizId(null);
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
      let targetDocVersion = quizEditorDraftQuery.data?.docVersion ?? 0;

      if (!targetQuizId) {
        const title = quizProject.info?.title?.trim() || "Bài kiểm tra mới";
        const currentSubject = questionBankSubjects.find((s) => s.id === selectedCourseId) || questionBankSubjects[0];
        const subjectId = selectedCourseId || currentSubject?.id || undefined;

        const validLevel = currentSubject?.levels.find((lvl) => lvl.id === selectedLevelId);
        const levelId = validLevel ? validLevel.id : undefined;

        const validTopic = selectedTopicId !== "all"
          ? currentSubject?.categories.find((cat) => cat.id === selectedTopicId)
          : undefined;
        const categoryId = validTopic ? validTopic.id : undefined;

        const created = await createQuizMutation.mutateAsync({
          title,
          subtitle: validTopic?.label,
          kind: "train",
          subjectId,
          levelId,
          categoryId,
          questionIds: updatedGroups.flatMap((g) => g.slides.map((s) => s.id)),
          idempotencyKey: createClientIdempotencyKey("quiz-editor-create"),
        });

        targetQuizId = created.quizId;
        targetDocVersion = created.docVersion;
        setActiveQuizId(created.quizId);
        onQuizCreated?.(created.quizId);
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
        draftId: quizEditorDraftQuery.data?.draftId ?? `server-${targetQuizId}`,
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
    try {
      setSlidesPublished(idsToPublish);

      const publishTree = groups.map((g) => ({
        ...g,
        slides: g.slides.map((s) =>
          idsToPublish.includes(s.id) ? { ...s, status: "published" as const } : s,
        ),
      }));

      let targetQuizId = effectiveQuizId;
      let targetDocVersion = quizEditorDraftQuery.data?.docVersion ?? 0;

      if (!targetQuizId) {
        const title = quizProject.info?.title?.trim() || "Bài kiểm tra mới";
        const currentSubject = questionBankSubjects.find((s) => s.id === selectedCourseId) || questionBankSubjects[0];
        const subjectId = selectedCourseId || currentSubject?.id || undefined;

        const validLevel = currentSubject?.levels.find((lvl) => lvl.id === selectedLevelId);
        const levelId = validLevel ? validLevel.id : undefined;

        const validTopic = selectedTopicId !== "all"
          ? currentSubject?.categories.find((cat) => cat.id === selectedTopicId)
          : undefined;
        const categoryId = validTopic ? validTopic.id : undefined;

        const created = await createQuizMutation.mutateAsync({
          title,
          subtitle: validTopic?.label,
          kind: "train",
          subjectId,
          levelId,
          categoryId,
          questionIds: publishTree.flatMap((g) => g.slides.map((s) => s.id)),
          idempotencyKey: createClientIdempotencyKey("quiz-editor-publish-create"),
        });

        targetQuizId = created.quizId;
        targetDocVersion = created.docVersion;
        setActiveQuizId(created.quizId);
        onQuizCreated?.(created.quizId);
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
        draftId: quizEditorDraftQuery.data?.draftId ?? `server-${targetQuizId}`,
        docVersion: nextDocVersion,
        settings: quizProject,
        playerTemplate,
        tree: publishTree,
      });

      toast.success(`Đã xuất bản thành công ${idsToPublish.length} câu hỏi.`);
      setPreviewMode("publish");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xuất bản thất bại.");
    }
  }

  const handleAddQuestion = (type: QuestionType = "multiple-choice", preset?: QuestionCreationPreset) => {
    addQuestion(type, preset);
    setQuestionEditorOpen(true);
  };

  return (
    <div className="classic-editor flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <QuizEditorRibbon
        searchValue={searchValue}
        courseOptions={courseOptions}
        selectedCourseId={selectedCourse.id}
        levelOptions={levelOptions}
        selectedLevelId={selectedLevel?.id ?? null}
        topicOptions={topicOptions}
        selectedTopicId={selectedTopic.id}
        onChangeCourse={handleCourseChange}
        onChangeLevel={handleLevelChange}
        onChangeTopic={handleTopicChange}
        onChangeSearch={setSearchValue}
        onAddQuestion={handleAddQuestion}
        onAddIntroduction={addIntroduction}
        onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
        onOpenPublish={() => void handleOpenPublish()}
      />

      {importNoticeCount > 0 ? (
        <div className="border-b border-[#d7e0eb] bg-[#fff8ee] px-6 py-3 text-sm text-[#8d4a12]">
          {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
        </div>
      ) : null}

      {effectiveQuizId ? (
        <div className="flex items-center justify-between border-b border-[#bae6fd] bg-[#f0f9ff] px-6 py-2 text-xs text-[#0369a1]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">💡 Bản nháp máy chủ đang mở:</span>
            <span>"{quizProject.info.title}" ({questionManagerSlides.length} câu hỏi)</span>
          </div>
          <button
            type="button"
            onClick={handleCreateNewQuiz}
            className="rounded border border-[#0284c7] bg-white px-2.5 py-1 font-semibold text-[#0284c7] shadow-sm transition hover:bg-[#e0f2fe]"
          >
            + Tạo bài kiểm tra mới
          </button>
        </div>
      ) : recentServerDraft ? (
        <div className="flex items-center justify-between border-b border-[#bae6fd] bg-[#f0f9ff] px-6 py-2 text-xs text-[#0369a1]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">💡 Bản nháp gần nhất trên máy chủ:</span>
            <span>"{recentServerDraft.title}" ({recentServerDraft.questionCount || 0} câu hỏi)</span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenRecentDraft(recentServerDraft.id)}
            className="rounded bg-[#0284c7] px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-[#0369a1]"
          >
            Mở bản nháp này
          </button>
        </div>
      ) : null}

      <div className="classic-editor__layout">
        <QuestionManagerTable
          quizTitle={quizProject.info.title}
          groups={managerGroups}
          selectedNode={selectedNode}
          lessonLabel={selectedLevelLabel ? `${selectedCourse.label} · ${selectedLevelLabel}` : selectedCourse.label}
          lessonMeta={selectedLevelMeta ?? selectedCourse.meta}
          topicLabel={selectedTopic.label}
          onAddNewQuestion={handleAddQuestion}
          onOpenEditor={() => setQuestionEditorOpen(true)}
          onOpenEditorFor={(groupId, slideId) => {
            selectSlide(groupId, slideId);
            setQuestionEditorOpen(true);
          }}
          onSelectSlide={selectSlide}
          onDuplicateSelected={duplicateSelected}
          onRemoveSelected={deleteSelected}
          onDuplicateSlides={duplicateSlides}
          onDeleteSlides={deleteSlides}
          onPublishSelected={(slideIds) => void handleOpenPublish(slideIds)}
          onSaveDraft={() => void handleSaveDraft()}
          isSavingDraft={isSavingDraft}
          isSavedOnServer={Boolean(effectiveQuizId)}
          lastSavedTime={lastSavedTime}
        />
      </div>

      <div className="classic-editor__status">
        <span>{statusText}</span>
        <div className="classic-editor__status-summary">
          <span>{quizProject.info.title}</span>
          <span>{t("quiz.questionCount", { count: questionManagerSlides.length })}</span>
          <span>{selectedCourse.label}</span>
          {selectedLevelLabel ? <span>{selectedLevelLabel}</span> : null}
          <span>{selectedTopic.label}</span>
        </div>
      </div>

      {questionEditorOpen && selectedNode.type === "slide" && selectedSlide ? (
        <QuestionEditorDialog
          key={`question-editor-${selectedSlide.id}`}
          open
          slide={selectedSlide}
          groupTitle={selectedGroup?.title ?? null}
          entries={questionEntries}
          selectedThemeId={selectedThemeId}
          onClose={() => setQuestionEditorOpen(false)}
          onSave={replaceSelectedSlide}
          onNavigate={selectSlide}
          onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
          onPreview={(nextSlide) => {
            replaceSelectedSlide(nextSlide);
            setPreviewMode("preview");
          }}
        />
      ) : null}

      {playerTemplateOpen ? (
        <PlayerTemplateDialog
          key={`player-template-${selectedThemeId}`}
          open
          selectedThemeId={selectedThemeId}
          value={playerTemplate}
          infoPage={quizProject.info.page}
          previewQuestion={questionManagerSlides[0] ?? null}
          questionCount={questionManagerSlides.length}
          passingRate={quizProject.settings.passingRate}
          onClose={() => setPlayerTemplateOpen(false)}
          onSave={(themeId, nextTemplate) => {
            setSelectedThemeId(themeId);
            updatePlayerTemplate(nextTemplate);
          }}
        />
      ) : null}

      {previewMode ? (
        <SlidePreviewDialog
          open
          mode={previewMode}
          slides={previewSlides}
          selectedSlideId={selectedNode.type === "result" ? configuredResultSlide.id : selectedSlide?.id}
          selectedThemeId={selectedThemeId}
          exportPayload={exportPayload}
          onClose={() => setPreviewMode(null)}
        />
      ) : null}
    </div>
  );
}

function createQuizInformationSlide(quizProject: QuizProjectSettings): QuizEditorSlide | null {
  if (!quizProject.info.showIntroductionPage) {
    return null;
  }

  return {
    id: "quiz-information-slide",
    title: quizProject.info.page.courseTitle || quizProject.info.title,
    kind: "info-slide",
    description: quizProject.info.introduction,
    instructions: quizProject.info.introduction ? [quizProject.info.introduction] : [],
    infoPage: quizProject.info.page,
  };
}

function createConfiguredResultSlide(
  resultSlide: QuizEditorSlide,
  quizProject: QuizProjectSettings,
): QuizEditorSlide {
  return {
    ...resultSlide,
    feedbackRows: [
      {
        id: "result-pass-message",
        kind: "correct",
        feedback: quizProject.result.passMessage,
        score: 0,
        branching: "By Result",
      },
      {
        id: "result-fail-message",
        kind: "incorrect",
        feedback: quizProject.result.failMessage,
        score: 0,
        branching: "By Result",
      },
    ],
  };
}

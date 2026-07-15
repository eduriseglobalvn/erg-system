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
  usePublishQuizEditorDraftMutation,
  useQuizEditorDraftQuery,
  useQuizEditorWorkspaceQuery,
  useSaveQuizEditorDraftMutation,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useI18n } from "@/platform/i18n";
import type {
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

export function QuizEditorWorkspace({
  activeLeaf,
  quizId,
  pendingImportedQuestions = [],
  onImportedQuestionsHandled,
}: {
  activeLeaf: DashboardLeaf;
  quizId?: string | null;
  pendingImportedQuestions?: QuestionBankQuestion[];
  onImportedQuestionsHandled?: () => void;
}) {
  void activeLeaf;
  const { t } = useI18n();
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
  const hydratedQuestionBankSignatureRef = useRef("");
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
  const quizEditorWorkspaceQuery = useQuizEditorWorkspaceQuery({ size: 20 });
  const defaultQuizId = useMemo(() => {
    const quizzes = quizEditorWorkspaceQuery.data?.quizzes.items ?? [];
    return quizzes.find((quiz) => quiz.id === "quiz-sample-editor-question-types")?.id ?? quizzes[0]?.id ?? "";
  }, [quizEditorWorkspaceQuery.data?.quizzes.items]);
  const effectiveQuizId = quizId ?? defaultQuizId;
  const quizEditorDraftQuery = useQuizEditorDraftQuery(quizId ?? "");
  const saveDraftMutation = useSaveQuizEditorDraftMutation();
  const publishDraftMutation = usePublishQuizEditorDraftMutation();

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
    replaceWithQuestionBankQuestions,
    addQuestion,
    addIntroduction,
    duplicateSelected,
    deleteSelected,
    replaceSelectedSlide,
    updatePlayerTemplate,
    hydrateDraftDocument,
    setSelectedThemeId,
  } = useQuizEditorState();

  useEffect(() => {
    if (!quizId || !quizEditorDraftQuery.data) return;

    const draftSignature = `${quizEditorDraftQuery.data.quizId}:${quizEditorDraftQuery.data.docVersion}`;
    if (draftSignature === hydratedDraftSignatureRef.current) return;

    hydratedDraftSignatureRef.current = draftSignature;
    const localDraft = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), quizId);
    const serverUpdatedAt = Date.parse(quizEditorDraftQuery.data.updatedAt ?? "");
    const localUpdatedAt = Date.parse(localDraft?.savedAt ?? "");
    hydrateDraftDocument(
      localDraft && (!Number.isFinite(serverUpdatedAt) || localUpdatedAt > serverUpdatedAt)
        ? localDraft.payload
        : quizEditorDraftQuery.data,
    );
    draftReadyForRecoveryRef.current = true;
  }, [hydrateDraftDocument, quizEditorDraftQuery.data, quizId]);

  useEffect(() => {
    if (!quizId || !draftReadyForRecoveryRef.current) return;
    const timer = window.setTimeout(() => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), quizId, {
        quizId,
        draftId: quizEditorDraftQuery.data?.draftId ?? `local-${quizId}`,
        docVersion: quizEditorDraftQuery.data?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [groups, playerTemplate, quizEditorDraftQuery.data?.docVersion, quizEditorDraftQuery.data?.draftId, quizId, quizProject]);

  useEffect(() => {
    if (!quizId || !draftReadyForRecoveryRef.current) return;
    const persistRecoveryDraft = () => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), quizId, {
        quizId,
        draftId: quizEditorDraftQuery.data?.draftId ?? `local-${quizId}`,
        docVersion: quizEditorDraftQuery.data?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    };
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
    window.addEventListener("pagehide", persistRecoveryDraft);
    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
      window.removeEventListener("pagehide", persistRecoveryDraft);
    };
  }, [groups, playerTemplate, quizEditorDraftQuery.data?.docVersion, quizEditorDraftQuery.data?.draftId, quizId, quizProject]);



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

  const apiBackedTaxonomy = hasApiBase();
  const questionBankSubjects = questionBankQuery.data?.subjects ?? [];
  const courseOptions = useMemo<CourseScopeOption[]>(
    () =>
      questionBankSubjects.length
        ? questionBankSubjects.map((subject) => ({
            id: subject.id,
            label: subject.label,
            meta: subject.description || subject.companyScopeLabel,
          }))
        : apiBackedTaxonomy
          ? []
          : courseScopeOptions,
    [apiBackedTaxonomy, questionBankSubjects],
  );

  const selectedSubject = questionBankSubjects.find((subject) => subject.id === selectedCourseId) ?? questionBankSubjects[0] ?? null;
  const levelOptions = useMemo<LevelScopeOption[]>(
    () =>
      selectedSubject?.levels.length
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

  const topicOptions = useMemo<TopicOption[]>(
    () => [
      {
        id: "all",
        label: "T?t c? ch? d?",
        description: selectedLevelLabel ? `${selectedCourse.label} � ${selectedLevelLabel}` : selectedCourse.label,
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
  useEffect(() => {
    if (quizId || !questionBankQuery.data) return;

    const questionIds = questionBankQuery.data.questions.map((question) => question.id).join("|");
    const bankSignature = [
      questionBankFilters.subjectId ?? "",
      questionBankFilters.levelId ?? "",
      questionBankFilters.topicId ?? "",
      questionBankFilters.status ?? "",
      questionIds,
    ].join(":");
    if (bankSignature === hydratedQuestionBankSignatureRef.current) return;

    hydratedQuestionBankSignatureRef.current = bankSignature;
    replaceWithQuestionBankQuestions(questionBankQuery.data.questions, selectedTopic.label);
    setImportNoticeCount(0);
  }, [
    questionBankFilters.levelId,
    questionBankFilters.status,
    questionBankFilters.subjectId,
    questionBankFilters.topicId,
    questionBankQuery.data,
    quizId,
    replaceWithQuestionBankQuestions,
    selectedTopic.label,
  ]);

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
  }

  function handleLevelChange(nextLevelId: string) {
    setSelectedLevelId(nextLevelId);
    setSelectedTopicId("all");
  }

  async function handleOpenPublish() {
    if (!effectiveQuizId) {
      setPreviewMode("publish");
      return;
    }

    try {
      const savedDraft = await saveDraftMutation.mutateAsync({
        quizId: effectiveQuizId,
        docVersion: quizEditorDraftQuery.data?.docVersion,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
      await publishDraftMutation.mutateAsync({
        quizId: effectiveQuizId,
        docVersion: savedDraft.docVersion,
        idempotencyKey: `quiz-editor-publish:${effectiveQuizId}:${savedDraft.docVersion}`,
      });
      clearLocalQuizDraft(getDefaultTenantId(), effectiveQuizId);
      toast.success("Quiz draft saved and published.");
      setPreviewMode("publish");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cannot publish quiz draft.");
    }
  }

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
        onChangeTopic={setSelectedTopicId}
        onChangeSearch={setSearchValue}
        onAddQuestion={addQuestion}
        onAddIntroduction={addIntroduction}
        onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
        onOpenPublish={() => void handleOpenPublish()}
      />

      {importNoticeCount > 0 ? (
        <div className="border-b border-[#d7e0eb] bg-[#fff8ee] px-6 py-3 text-sm text-[#8d4a12]">
          {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
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
          onOpenEditor={() => setQuestionEditorOpen(true)}
          onOpenEditorFor={(groupId, slideId) => {
            selectSlide(groupId, slideId);
            setQuestionEditorOpen(true);
          }}
          onDuplicateSelected={duplicateSelected}
          onRemoveSelected={deleteSelected}
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

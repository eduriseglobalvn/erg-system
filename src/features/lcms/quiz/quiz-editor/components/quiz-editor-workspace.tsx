import { useEffect, useMemo, useState } from "react";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PlayerTemplateDialog } from "@/features/lcms/quiz/quiz-editor/components/player-template-dialog";
import { QuestionEditorDialog } from "@/features/lcms/quiz/quiz-editor/components/question-editor-dialog";
import { QuestionManagerTable } from "@/features/lcms/quiz/quiz-editor/components/question-manager-table";
import { QuizEditorRibbon } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-ribbon";
import { QuizEditorWorkspaceBanners } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-banners";
import { QuizEditorWorkspaceStatusBar } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-status-bar";
import { findScopeMatchingDraft } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import {
  SlidePreviewDialog,
  type SlidePreviewDialogMode,
} from "@/features/lcms/quiz/quiz-editor/components/slide-preview-dialog";
import {
  useQuizEditorDraftQuery,
  useQuizEditorWorkspaceQuery,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import {
  createBlankDraft,
  useInitialLocalDraft,
  useQuizEditorDraftRecovery,
} from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-draft-recovery";
import { useQuizEditorImportedQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions";
import { useQuizEditorSavePublish } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-save-publish";
import {
  buildTopicOptions,
  useQuizEditorScope,
  useQuizEditorScopeSync,
} from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import { useQuizEditorSlideViews } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-slide-views";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useI18n } from "@/platform/i18n";
import type {
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { isQuestionManagerSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import "@/features/lcms/quiz/quiz-editor/styles/classic-editor.css";

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

  const scope = useQuizEditorScope(setActiveQuizId);
  const { selectedCourseId, selectedLevelId, selectedTopicId, selectedCourse, selectedLevel } = scope;
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [playerTemplateOpen, setPlayerTemplateOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<SlidePreviewDialogMode | null>(null);

  const effectiveQuizId = activeQuizId ?? quizId ?? "";
  const activeDraftKey = effectiveQuizId.trim()
    || (selectedCourseId ? `new-quiz:${selectedCourseId}:${selectedLevelId || "all"}` : "new-quiz:default");

  const initialLocalDraft = useInitialLocalDraft(activeDraftKey);
  const quizEditorDraftQuery = useQuizEditorDraftQuery(effectiveQuizId);
  const workspaceQuery = useQuizEditorWorkspaceQuery({ size: 20 });
  const quizItems = workspaceQuery.data?.quizzes.items;

  const recentServerDraft = useMemo(
    () => findScopeMatchingDraft(quizItems, selectedCourseId, selectedLevelId, selectedTopicId),
    [selectedCourseId, selectedLevelId, selectedTopicId, quizItems],
  );

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

  // Do not auto-hijack editor with existing server draft on reload; user can click banner to open
  const { hydratedDraftSignatureRef } = useQuizEditorDraftRecovery({
    activeDraftKey,
    effectiveQuizId,
    hydrateDraftDocument,
    serverDraft: quizEditorDraftQuery.data,
    quizProject,
    playerTemplate,
    groups,
  });

  const importNoticeCount = useQuizEditorImportedQuestions({
    pendingImportedQuestions,
    importQuestionBankQuestions,
    onImportedQuestionsHandled,
  });

  const { questionManagerSlides, questionEntries, configuredResultSlide, previewSlides, managerGroups, exportPayload } =
    useQuizEditorSlideViews({ groups, filteredGroups, resultSlide, quizProject, playerTemplate, selectedThemeId });

  useQuizEditorScopeSync({ scope, effectiveQuizId, quizItems });

  const selectedLevelLabel = selectedLevel?.label ?? null;
  const selectedLevelMeta = selectedLevel?.meta ?? null;
  const topicOptions = useMemo(
    () =>
      buildTopicOptions({
        levelTopics: scope.levelTopics,
        questions: scope.questionBankQuery.data?.questions,
        fallbackCount: questionManagerSlides.length,
        courseLabel: selectedCourse.label,
        levelLabel: selectedLevelLabel,
      }),
    [scope.levelTopics, scope.questionBankQuery.data?.questions, questionManagerSlides.length, selectedCourse.label, selectedLevelLabel],
  );
  const selectedTopic = topicOptions.find((topic) => topic.id === selectedTopicId) ?? topicOptions[0]!;

  const { isSavingDraft, lastSavedTime, setLastSavedTime, handleSaveDraft, handleOpenPublish } = useQuizEditorSavePublish({
    effectiveQuizId,
    activeDraftKey,
    serverDraft: quizEditorDraftQuery.data,
    quizProject,
    playerTemplate,
    groups,
    questionManagerSlides,
    questionBankSubjects: scope.questionBankSubjects,
    selectedCourseId,
    selectedLevelId,
    selectedTopicId,
    hydratedDraftSignatureRef,
    setActiveQuizId,
    onQuizCreated,
    markAllAsSavedDraft,
    setSlidesPublished,
    onPublished: () => setPreviewMode("publish"),
  });

  function handleOpenRecentDraft(targetId: string) {
    setActiveQuizId(targetId);
    onQuizCreated?.(targetId);
  }

  function handleCreateNewQuiz() {
    setActiveQuizId(null);
    hydrateDraftDocument(createBlankDraft("", "local-new-quiz"));
    setLastSavedTime(null);
  }

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

  const handleAddQuestion = (type: QuestionType = "multiple-choice", preset?: QuestionCreationPreset) => {
    addQuestion(type, preset);
    setQuestionEditorOpen(true);
  };

  return (
    <div className="classic-editor flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{quizProject.info.title || "Soạn bài kiểm tra"}</h1>
      <QuizEditorRibbon
        searchValue={searchValue}
        courseOptions={scope.courseOptions}
        selectedCourseId={selectedCourse.id}
        levelOptions={scope.levelOptions}
        selectedLevelId={selectedLevel?.id ?? null}
        topicOptions={topicOptions}
        selectedTopicId={selectedTopic.id}
        onChangeCourse={scope.handleCourseChange}
        onChangeLevel={scope.handleLevelChange}
        onChangeTopic={scope.handleTopicChange}
        onChangeSearch={setSearchValue}
        onAddQuestion={handleAddQuestion}
        onAddIntroduction={addIntroduction}
        onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
        onOpenPublish={() => void handleOpenPublish()}
      />

      <QuizEditorWorkspaceBanners
        importNoticeCount={importNoticeCount}
        openedQuizId={effectiveQuizId}
        openedQuizTitle={quizProject.info.title}
        openedQuestionCount={questionManagerSlides.length}
        recentServerDraft={recentServerDraft}
        onCreateNewQuiz={handleCreateNewQuiz}
        onOpenRecentDraft={handleOpenRecentDraft}
      />

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

      <QuizEditorWorkspaceStatusBar
        statusText={statusText}
        quizTitle={quizProject.info.title}
        questionCount={questionManagerSlides.length}
        courseLabel={selectedCourse.label}
        levelLabel={selectedLevelLabel}
        topicLabel={selectedTopic.label}
      />

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

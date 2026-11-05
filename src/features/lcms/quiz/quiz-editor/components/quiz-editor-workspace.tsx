import { useEffect, useMemo, useState } from "react";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PlayerTemplateDialog } from "@/features/lcms/quiz/quiz-editor/components/player-template-dialog";
import { QuestionTypePickerDialog } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-type-picker-dialog";
import { QuestionEditorDialog } from "@/features/lcms/quiz/quiz-editor/components/question-editor-dialog";
import { QuestionManagerTable } from "@/features/lcms/quiz/quiz-editor/components/question-manager-table";
import { QuizEditorRibbon } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-ribbon";
import { QuizEditorWorkspaceBanners } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-banners";
import { QuizEditorSyncChip } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip";
import { QuizEditorSyncLayer } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer";
import { QuizEditorWorkspaceStatusBar } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-status-bar";
import { findScopeMatchingDraft } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import {
  SlidePreviewDialog,
  type SlidePreviewDialogMode,
} from "@/features/lcms/quiz/quiz-editor/components/slide-preview-dialog";
import { useQuizEditorWorkspaceQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { useQuizEditorImportedQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions";
import {
  buildTopicOptions,
  useQuizEditorScope,
  useQuizEditorScopeSync,
} from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import { useQuizEditorSlideViews } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-slide-views";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useQuizEditorSync } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-sync";
import { useI18n } from "@/platform/i18n";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [playerTemplateOpen, setPlayerTemplateOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<SlidePreviewDialogMode | null>(null);

  // The route quizId is copied into activeQuizId above; falling back to it here would undo "new quiz" and scope changes.
  const effectiveQuizId = (activeQuizId ?? "").trim();
  const workspaceQuery = useQuizEditorWorkspaceQuery({ size: 20 });
  const quizItems = workspaceQuery.data?.quizzes.items;

  const recentServerDraft = useMemo(
    () => findScopeMatchingDraft(quizItems, selectedCourseId, selectedLevelId, selectedTopicId),
    [selectedCourseId, selectedLevelId, selectedTopicId, quizItems],
  );

  const editorState = useQuizEditorState(null);
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
    replaceSelectedSlide,
    updatePlayerTemplate,
    setSelectedThemeId,
  } = editorState;

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

  function openQuiz(targetId: string) {
    setActiveQuizId(targetId);
    onQuizCreated?.(targetId);
  }

  const { sync, handlePublish, isPublishing, publishBlockedReason, loadFailed, retrying, retry } = useQuizEditorSync({
    quizId: effectiveQuizId,
    scope,
    editor: editorState,
    questionSlideIds: questionManagerSlides.map((slide) => slide.id),
    selectedSlideId: selectedSlide?.id ?? null,
    questionEditorOpen,
    onQuizCreated: openQuiz,
    onPublished: () => setPreviewMode("publish"),
  });
  const importNoticeCount = useQuizEditorImportedQuestions({
    ready: sync.ready,
    pendingImportedQuestions,
    importQuestionBankQuestions,
    onImportedQuestionsHandled,
  });

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

  // The question only exists once a type is picked; cancelling the picker creates nothing.
  const handlePickQuestionType = (type: QuestionType) => {
    setPickerOpen(false);
    addQuestion(type);
    setQuestionEditorOpen(true);
  };
  const pickerTitle = selectedTopic.id === "all" ? "Thêm câu hỏi" : `Thêm câu hỏi vào “${selectedTopic.label}”`;

  return (
    <div className="classic-editor flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{quizProject.info.title || "Soạn bài kiểm tra"}</h1>
      <QuizEditorSyncLayer loadFailed={loadFailed} onRetry={retry} retrying={retrying} sync={sync}>
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
          onAddQuestion={() => setPickerOpen(true)}
          onAddIntroduction={addIntroduction}
          onOpenPlayerTemplate={() => setPlayerTemplateOpen(true)}
          onOpenPublish={() => void handlePublish()}
          publishBlockedReason={publishBlockedReason}
          isPublishing={isPublishing}
        />

        <QuizEditorWorkspaceBanners
          importNoticeCount={importNoticeCount}
          openedQuizId={effectiveQuizId}
          openedQuizTitle={quizProject.info.title}
          openedQuestionCount={questionManagerSlides.length}
          recentServerDraft={recentServerDraft}
          onCreateNewQuiz={() => setActiveQuizId(null)}
          onOpenRecentDraft={openQuiz}
        />

        <div className="classic-editor__layout">
          <QuestionManagerTable
            quizTitle={quizProject.info.title}
            groups={managerGroups}
            selectedNode={selectedNode}
            lessonLabel={selectedLevelLabel ? `${selectedCourse.label} · ${selectedLevelLabel}` : selectedCourse.label}
            lessonMeta={selectedLevelMeta ?? selectedCourse.meta}
            topicLabel={selectedTopic.label}
            onAddNewQuestion={() => setPickerOpen(true)}
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
            onPublish={() => void handlePublish()}
            publishBlockedReason={publishBlockedReason}
            isPublishing={isPublishing}
            syncChip={<QuizEditorSyncChip onRetry={() => void sync.flushNow()} persistent={sync.persistent} status={sync.status} />}
            isSavedOnServer={Boolean(effectiveQuizId)}
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

        <QuestionTypePickerDialog
          open={pickerOpen}
          title={pickerTitle}
          onPick={handlePickQuestionType}
          onClose={() => setPickerOpen(false)}
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
      </QuizEditorSyncLayer>
    </div>
  );
}

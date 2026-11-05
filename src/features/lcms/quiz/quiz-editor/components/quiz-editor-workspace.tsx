import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PlayerTemplateDialog } from "@/features/lcms/quiz/quiz-editor/components/player-template-dialog";
import { QuestionEditorShell } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-editor-shell";
import { useQuestionTypeChange } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/use-question-type-change";
import { QuestionTable } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table";
import { QuizListTitlebar } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/quiz-list-titlebar";
import { TopicRail } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/topic-rail";
import { QuizEditorSyncChip } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip";
import { QuizEditorSyncLayer, QuizEditorSyncNotices } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer";
import {
  SlidePreviewDialog,
  type SlidePreviewDialogMode,
} from "@/features/lcms/quiz/quiz-editor/components/slide-preview-dialog";
import { useQuizEditorWorkspaceQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { useQuizEditorImportedQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions";
import { useQuizEditorScope, useQuizEditorScopeSync } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import { useQuizEditorSlideViews } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-slide-views";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useQuizEditorSync } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-sync";
import { useQuizList } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-list";
import { useI18n } from "@/platform/i18n";
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
    if (quizId) setActiveQuizId(quizId);
  }, [quizId]);

  const scope = useQuizEditorScope(setActiveQuizId);
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [playerTemplateOpen, setPlayerTemplateOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<SlidePreviewDialogMode | null>(null);

  // The route quizId is copied into activeQuizId above; falling back to it here would undo "new quiz" and scope changes.
  const effectiveQuizId = (activeQuizId ?? "").trim();
  const quizItems = useQuizEditorWorkspaceQuery({ size: 20 }).data?.quizzes.items;

  const editorState = useQuizEditorState(null);
  const {
    filteredGroups,
    groups,
    resultSlide,
    quizProject,
    playerTemplate,
    selectedThemeId,
    selectedNode,
    selectedSlide,
    createId,
    selectSlide,
    importQuestionBankQuestions,
    addQuestion,
    duplicateSelected,
    deleteSelected,
    replaceSelectedSlide,
    updatePlayerTemplate,
    setSelectedThemeId,
  } = editorState;

  const { questionManagerSlides, configuredResultSlide, previewSlides, exportPayload } =
    useQuizEditorSlideViews({ groups, filteredGroups, resultSlide, quizProject, playerTemplate, selectedThemeId });

  useQuizEditorScopeSync({ scope, effectiveQuizId, quizItems });

  function openQuiz(targetId: string) {
    setActiveQuizId(targetId);
    onQuizCreated?.(targetId);
  }
  const openEditor = () => setQuestionEditorOpen(true);

  const { sync, handlePublish, isPublishing, publishBlockedReason, loadFailed, retrying, retry } = useQuizEditorSync({
    quizId: effectiveQuizId,
    scope,
    editor: editorState,
    questionSlides: questionManagerSlides,
    selectedSlideId: selectedSlide?.id ?? null,
    questionEditorOpen,
    onQuizCreated: openQuiz,
    onPublished: () => setPreviewMode("publish"),
  });
  const list = useQuizList({ scope, quizId: effectiveQuizId, ready: sync.ready, groups, quizProject, selectSlide, openQuiz, openEditor });
  const importNoticeCount = useQuizEditorImportedQuestions({
    ready: sync.ready,
    pendingImportedQuestions,
    importQuestionBankQuestions,
    onImportedQuestionsHandled,
  });

  const typeChange = useQuestionTypeChange({
    selectedSlide,
    quizProject,
    createId,
    addQuestion,
    replaceSelectedSlide,
    addTitle: list.topicLabel === null ? "Thêm câu hỏi" : `Thêm câu hỏi vào “${list.topicLabel}”`,
    onAdded: openEditor,
  });
  const syncChip = <QuizEditorSyncChip onRetry={() => void sync.flushNow()} persistent={sync.persistent} status={sync.status} />;

  return (
    <div className="classic-editor flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <h1 className="sr-only">{quizProject.info.title || "Soạn bài kiểm tra"}</h1>
      <QuizListTitlebar
        courseOptions={scope.courseOptions}
        selectedCourseId={scope.selectedCourse.id}
        levelOptions={scope.levelOptions}
        selectedLevelId={scope.selectedLevel?.id ?? null}
        onChangeCourse={scope.handleCourseChange}
        onChangeLevel={scope.handleLevelChange}
        syncChip={syncChip}
        onOpenTheme={() => setPlayerTemplateOpen(true)}
        onPublish={() => void handlePublish()}
        publishBlockedReason={sync.ready ? publishBlockedReason : "Đang mở bản nháp"}
        isPublishing={isPublishing}
      />
      <Box sx={{ bgcolor: "background.default", display: "flex", flex: 1, gap: 2, minHeight: 0, p: 2 }}>
        <TopicRail onSelect={list.selectTopic} rows={list.topics} selectedTopicId={scope.selectedTopicId} />
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, minWidth: 0 }}>
          <QuizEditorSyncLayer loadFailed={loadFailed} onRetry={retry} retrying={retrying} sync={sync}>
          {importNoticeCount > 0 ? (
            <Alert severity="info" sx={{ borderRadius: 0 }}>
              {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
            </Alert>
          ) : null}
          <QuestionTable onAdd={() => typeChange.openPicker("add")} onOpenRow={list.openRow} rows={list.rows} topicLabel={list.topicLabel} />
          {typeChange.dialogs}
          {questionEditorOpen && selectedNode.type === "slide" && selectedSlide && isQuestionManagerSlideKind(selectedSlide.kind) ? (
            <QuestionEditorShell
              groups={groups}
              selectedSlide={selectedSlide}
              onSelectSlide={selectSlide}
              onReplaceSlide={replaceSelectedSlide}
              onAddQuestion={() => typeChange.openPicker("add")}
              onChangeType={() => typeChange.openPicker("change")}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onClose={() => setQuestionEditorOpen(false)}
              syncChip={syncChip}
              banner={<QuizEditorSyncNotices sync={sync} />}
              quizKind="train"
              quizProject={quizProject}
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
        </Box>
      </Box>
    </div>
  );
}

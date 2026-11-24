import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { useEffect, useState } from "react";

import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { QuestionEditorShell } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-editor-shell";
import { useQuestionTypeChange } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/use-question-type-change";
import { useQuestionExcelImport } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import-dialog";
import { QuestionTable } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table";
import { QuizListTitlebar } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/quiz-list-titlebar";
import { TopicRail } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/topic-rail";
import { QuizEditorSyncChip } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-chip";
import { QuizEditorSyncLayer, QuizEditorSyncNotices } from "@/features/lcms/quiz/quiz-editor/components/sync/quiz-editor-sync-layer";
import { useQuizEditorWorkspaceQuery } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { useQuizEditorImportedQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-imported-questions";
import { useQuizEditorScope, useQuizEditorScopeSync } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-scope";
import { useQuizEditorSlideViews } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-slide-views";
import { useQuizEditorState } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-state";
import { useQuizEditorSync } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-sync";
import { useCreatePackage } from "@/features/lcms/quiz/quiz-editor/hooks/use-create-package";
import { useLevelBankQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-level-bank-questions";
import { useBankOnlyQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-bank-only-questions";
import { useMoveQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/use-move-questions";
import { useQuizList } from "@/features/lcms/quiz/quiz-editor/hooks/use-quiz-list";
import { useI18n } from "@/platform/i18n";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function QuizEditorWorkspace({
  activeLeaf,
  quizId,
  onQuizCreated,
  pendingImportedQuestions = [],
  onImportedQuestionsHandled,
  themePanelRequested,
  onThemePanelHandled,
  onCreateQuizFromBank,
}: {
  activeLeaf: DashboardLeaf;
  quizId?: string | null;
  onQuizCreated?: (quizId: string) => void;
  pendingImportedQuestions?: QuestionBankQuestion[];
  onImportedQuestionsHandled?: () => void;
  /** `panel=theme` in the URL: open the theme dialog once the draft is ready. */
  themePanelRequested?: boolean;
  onThemePanelHandled?: () => void;
  /** "Tạo gói bài tập" from the checked questions. */
  onCreateQuizFromBank?: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
}) {
  void activeLeaf;
  const { t } = useI18n();
  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => quizId ?? null);

  useEffect(() => {
    if (quizId) setActiveQuizId(quizId);
  }, [quizId]);

  const scope = useQuizEditorScope(setActiveQuizId);
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);

  // The route quizId is copied into activeQuizId above; falling back to it here would undo "new quiz" and scope changes.
  const effectiveQuizId = (activeQuizId ?? "").trim();
  const quizItems = useQuizEditorWorkspaceQuery({ size: 20 }).data?.quizzes.items;

  const editorState = useQuizEditorState(null);
  const {
    groups,
    quizProject,
    playerTemplate,
    selectedNode,
    selectedSlide,
    createId,
    selectSlide,
    importQuestionBankQuestions,
    addQuestion,
    duplicateSelected,
    deleteSelected,
    replaceSelectedSlide,
    restoreSlide,
    updatePlayerTemplate,
  } = editorState;
  // The question just added from the list: highlighted at the top until another one is added.
  const [addedSlideId, setAddedSlideId] = useState<string | null>(null);

  const { questionManagerSlides } =
    useQuizEditorSlideViews({ groups });

  useQuizEditorScopeSync({ scope, effectiveQuizId, quizItems });

  function openQuiz(targetId: string) {
    setActiveQuizId(targetId);
    onQuizCreated?.(targetId);
  }
  const openEditor = () => setQuestionEditorOpen(true);
  function openQuestion(slideId: string) {
    const group = groups.find((item) => item.slides.some((slide) => slide.id === slideId));
    if (!group) return;
    selectSlide(group.id, slideId);
    openEditor();
  }

  const { sync, handlePublish, isPublishing, publishBlockedReason, publishReadinessOnly, notReady, publishFailure, dismissPublishFailure, loadFailed, retrying, retry } = useQuizEditorSync({
    quizId: effectiveQuizId,
    scope,
    editor: editorState,
    questionSlides: questionManagerSlides,
    selectedSlideId: selectedSlide?.id ?? null,
    questionEditorOpen,
    onQuizCreated: openQuiz,
  });
  const list = useQuizList({ scope, quizId: effectiveQuizId, ready: sync.ready, groups, quizProject, selectSlide, openQuiz, openEditor });
  const levelId = scope.selectedLevel?.id ?? null;
  const usage = useLevelBankQuestions({ subjectId: scope.selectedCourseId, levelId, openQuizId: effectiveQuizId, rows: list.rows });
  const createPackage = useCreatePackage({ subjectId: scope.selectedCourseId, levelId, onCreate: onCreateQuizFromBank });
  const move = useMoveQuestions({
    subject: scope.questionBankSubjects.find((subject) => subject.id === scope.selectedCourseId),
    levelId: scope.selectedLevel?.id ?? null,
    topicId: scope.selectedTopicId,
    groups,
    removeSlides: editorState.removeSlides,
  });
  const excel = useQuestionExcelImport({
    topicLabel: list.topicLabel,
    topics: list.topics,
    subjectId: scope.selectedCourseId,
    levelId: scope.selectedLevel?.id ?? null,
    labels: { subject: scope.selectedCourse.label, level: scope.selectedLevel?.label ?? "" },
    createId,
    questionDefaults: quizProject.questionDefaults,
    onImport: (questions) => importQuestionBankQuestions(questions, { fromBank: false }),
  });
  const bankOnly = useBankOnlyQuestions({
    subjectId: scope.selectedCourseId,
    levelId: scope.selectedLevel?.id ?? null,
    enabled: scope.selectedTopicId === "all" && sync.ready && !list.topicsLoading,
    topics: list.topics,
    liveSlides: questionManagerSlides,
    createId,
    questionDefaults: quizProject.questionDefaults,
    importLoose: importQuestionBankQuestions,
  });
  const importNoticeCount = useQuizEditorImportedQuestions({
    ready: sync.ready,
    pendingImportedQuestions,
    importQuestionBankQuestions,
    onImportedQuestionsHandled,
  });

  const changeType = useQuestionTypeChange({
    selectedSlide,
    selectedGroupId: selectedNode.groupId,
    quizProject,
    createId,
    replaceSelectedSlide,
    restoreSlide,
  });
  // A new question is always Một đáp án; its type changes in the editor.
  const addBlankQuestion = () => addQuestion("multiple-choice");
  const syncChip = <QuizEditorSyncChip onRetry={() => void sync.flushNow()} persistent={sync.persistent} status={sync.status} />;

  return (
    <Box sx={{ display: "flex", flex: 1, flexDirection: "column", height: "100%", maxHeight: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
      <Box component="h1" sx={visuallyHidden}>{list.topicLabel ?? "Ngân hàng câu hỏi"}</Box>
      <QuizListTitlebar
        courseOptions={scope.courseOptions}
        selectedCourseId={scope.selectedCourse.id}
        levelOptions={scope.levelOptions}
        selectedLevelId={scope.selectedLevel?.id ?? null}
        onChangeCourse={scope.handleCourseChange}
        onChangeLevel={scope.handleLevelChange}
        syncChip={syncChip}
        playerTemplate={playerTemplate}
        questionCount={questionManagerSlides.length}
        onApplyTheme={updatePlayerTemplate}
        themeDisabled={!sync.ready}
        themeRequested={themePanelRequested}
        onThemeRequestHandled={onThemePanelHandled}
        onPublish={() => void handlePublish()}
        publishBlockedReason={sync.ready ? publishBlockedReason : loadFailed ? "Chưa mở được bản nháp" : "Đang mở bản nháp"}
        publishReadinessOnly={sync.ready && publishReadinessOnly}
        notReady={notReady}
        onOpenQuestion={openQuestion}
        publishFailure={publishFailure}
        onDismissPublishFailure={dismissPublishFailure}
        isPublishing={isPublishing}
      />
      <Box sx={{ bgcolor: "background.default", display: "flex", flex: 1, gap: 2, minHeight: 0, p: 2 }}>
        <TopicRail loading={list.topicsLoading} onSelect={list.selectTopic} rows={list.topics} selectedTopicId={scope.selectedTopicId} />
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, minWidth: 0 }}>
          <QuizEditorSyncLayer loadFailed={loadFailed} onRetry={retry} retrying={retrying} sync={sync}>
            {importNoticeCount > 0 ? (
              <Alert severity="info" sx={{ borderRadius: 0 }}>
                {t("sidebar.questionBank")}: {importNoticeCount} {t("common.questions").toLowerCase()} đã được đưa vào đề nháp hiện tại.
              </Alert>
            ) : null}
            {bankOnly.banner}
            {/* keyed by topic: a selection must not carry over */}
            <QuestionTable
              key={scope.selectedTopicId}
              highlightSlideId={addedSlideId}
              onAssignTopic={(slideId, topic) =>
                void move.moveTo([slideId], { subjectId: scope.selectedCourseId, levelId: scope.selectedLevel?.id ?? "", topicId: topic.id, topicLabel: topic.label })
              }
              onAdd={() => setAddedSlideId(addBlankQuestion())}
              onImportExcel={excel.openImport}
              onMove={move.openMove}
              onCreatePackage={createPackage.open && ((rows, onDone) => createPackage.open!(rows.map((row) => usage.get(row) ?? null), onDone))}
              onOpenRow={list.openRow}
              rows={list.rows}
              topicLabel={list.topicLabel}
              topics={list.topics}
              usage={usage}
            />
            {createPackage.dialog}
            {move.dialog}
            {excel.dialog}
            {questionEditorOpen && selectedNode.type === "slide" && selectedSlide && isQuestionType(selectedSlide.kind) ? (
              <QuestionEditorShell
                groups={groups}
                selectedSlide={selectedSlide}
                onSelectSlide={selectSlide}
                onReplaceSlide={replaceSelectedSlide}
                onAddQuestion={addBlankQuestion}
                onChangeType={changeType}
                onDuplicate={duplicateSelected}
                onDelete={deleteSelected}
                onClose={() => setQuestionEditorOpen(false)}
                syncChip={syncChip}
                banner={<QuizEditorSyncNotices sync={sync} />}
                quizKind={list.quizKind}
                quizProject={quizProject}
              />
            ) : null}
          </QuizEditorSyncLayer>
        </Box>
      </Box>
    </Box>
  );
}

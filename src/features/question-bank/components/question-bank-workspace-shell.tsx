import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion, QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import type { ContentScope } from "@/types/scope-types";
import { enCopy, type QuestionBankCopy, viCopy, viPackageCopy } from "./question-bank-copy";
import { normalizeAutoCount } from "./question-bank-primitives";
import { QuestionBankQuestionsView } from "./question-bank-questions-view";
import { QuestionBankSyncNotice, QuestionFormDialog } from "./question-form-dialog";
import { QuizAutoPickDialog } from "./quiz-auto-pick-dialog";
import { QuizBankPanel } from "./quiz-bank-panel";
import { QuizCreatePackageDialog } from "./quiz-create-package-dialog";
import { useQuestionBankWorkspaceController } from "./use-question-bank-workspace";
import { PortablePackageExportDialog } from "@/features/portable-package-export/components/portable-package-export-dialog";

export function QuestionBankWorkspace({
  activeLeaf,
  contentScope,
  onCreateQuiz,
}: {
  activeLeaf: DashboardLeaf;
  contentScope: ContentScope;
  onCreateQuiz: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
  onOpenQuiz?: (quizId: string) => void;
}) {
  const [portableQuiz, setPortableQuiz] = useState<QuizBankItem | null>(null);
  const [autoPickOpen, setAutoPickOpen] = useState(false);
  const navigate = useNavigate();
  const { locale } = useI18n();
  const copy: QuestionBankCopy = locale === "vi"
    ? {
        ...enCopy,
        ...viCopy,
        ...viPackageCopy,
        table: { ...enCopy.table, ...viCopy.table, ...viPackageCopy.table },
        quizTable: { ...enCopy.quizTable, ...viCopy.quizTable },
      }
    : enCopy;
  const {
    activeLevel, activeSubject, autoCount, autoPickAvailableCount, autoTopicIds, changeSearch, clearSelection,
    createQuestionMutation, createQuizFromSelection, deleteQuiz, deleteQuizMutation, isQuestionBankFetching,
    levelTopics, openCreateQuestionForm, openEditQuestionForm, openUpdateQuizPackage, pickLevel, pickSubject,
    pickTopic, questionBankData, questionBankQuery, questionForm, quizCreateDraft, quizKind, quizPackageEdit,
    quizPackageEditQuestions, selectedIds, selectedQuestions, setAutoCount, setQuestionForm, setQuestionPage,
    setQuizCreateDraft, setQuizKind, setQuizPackageEdit, submitCreateQuizFromSelection, submitQuestionForm,
    submitUpdateQuizPackage, searchValue, subjects, toggleAutoTopic, toggleQuestion, toggleVisibleQuestions,
    topicId, applyAutoPick, updateQuestionMutation, view, visibleQuestions, visibleQuizzes,
  } = useQuestionBankWorkspaceController({ activeLeaf, contentScope, copy, onCreateQuiz });

  return (
    <DashboardPageShell
      title={activeLeaf.title}
      breadcrumbs={[]}
      hideHeader
      contentClassName="mx-0 w-full !max-w-none px-3 sm:px-4 lg:px-6"
    >
      {questionBankQuery.isError ? (
        <QuestionBankSyncNotice
          message={copy.syncError}
          detail={questionBankQuery.error instanceof Error ? questionBankQuery.error.message : copy.syncErrorDetail}
        />
      ) : null}

      {view === "questions" ? (
        <QuestionBankQuestionsView
          activeLevel={activeLevel}
          activeSubject={activeSubject}
          copy={copy}
          isLoading={isQuestionBankFetching}
          levelTopics={levelTopics}
          loadFailed={questionBankQuery.isError}
          onAddQuestion={openCreateQuestionForm}
          onClearSelection={clearSelection}
          onCreateQuiz={createQuizFromSelection}
          onEditQuestion={openEditQuestionForm}
          onLevelChange={pickLevel}
          onOpenAutoPick={() => setAutoPickOpen(true)}
          onPageChange={setQuestionPage}
          onSearchChange={changeSearch}
          onSelectAll={toggleVisibleQuestions}
          onSubjectChange={pickSubject}
          onToggleQuestion={toggleQuestion}
          onTopicChange={pickTopic}
          page={questionBankData.questionPage}
          searchValue={searchValue}
          selectedIds={selectedIds}
          subjects={subjects}
          title={activeLeaf.title}
          topicId={topicId}
          visibleQuestions={visibleQuestions}
        />
      ) : (
        <QuizBankPanel
          contentScope={contentScope}
          copy={copy}
          // B1 "Create quiz" starts in the question bank, where questions are picked.
          onCreateQuiz={() => void navigate({ href: adminContentPathForSection("questions") })}
          onKindChange={setQuizKind}
          onDeleteQuiz={deleteQuiz}
          onExportPortable={setPortableQuiz}
          onPreviewQuiz={openUpdateQuizPackage}
          onSearchChange={changeSearch}
          isLoading={isQuestionBankFetching}
          quizKind={quizKind}
          deletingQuizId={deleteQuizMutation.isPending ? deleteQuizMutation.variables : undefined}
          quizzes={visibleQuizzes}
          searchValue={searchValue}
          title={activeLeaf.title}
        />
      )}
      {autoPickOpen ? (
        <QuizAutoPickDialog
          availableCount={autoPickAvailableCount}
          copy={copy}
          count={autoCount}
          onClose={() => setAutoPickOpen(false)}
          onCountChange={(value) => setAutoCount(normalizeAutoCount(value))}
          onPick={() => { if (applyAutoPick()) setAutoPickOpen(false); }}
          onTopicToggle={toggleAutoTopic}
          topicIds={autoTopicIds}
          topics={levelTopics}
        />
      ) : null}
      {questionForm ? (
        <QuestionFormDialog
          copy={copy}
          draft={questionForm.draft}
          mode={questionForm.mode}
          onChange={(draft) => setQuestionForm((current) => (current ? { ...current, draft } : current))}
          onClose={() => setQuestionForm(null)}
          onSubmit={() => void submitQuestionForm(questionForm.draft)}
          saving={createQuestionMutation.isPending || updateQuestionMutation.isPending}
        />
      ) : null}
      {quizCreateDraft ? (
        <QuizCreatePackageDialog
          copy={copy}
          draft={quizCreateDraft}
          questions={selectedQuestions}
          onChange={setQuizCreateDraft}
          onClose={() => setQuizCreateDraft(null)}
          onSubmit={() => submitCreateQuizFromSelection(quizCreateDraft)}
        />
      ) : null}
      {quizPackageEdit ? (
        <QuizCreatePackageDialog
          copy={copy}
          description={copy.updatePackageDialogDescription(quizPackageEdit.quiz.questionCount)}
          draft={quizPackageEdit.draft}
          questions={quizPackageEditQuestions}
          submitLabel={copy.updatePackageConfirm}
          title={copy.updatePackageDialogTitle}
          onChange={(draft) => setQuizPackageEdit((current) => (current ? { ...current, draft } : current))}
          onClose={() => setQuizPackageEdit(null)}
          onSubmit={submitUpdateQuizPackage}
        />
      ) : null}
      {portableQuiz ? (
        <PortablePackageExportDialog onClose={() => setPortableQuiz(null)} open portal="lcms" quiz={portableQuiz} />
      ) : null}
    </DashboardPageShell>
  );
}

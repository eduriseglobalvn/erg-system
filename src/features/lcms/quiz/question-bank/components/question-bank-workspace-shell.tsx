import { useState } from "react";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import type { ContentScope } from "@/types/scope-types";
import { QuestionBankCompactHeader } from "./question-bank-compact-header";
import { enCopy, type QuestionBankCopy, viCopy, viPackageCopy } from "./question-bank-copy";
import { normalizeAutoCount } from "./question-bank-primitives";
import { QuestionBankStructurePanel as QuestionStructurePanel } from "./question-bank-structure-panel";
import { QuestionLibrary } from "./question-library";
import { QuestionBankSyncNotice, QuestionFormDialog } from "./question-form-dialog";
import { QuizBuilderPanel } from "./quiz-builder-panel";
import { QuizBankPanel } from "./quiz-bank-panel";
import { QuizCreatePackageDialog } from "./quiz-create-package-dialog";
import { useQuestionBankWorkspaceController } from "./use-question-bank-workspace";
import { PortablePackageExportDialog } from "@/features/portable-package-export/components/portable-package-export-dialog";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

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
    activeLevel, activeSubject, autoCount, autoPickedQuestions, autoTopicIds, changeSearch, createQuestionMutation,
    createQuizFromSelection, deleteQuiz, deleteQuizMutation, getTopicQuestionCount, isQuestionBankFetching,
    levelTopics, openEditQuestionForm, openUpdateQuizPackage, pickLevel, pickSubject, pickTopic, questionBankData,
    questionBankQuery, questionForm, quizCreateDraft, quizKind, quizPackageEdit, quizPackageEditQuestions,
    selectedIds, selectedQuestions, setAutoCount, setQuestionForm, setQuestionPage, setQuizCreateDraft,
    setQuizKind, setQuizPackageEdit, submitCreateQuizFromSelection, submitQuestionForm, submitUpdateQuizPackage,
    searchValue, subjectId, subjects, toggleAutoTopic, toggleQuestion, toggleVisibleQuestions, topicId, useAutoPick,
    updateQuestionMutation, view, visibleQuestions, visibleQuizzes,
  } = useQuestionBankWorkspaceController({ activeLeaf, contentScope, copy, onCreateQuiz });

  return (
    <DashboardPageShell
      title={activeLeaf.title}
      description={view === "questions" ? undefined : copy.description}
      breadcrumbs={view === "questions" ? [] : activeLeaf.breadcrumb}
      hideHeader={view === "questions" || view === "quizzes"}
      contentClassName={
        view === "questions" || view === "quizzes"
          ? "mx-0 w-full !max-w-none px-3 sm:px-4 lg:px-4 2xl:px-5"
          : undefined
      }
    >
      {questionBankQuery.isError ? (
        <QuestionBankSyncNotice
          message={copy.syncError}
          detail={questionBankQuery.error instanceof Error ? questionBankQuery.error.message : copy.syncErrorDetail}
        />
      ) : null}

      {view === "questions" ? (
        <div className="space-y-3">
          <QuestionBankCompactHeader
            title={activeLeaf.title}
          >
            <QuestionStructurePanel
              activeLevel={activeLevel}
              activeSubject={activeSubject}
              copy={copy}
              getTopicQuestionCount={getTopicQuestionCount}
              levelTopics={levelTopics}
              onLevelChange={pickLevel}
              onSubjectChange={pickSubject}
              onTopicChange={pickTopic}
              subjectId={subjectId}
              subjects={subjects}
              topicId={topicId}
            />
          </QuestionBankCompactHeader>
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <QuestionLibrary
              copy={copy}
              contentScope={contentScope}
              onQuestionSelectAll={toggleVisibleQuestions}
              onQuestionToggle={toggleQuestion}
              isLoading={isQuestionBankFetching}
              onEditQuestion={openEditQuestionForm}
              onSearchChange={changeSearch}
              onPageChange={setQuestionPage}
              page={questionBankData.questionPage}
              searchValue={searchValue}
              selectedIds={selectedIds}
              visibleQuestions={visibleQuestions}
            />
            <QuizBuilderPanel
              autoCount={autoCount}
              autoPickedQuestions={autoPickedQuestions}
              autoTopicIds={autoTopicIds}
              copy={copy}
              getTopicQuestionCount={(topicId) => getTopicQuestionCount(topicId, activeLevel.id)}
              levelTopics={levelTopics}
              onAutoCountChange={(value) => setAutoCount(normalizeAutoCount(value))}
              onAutoPick={useAutoPick}
              onCreateQuiz={createQuizFromSelection}
              onTopicToggle={toggleAutoTopic}
              selectedQuestions={selectedQuestions}
            />
          </div>
        </div>
      ) : (
        <QuizBankPanel
          contentScope={contentScope}
          copy={copy}
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
        />
      )}
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
        <PortablePackageExportDialog
          onClose={() => setPortableQuiz(null)}
          open
          portal="lcms"
          quiz={portableQuiz}
        />
      ) : null}
    </DashboardPageShell>
  );
}

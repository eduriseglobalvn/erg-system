import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { adminContentPathForSection } from "@/features/lcms/admin-content/admin-content-route";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import type { ContentScope } from "@/types/scope-types";
import { questionBankCopyFor } from "./question-bank-copy";
import { QuizBankPanel } from "./quiz-bank-panel";
import { QuizCreatePackageDialog } from "./quiz-create-package-dialog";
import { QuizQuickViewDrawer } from "./quiz-quick-view-drawer";
import { useQuestionBankWorkspaceController } from "./use-question-bank-workspace";
import { PortablePackageExportDialog } from "@/features/portable-package-export/components/portable-package-export-dialog";

/** "Ngân hàng bài tập": the packages built from the question bank. Questions themselves live in the quiz editor. */
export function QuestionBankWorkspace({
  activeLeaf,
  contentScope,
  onOpenQuiz,
}: {
  activeLeaf: DashboardLeaf;
  contentScope: ContentScope;
  onOpenQuiz?: (quizId: string) => void;
}) {
  const [portableQuiz, setPortableQuiz] = useState<QuizBankItem | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<QuizBankItem | null>(null);
  const navigate = useNavigate();
  const { locale } = useI18n();
  const copy = questionBankCopyFor(locale);
  const {
    activeLevel, activeSubject, changeSearch, deleteQuiz, deleteQuizMutation, isQuestionBankFetching,
    openUpdateQuizPackage, openingQuizId, pickLevel, pickSubject, publishQuiz, publishQuizMutation,
    questionBankQuery, quickViewQuiz, quickViewQuizQuestions, quizKind, quizKindCounts, quizPackageEdit,
    quizPackageEditQuestions, savingQuizPackage, setQuickViewQuiz, setQuizKind, setQuizPackageEdit,
    submitUpdateQuizPackage, searchValue, subjects, visibleQuizzes,
  } = useQuestionBankWorkspaceController({ contentScope, copy });

  return (
    <DashboardPageShell
      title={activeLeaf.title}
      breadcrumbs={[]}
      hideHeader
      contentClassName="mx-0 w-full !max-w-none px-3 sm:px-4 lg:px-6"
    >
      {questionBankQuery.isError ? (
        <Alert severity="warning">
          <AlertTitle>{copy.syncError}</AlertTitle>
          {questionBankQuery.error instanceof Error ? questionBankQuery.error.message : copy.syncErrorDetail}
        </Alert>
      ) : null}

      <QuizBankPanel
        activeLevel={activeLevel}
        activeSubject={activeSubject}
        contentScope={contentScope}
        copy={copy}
        kindCounts={quizKindCounts}
        onLevelChange={pickLevel}
        onSubjectChange={pickSubject}
        subjects={subjects}
        // Packages are made from questions picked in "Ngân hàng câu hỏi" (the quiz editor).
        onCreateQuiz={() => void navigate({ href: adminContentPathForSection("quiz-editor") })}
        onKindChange={setQuizKind}
        onDeleteQuiz={setQuizToDelete}
        onExportPortable={setPortableQuiz}
        onPreviewQuiz={setQuickViewQuiz}
        onPublishQuiz={(quiz) => void publishQuiz(quiz)}
        publishingQuizId={publishQuizMutation.isPending ? publishQuizMutation.variables?.quizId : undefined}
        onSearchChange={changeSearch}
        isLoading={isQuestionBankFetching}
        quizKind={quizKind}
        deletingQuizId={deleteQuizMutation.isPending ? deleteQuizMutation.variables : undefined}
        quizzes={visibleQuizzes}
        searchValue={searchValue}
        title={activeLeaf.title}
      />
      <ErgConfirmDialog
        open={quizToDelete !== null}
        title={quizToDelete ? copy.confirmDeleteQuiz(quizToDelete.title) : ""}
        confirmLabel={copy.deleteQuiz}
        cancelLabel={copy.cancel}
        destructive
        loading={deleteQuizMutation.isPending}
        onCancel={() => setQuizToDelete(null)}
        onConfirm={() => quizToDelete && void deleteQuiz(quizToDelete).finally(() => setQuizToDelete(null))}
      />
      {quickViewQuiz ? (
        <QuizQuickViewDrawer
          copy={copy}
          deleting={deleteQuizMutation.isPending}
          onClose={() => setQuickViewQuiz(null)}
          onDelete={deleteQuiz}
          onEdit={onOpenQuiz ? (quiz) => onOpenQuiz(quiz.id) : undefined}
          onExportPortable={setPortableQuiz}
          onOpenSettings={(quiz) => void openUpdateQuizPackage(quiz)}
          openingSettings={openingQuizId === quickViewQuiz.id}
          questions={quickViewQuizQuestions}
          quiz={quickViewQuiz}
        />
      ) : null}
      {quizPackageEdit ? (
        <QuizCreatePackageDialog
          copy={copy}
          draft={quizPackageEdit.draft}
          mode="update"
          questions={quizPackageEditQuestions}
          onChange={(draft) => setQuizPackageEdit((current) => (current ? { ...current, draft } : current))}
          onClose={() => setQuizPackageEdit(null)}
          saving={savingQuizPackage}
          onSubmit={() => void submitUpdateQuizPackage()}
        />
      ) : null}
      {portableQuiz ? (
        <PortablePackageExportDialog onClose={() => setPortableQuiz(null)} open portal="lcms" quiz={portableQuiz} />
      ) : null}
    </DashboardPageShell>
  );
}

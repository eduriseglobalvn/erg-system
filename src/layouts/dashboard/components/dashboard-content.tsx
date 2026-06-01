import {
  ClassListWorkspace,
  ClassReportsWorkspace,
  ClassStudentsWorkspace,
  OverviewWorkspace,
} from "@/features/lms/classroom";
import { AdminOperationsWorkspace } from "@/features/lcms/admin-operations";
import { DashboardPlaceholderWorkspace } from "@/layouts/dashboard/components/dashboard-placeholder-workspace";
import { QuizEditorWorkspace } from "@/layouts/dashboard/components/quiz-editor-workspace";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { PublicDisclosureAdminWorkspace } from "@/features/lcms/public-disclosure";
import { QuestionBankWorkspace } from "@/features/lcms/quiz/question-bank";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { SeoCrmWorkspace } from "@/features/crm/seo";
import type { ContentScope, ManagementScope } from "@/types/scope-types";

export function DashboardContent({
  activeLeaf,
  canAccessGlobalErg,
  contentScope,
  deniedSchoolName,
  managementScope,
  onOpenLeaf,
  pendingQuestionImports,
  selectedClassId,
  selectedSchoolId,
  onQuestionImportsHandled,
  onCreateQuizFromBank,
}: {
  activeLeaf: DashboardLeaf;
  canAccessGlobalErg: boolean;
  contentScope: ContentScope;
  deniedSchoolName?: string;
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: string) => void;
  pendingQuestionImports: QuestionBankQuestion[];
  selectedClassId: string;
  selectedSchoolId: string;
  onQuestionImportsHandled: () => void;
  onCreateQuizFromBank: (questions: QuestionBankQuestion[]) => void;
}) {
  if (deniedSchoolName) {
    return <AccessDeniedWorkspace deniedSchoolName={deniedSchoolName} />;
  }

  if (activeLeaf.variant.startsWith("admin-")) {
    if (activeLeaf.variant === "admin-public-disclosure") {
      return <PublicDisclosureAdminWorkspace />;
    }

    return (
      <AdminOperationsWorkspace
        activeLeaf={activeLeaf}
        managementScope={managementScope}
        onOpenLeaf={onOpenLeaf}
      />
    );
  }

  if (activeLeaf.variant.startsWith("seo-")) {
    return <SeoCrmWorkspace activeLeaf={activeLeaf} onOpenLeaf={onOpenLeaf} />;
  }

  if (activeLeaf.variant === "quiz-editor") {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background pl-1">
        <QuizEditorWorkspace
          activeLeaf={activeLeaf}
          pendingImportedQuestions={pendingQuestionImports}
          onImportedQuestionsHandled={onQuestionImportsHandled}
        />
      </div>
    );
  }

  if (activeLeaf.variant === "overview") {
    return (
      <OverviewWorkspace
        activeLeaf={activeLeaf}
        managementScope={managementScope}
        mode="center"
        onOpenLeaf={onOpenLeaf}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  if (activeLeaf.variant === "school-pulse") {
    return (
      <OverviewWorkspace
        activeLeaf={activeLeaf}
        managementScope={managementScope}
        mode="school"
        onOpenLeaf={onOpenLeaf}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  if (activeLeaf.variant === "question-bank" || activeLeaf.variant === "quiz-bank") {
    return (
      <QuestionBankWorkspace
        activeLeaf={activeLeaf}
        canManageGlobalContent={canAccessGlobalErg}
        contentScope={contentScope}
        onCreateQuiz={onCreateQuizFromBank}
      />
    );
  }

  if (activeLeaf.variant === "class-students") {
    return (
      <ClassStudentsWorkspace
        activeLeaf={activeLeaf}
        onOpenLeaf={onOpenLeaf}
        selectedClassId={selectedClassId}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  if (activeLeaf.variant === "class-active" || activeLeaf.variant === "class-ended") {
    return (
      <ClassListWorkspace
        activeLeaf={activeLeaf}
        mode={activeLeaf.variant === "class-active" ? "active" : "ended"}
        onOpenLeaf={onOpenLeaf}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  if (activeLeaf.variant === "class-reports") {
    return (
      <ClassReportsWorkspace
        activeLeaf={activeLeaf}
        onOpenLeaf={onOpenLeaf}
        selectedClassId={selectedClassId}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  return <DashboardPlaceholderWorkspace activeLeaf={activeLeaf} onOpenLeaf={onOpenLeaf} />;
}

function AccessDeniedWorkspace({ deniedSchoolName }: { deniedSchoolName: string }) {
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-slate-50 px-5 py-8">
      <section className="w-full max-w-[720px] rounded-[32px] border border-rose-200 bg-white p-8 text-center shadow-[0_28px_80px_-42px_rgba(15,23,42,0.38)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-2xl font-semibold text-rose-700">
          403
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Access denied</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Tài khoản giáo viên hiện tại chưa có quyền truy cập dữ liệu của <strong>{deniedSchoolName}</strong>.
          Vui lòng chọn trường được cấp quyền ở menu bên trái hoặc liên hệ quản trị viên để mở quyền.
        </p>
      </section>
    </main>
  );
}

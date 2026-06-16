import { Box, Paper, Typography } from "@mui/material";
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
      <Box sx={{ bgcolor: "background.default", flex: 1, height: "100%", minHeight: 0, minWidth: 0, overflow: "hidden", pl: 0.5 }}>
        <QuizEditorWorkspace
          activeLeaf={activeLeaf}
          pendingImportedQuestions={pendingQuestionImports}
          onImportedQuestionsHandled={onQuestionImportsHandled}
        />
      </Box>
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
    <Box
      component="main"
      sx={{
        alignItems: "center",
        bgcolor: "#F8FAFC",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflowY: "auto",
        px: 2.5,
        py: 4,
      }}
    >
      <Paper sx={{ maxWidth: 720, p: 4, textAlign: "center", width: "100%" }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(255, 86, 48, 0.12)",
            borderRadius: 1,
            color: "#B71D18",
            display: "grid",
            fontSize: 20,
            fontWeight: 600,
            height: 56,
            justifyContent: "center",
            mx: "auto",
            width: 56,
          }}
        >
          403
        </Box>
        <Typography component="h1" sx={{ color: "#0F172A", fontSize: 20, fontWeight: 600, mt: 2.5 }}>
          Access denied
        </Typography>
        <Typography sx={{ color: "#637381", fontSize: 14, lineHeight: "24px", mt: 1.5 }}>
          Tài khoản giáo viên hiện tại chưa có quyền truy cập dữ liệu của <strong>{deniedSchoolName}</strong>.
          Vui lòng chọn trường được cấp quyền ở menu bên trái hoặc liên hệ quản trị viên để mở quyền.
        </Typography>
      </Paper>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { lazy, Suspense, type ComponentType } from "react";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { ContentScope, ManagementScope } from "@/types/scope-types";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

const AdminOperationsWorkspace = lazyNamed(
  () => import("@/features/lcms/admin-operations/components/admin-operations-workspace"),
  "AdminOperationsWorkspace",
);
const ClassListWorkspace = lazyNamed(
  () => import("@/features/lms/classroom/components/class-list-workspace"),
  "ClassListWorkspace",
);
const ClassReportsWorkspace = lazyNamed(
  () => import("@/features/lms/classroom/components/class-reports-workspace"),
  "ClassReportsWorkspace",
);
const ClassStudentsWorkspace = lazyNamed(
  () => import("@/features/lms/classroom/components/class-students-workspace"),
  "ClassStudentsWorkspace",
);
const DashboardPlaceholderWorkspace = lazyNamed(
  () => import("@/layouts/dashboard/components/dashboard-placeholder-workspace"),
  "DashboardPlaceholderWorkspace",
);
const OverviewWorkspace = lazyNamed(
  () => import("@/features/lms/classroom/components/overview-workspace"),
  "OverviewWorkspace",
);
const QuestionBankWorkspace = lazyNamed(
  () => import("@/features/lcms/quiz/question-bank/components/question-bank-workspace"),
  "QuestionBankWorkspace",
);
const QuizEditorWorkspace = lazyNamed(
  () => import("@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace"),
  "QuizEditorWorkspace",
);
const SeoCrmWorkspace = lazyNamed(
  () => import("@/features/crm/seo/components/seo-crm-workspace"),
  "SeoCrmWorkspace",
);

function lazyNamed<T extends Record<string, unknown>, K extends keyof T>(loader: () => Promise<T>, key: K) {
  return lazy(async () => ({ default: (await loader())[key] as ComponentType<any> }));
}

export function DashboardContent(props: Parameters<typeof DashboardContentInner>[0]) {
  return (
    <Suspense fallback={<DashboardContentFallback />}>
      <DashboardContentInner {...props} />
    </Suspense>
  );
}

function DashboardContentInner({
  activeLeaf,
  adminCenters = [],
  adminClasses = [],
  contentScope,
  deniedSchoolName,
  managementScope,
  onOpenLeaf,
  onOpenQuiz,
  pendingQuestionImports,
  quizEditorQuizId,
  selectedClassId,
  selectedSchoolId,
  onQuestionImportsHandled,
  onCreateQuizFromBank,
}: {
  activeLeaf: DashboardLeaf;
  adminCenters?: ClassroomSchool[];
  adminClasses?: ClassroomSnapshot[];
  canAccessGlobalErg: boolean;
  contentScope: ContentScope;
  deniedSchoolName?: string;
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: string) => void;
  onOpenQuiz?: (quizId: string) => void;
  pendingQuestionImports: QuestionBankQuestion[];
  quizEditorQuizId?: string | null;
  selectedClassId: string;
  selectedSchoolId: string;
  onQuestionImportsHandled: () => void;
  onCreateQuizFromBank: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
}) {
  if (deniedSchoolName) {
    return <AccessDeniedWorkspace deniedSchoolName={deniedSchoolName} />;
  }

  if (activeLeaf.variant.startsWith("admin-")) {
    return (
      <AdminOperationsWorkspace
        activeLeaf={activeLeaf}
        centers={adminCenters}
        classes={adminClasses}
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
          quizId={quizEditorQuizId}
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
        schools={adminCenters}
        snapshots={adminClasses}
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
        schools={adminCenters}
        snapshots={adminClasses}
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
        contentScope={contentScope}
        onCreateQuiz={onCreateQuizFromBank}
        onOpenQuiz={onOpenQuiz}
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
        schools={adminCenters}
        snapshots={adminClasses}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  if (activeLeaf.variant === "class-reports") {
    return (
      <ClassReportsWorkspace
        activeLeaf={activeLeaf}
        onOpenLeaf={onOpenLeaf}
        snapshots={adminClasses}
        selectedClassId={selectedClassId}
        selectedSchoolId={selectedSchoolId}
      />
    );
  }

  return <DashboardPlaceholderWorkspace activeLeaf={activeLeaf} onOpenLeaf={onOpenLeaf} />;
}

function DashboardContentFallback() {
  return (
    <Stack spacing={1.5} sx={{ p: 2.5 }}>
      <Skeleton height={36} variant="rounded" width="35%" />
      <Skeleton height={180} variant="rounded" />
      <Skeleton height={180} variant="rounded" />
    </Stack>
  );
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

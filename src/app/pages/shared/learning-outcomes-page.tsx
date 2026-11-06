import {
  LearningOutcomesAdminWorkspace,
  LearningOutcomesTeacherWorkspace,
  type LearningOutcomeWorkspace,
} from "@/features/lms/learning-paths";
import { StudentLearningOutcomesWorkspace } from "@/features/elearning/competencies";
import { BackToWorkspaceBar } from "@/app/pages/shared/back-to-workspace-bar";

export function LearningOutcomesPage({ workspace }: { workspace: LearningOutcomeWorkspace }) {
  if (workspace === "ADMIN") return <LearningOutcomesAdminWorkspace />;
  if (workspace === "STUDENT") {
    return (
      <>
        <BackToWorkspaceBar href="/student" />
        <StudentLearningOutcomesWorkspace />
      </>
    );
  }
  return <LearningOutcomesTeacherWorkspace />;
}

export default LearningOutcomesPage;

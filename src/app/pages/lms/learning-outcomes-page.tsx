import {
  LearningOutcomesAdminWorkspace,
  LearningOutcomesTeacherWorkspace,
  type LearningOutcomeWorkspace,
} from "@/features/lms/learning-paths";
import { StudentLearningOutcomesWorkspace } from "@/features/elearning/competencies";

export function LearningOutcomesPage({ workspace }: { workspace: LearningOutcomeWorkspace }) {
  if (workspace === "ADMIN") return <LearningOutcomesAdminWorkspace />;
  if (workspace === "STUDENT") return <StudentLearningOutcomesWorkspace />;
  return <LearningOutcomesTeacherWorkspace />;
}

export default LearningOutcomesPage;

import { createContext, useContext } from "react";

import type { MenuItem } from "@/components/portal/ErgPortalLayout";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

/** Shell state shared with the Admin child routes rendered in its Outlet. */
export type AdminShellModel = {
  activeItem: MenuItem | undefined;
  activeLeaf: DashboardLeaf | null;
  isPreservedWorkspace: boolean;
  legacyPathname: string;
  pendingQuestionImports: QuestionBankQuestion[];
  quizEditorQuizId: string | null;
  tenantId: string;
  onClearQuestionImports: () => void;
  onCreateQuizFromBank: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
  onOpenLeaf: (leafId: string) => void;
};

export const AdminShellContext = createContext<AdminShellModel | null>(null);

export function useAdminShellModel(): AdminShellModel {
  const model = useContext(AdminShellContext);
  if (!model) throw new Error("useAdminShellModel must be used inside AdminErgPortalShell");
  return model;
}

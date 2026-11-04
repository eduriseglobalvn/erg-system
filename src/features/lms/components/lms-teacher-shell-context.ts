import { createContext, useContext } from "react";

import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";

/** Shell state (selected school/class, runs, navigation) shared with the child routes rendered in its Outlet. */
export const LmsTeacherShellContext = createContext<LmsTeacherShellController | null>(null);

export function useLmsTeacherShellModel(): LmsTeacherShellController {
  const model = useContext(LmsTeacherShellContext);
  if (!model) throw new Error("useLmsTeacherShellModel must be used inside LmsTeacherShell");
  return model;
}

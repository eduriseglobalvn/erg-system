import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";
import { isStudentPreviewSession } from "@/platform/auth/permissions/workspace-capability-projection";

/** True when the signed-in staff member sees the student portal only through preview. */
export function useIsStudentPreview(): boolean {
  const session = readStoredAuthSession();
  return Boolean(session) && isStudentPreviewSession(session ?? {});
}

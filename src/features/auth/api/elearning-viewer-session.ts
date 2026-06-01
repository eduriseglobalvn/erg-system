import { getCurrentAccount, logoutAccount } from "@/features/auth/api/auth-storage";
import { readStoredAuthSession } from "@/features/auth/api/auth-token-storage";
import { getCurrentStudentSession, logoutStudentSession, type StudentSession } from "@/features/auth/api/student-auth-storage";

export type ElearningViewerSession = StudentSession & {
  schoolName?: string;
  title?: string;
  viewerKind: "student" | "teacher";
};

export function getCurrentElearningViewerSession(): ElearningViewerSession | null {
  const studentSession = getCurrentStudentSession();
  if (studentSession) {
    return {
      ...studentSession,
      viewerKind: "student",
    };
  }

  const teacherAccount = getCurrentAccount();
  if (!teacherAccount) return null;

  const teacherSession = readStoredAuthSession("lms") ?? readStoredAuthSession("lcms") ?? readStoredAuthSession();

  return {
    accessToken: teacherSession?.accessToken,
    className: teacherAccount.title || "Giáo viên",
    email: teacherAccount.email,
    id: teacherAccount.id,
    loggedInAt: teacherAccount.lastLoginAt ?? teacherAccount.createdAt,
    name: teacherAccount.fullName,
    portal: "elearning",
    refreshToken: teacherSession?.refreshToken,
    rememberMe: true,
    schoolName: teacherAccount.department,
    title: teacherAccount.title,
    viewerKind: "teacher",
  };
}

export function logoutElearningViewerSession() {
  logoutStudentSession();
  logoutAccount();
}

import { useState } from "react";
import { useSchoolManagementContext } from "@/features/lcms/school-management/components/school-management-context";
import { StudentCredentialsDialog, type StudentCredentialsResult } from "@/features/lcms/school-management/components/setup/student-credentials-dialog";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";
import { buildStudentLogins } from "@/features/lcms/school-management/utils/student-account-credentials";

/**
 * Every student import creates the logins too (active, learner role, no onboarding). Students imported without one
 * could not sign in and showed "Chưa có tài khoản" to their teacher (19/11/2026: 655 students). Re-importing the same
 * sheet gives a login to every student that still has none; the ones that have one are left as they are.
 */
export function useStudentImportWithAccounts(onCredentialsClose?: () => void) {
  const { addStudents, selectedSchool } = useSchoolManagementContext();
  const [credentials, setCredentials] = useState<StudentCredentialsResult | null>(null);

  /** Returns true when the credentials dialog opened (some logins were created now). */
  async function importStudents(rows: StudentImportRow[], classIdOf?: (row: StudentImportRow) => string | undefined) {
    if (!selectedSchool || rows.length === 0) return false;
    const logins = buildStudentLogins(rows, selectedSchool.name);
    // A student already on the roster keeps the account it has: the backend returns it untouched (replayed), so no password is shown for it (BUG-X-004).
    const saved = await addStudents(
      rows.map((row, index) => ({
        // Blank code: the backend issues one (HS-XXXXXX) and recognises a returning child by name + birthday.
        code: row.code,
        fullName: row.fullName,
        birthDate: row.birthDate,
        grade: row.grade,
        className: row.className,
        ...(classIdOf ? { academicClassId: classIdOf(row) } : {}),
        guardianPhone: row.guardianPhone,
        subjectIds: [],
        status: "studying" as const,
        account: logins[index],
      })),
    );
    // Only logins the backend confirms (same username, linked account) were created now; the rest already had one.
    // saved is in row order; the backend may number a login that another school already uses (BUG-A-003), so its username is the one shown.
    const sheetOrder = logins.map((login, index) => {
      const item = saved[index];
      return login && item?.authUserId && item.username && !item.replayed ? { ...login, username: item.username } : null;
    });
    const issued = rows.flatMap((row, index) => {
      const login = sheetOrder[index];
      return login ? [{ code: saved[index].studentCode, fullName: row.fullName, className: row.className, ...login }] : [];
    });
    if (!issued.length) return false;
    setCredentials({ rows: issued, sheetOrder, skipped: rows.length - issued.length });
    return true;
  }

  const credentialsDialog = credentials ? (
    <StudentCredentialsDialog
      onClose={() => {
        setCredentials(null);
        onCredentialsClose?.();
      }}
      result={credentials}
    />
  ) : null;

  return { credentialsDialog, importStudents };
}

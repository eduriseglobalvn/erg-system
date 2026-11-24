import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useStudentImportWithAccounts } from "@/features/lcms/school-management/hooks/use-student-import-with-accounts";
import type { StudentImportRow } from "@/features/lcms/school-management/types/school-management-types";

const addStudents = vi.fn();
vi.mock("@/features/lcms/school-management/components/school-management-context", () => ({
  useSchoolManagementContext: () => ({ addStudents, selectedSchool: { id: "s1", name: "THCS Trương Công Định" } }),
}));

const row = (fullName: string, className: string): StudentImportRow => ({
  id: fullName, code: "", fullName, birthDate: "", grade: "6", className, guardianPhone: "", note: "", valid: true,
});

describe("useStudentImportWithAccounts", () => {
  it("asks for a login on every row and shows only the ones created now", async () => {
    addStudents.mockImplementation(async (rows: Array<{ account?: { username: string } }>) => [
      { studentCode: "HS-1", authUserId: "u1", username: rows[0]!.account!.username, replayed: false },
      // Already had an account: kept as is, so no password is handed out for it.
      { studentCode: "HS-2", authUserId: "u2", username: "old.login", replayed: true },
    ]);
    const { result } = renderHook(() => useStudentImportWithAccounts());

    let opened = false;
    await act(async () => {
      opened = await result.current.importStudents([row("Nguyễn Văn A", "6A1"), row("Trần Thị B", "6A2")], (item) => `id-${item.className}`);
    });

    const sent = addStudents.mock.calls[0]![0] as Array<{ account?: { username: string }; academicClassId?: string }>;
    expect(sent.map((item) => item.account?.username.startsWith("thcstcd."))).toEqual([true, true]);
    expect(sent.map((item) => item.academicClassId)).toEqual(["id-6A1", "id-6A2"]);
    expect(opened).toBe(true);
    expect(result.current.credentialsDialog).not.toBeNull();
  });

  it("opens no dialog when every student already had a login", async () => {
    addStudents.mockResolvedValue([{ studentCode: "HS-2", authUserId: "u2", username: "old.login", replayed: true }]);
    const { result } = renderHook(() => useStudentImportWithAccounts());
    let opened = true;
    await act(async () => {
      opened = await result.current.importStudents([row("Trần Thị B", "6A2")]);
    });
    expect(opened).toBe(false);
    expect(result.current.credentialsDialog).toBeNull();
  });
});

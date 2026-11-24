import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { parseClassNameAndGrade } from "@/features/lcms/school-management/utils/vietnamese-school-sheet-parser";
import { ApiClientError } from "@/lib/api-client";
import {
  activateAcademicYear,
  archiveSchool,
  restoreSchool,
  bulkEnrollSchoolStudents,
  closeAcademicYear,
  createAcademicYear,
  createSchoolClass,
  createGrade,
  createSchool,
  createSchoolStudent,
  importSchoolStudents,
  importSchoolStudentsWithAccounts,
  updateSchoolClass,
  getSchoolDirectory,
  getSchoolOperations,
  schoolManagementQueryKeys,
  syncDefaultGrades,
  updateGrade,
  updateSchool,
} from "@/features/lcms/school-management/api/school-management-api";
import { isWorkingSchool, type SchoolClass, type SchoolDraft, type SchoolStudent } from "@/features/lcms/school-management/types/school-management-types";
import type { OperationalClassRecord, SchoolClassInput, SchoolStudentAccountInput, SchoolStudentInput } from "@/features/lcms/school-management/api/school-management-api";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";

export function useSchoolManagement(initialSchoolId?: string | null) {
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId ?? "");
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  const directoryQuery = useQuery({
    queryKey: schoolManagementQueryKeys.directory(tenantId, accountId),
    queryFn: ({ signal }) => getSchoolDirectory("", signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
  const directorySchools = useMemo(() => directoryQuery.data?.items ?? [], [directoryQuery.data]);

  // Follow the URL only when it changes, so create/archive selections are not reverted to the stale param.
  const [seenSchoolId, setSeenSchoolId] = useState(initialSchoolId);
  if (initialSchoolId !== seenSchoolId) {
    setSeenSchoolId(initialSchoolId);
    if (initialSchoolId) setSelectedSchoolId(initialSchoolId);
  }

  useEffect(() => {
    if (!directorySchools.length) return;
    if (!selectedSchoolId) {
      setSelectedSchoolId((directorySchools.find(isWorkingSchool) ?? directorySchools[0]).id);
    }
  }, [directorySchools, selectedSchoolId]);

  const operationsQuery = useQuery({
    queryKey: schoolManagementQueryKeys.operations(tenantId, accountId, selectedSchoolId),
    queryFn: ({ signal }) => getSchoolOperations(selectedSchoolId, signal),
    enabled: Boolean(selectedSchoolId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });

  const schools = useMemo(() => directorySchools.map((school) => (
    school.id === selectedSchoolId && operationsQuery.data ? operationsQuery.data : school
  )), [directorySchools, operationsQuery.data, selectedSchoolId]);
  const selectedSchool = operationsQuery.data
    ?? schools.find((school) => school.id === selectedSchoolId)
    ?? null;

  const refreshSchoolData = useCallback(async (schoolId?: string) => {
    await queryClient.invalidateQueries({ queryKey: schoolManagementQueryKeys.directory(tenantId, accountId) });
    // Classes and rosters edited here are what the teacher class pages read; drop them so this user sees the change at once.
    void queryClient.invalidateQueries({ queryKey: lmsAssignmentReadQueryKeys.classWorkspaceRoot });
    if (schoolId) {
      await queryClient.invalidateQueries({
        queryKey: schoolManagementQueryKeys.operations(tenantId, accountId, schoolId),
      });
      void queryClient.invalidateQueries({ queryKey: schoolManagementQueryKeys.students(tenantId, accountId, schoolId) });
    }
  }, [accountId, queryClient, tenantId]);

  const saveMutation = useMutation({
    mutationFn: async ({ draft, schoolId, version }: { draft: SchoolDraft; schoolId?: string; version?: number }) => {
      try {
        return await (schoolId ? updateSchool(schoolId, version, draft) : createSchool(draft));
      } catch (error) {
        // Backend gửi câu tiếng Anh khi trùng tên; đổi sang tiếng Việt cho người dùng.
        if (error instanceof ApiClientError && error.status === 409 && /name already exists/i.test(error.message)) {
          throw new ApiClientError("Tên trường đã tồn tại. Vui lòng nhập tên khác.", error.code, error.status, error.details, error.requestId);
        }
        throw error;
      }
    },
  });
  const archiveMutation = useMutation({ mutationFn: archiveSchool });
  const restoreMutation = useMutation({ mutationFn: restoreSchool });
  const yearCreateMutation = useMutation({ mutationFn: ({ schoolId, input }: { schoolId: string; input: Parameters<typeof createAcademicYear>[1] }) => createAcademicYear(schoolId, input) });
  const yearActivateMutation = useMutation({ mutationFn: ({ schoolId, yearId, version }: { schoolId: string; yearId: string; version: number }) => activateAcademicYear(schoolId, yearId, version) });
  const yearCloseMutation = useMutation({ mutationFn: ({ schoolId, yearId, version }: { schoolId: string; yearId: string; version: number }) => closeAcademicYear(schoolId, yearId, version) });
  const gradeSyncMutation = useMutation({ mutationFn: syncDefaultGrades });
  const gradeCreateMutation = useMutation({ mutationFn: ({ schoolId, input }: { schoolId: string; input: Parameters<typeof createGrade>[1] }) => createGrade(schoolId, input) });
  const gradeUpdateMutation = useMutation({ mutationFn: ({ schoolId, gradeId, input }: { schoolId: string; gradeId: string; input: Parameters<typeof updateGrade>[2] }) => updateGrade(schoolId, gradeId, input) });
  const classCreateMutation = useMutation({ mutationFn: ({ schoolId, input }: { schoolId: string; input: SchoolClassInput }) => createSchoolClass(schoolId, input) });
  const classUpdateMutation = useMutation({ mutationFn: ({ schoolId, classId, version, input }: { schoolId: string; classId: string; version: number; input: Partial<SchoolClassInput> }) => updateSchoolClass(schoolId, classId, version, input) });
  const studentCreateMutation = useMutation({ mutationFn: ({ schoolId, input }: { schoolId: string; input: SchoolStudentInput }) => createSchoolStudent(schoolId, input) });
  const studentImportMutation = useMutation({ mutationFn: ({ schoolId, items }: { schoolId: string; items: SchoolStudentInput[] }) => importSchoolStudents(schoolId, items) });
  const enrollmentMutation = useMutation({ mutationFn: ({ items }: { items: Array<{ studentId: string; classId: string; academicYear?: string | null }> }) => bulkEnrollSchoolStudents(items) });

  const saveSchool = useCallback(async (draft: SchoolDraft, schoolId?: string) => {
    const version = selectedSchool && schoolId === selectedSchool.id ? selectedSchool.version : schools.find((school) => school.id === schoolId)?.version;
    const result = await saveMutation.mutateAsync({ draft, schoolId, version });
    const resolvedId = result.id;
    setSelectedSchoolId(resolvedId);
    await refreshSchoolData(resolvedId);
    return resolvedId;
  }, [refreshSchoolData, saveMutation, schools, selectedSchool]);

  // Archive keeps the school selected: the detail screen then shows it as archived with a restore button.
  const archiveSchoolById = useCallback(async (schoolId: string) => {
    await archiveMutation.mutateAsync(schoolId);
    await refreshSchoolData(schoolId);
  }, [archiveMutation, refreshSchoolData]);

  const restoreSchoolById = useCallback(async (schoolId: string) => {
    await restoreMutation.mutateAsync(schoolId);
    await refreshSchoolData(schoolId);
  }, [refreshSchoolData, restoreMutation]);

  const createYear = useCallback(async (input: Parameters<typeof createAcademicYear>[1]) => {
    if (!selectedSchoolId) return;
    await yearCreateMutation.mutateAsync({ schoolId: selectedSchoolId, input });
    await refreshSchoolData(selectedSchoolId);
  }, [refreshSchoolData, selectedSchoolId, yearCreateMutation]);

  const activateYear = useCallback(async (yearId: string, version: number) => {
    if (!selectedSchoolId) return;
    await yearActivateMutation.mutateAsync({ schoolId: selectedSchoolId, yearId, version });
    await refreshSchoolData(selectedSchoolId);
  }, [refreshSchoolData, selectedSchoolId, yearActivateMutation]);

  const closeYear = useCallback(async (yearId: string, version: number) => {
    if (!selectedSchoolId) return;
    await yearCloseMutation.mutateAsync({ schoolId: selectedSchoolId, yearId, version });
    await refreshSchoolData(selectedSchoolId);
  }, [refreshSchoolData, selectedSchoolId, yearCloseMutation]);

  const syncGrades = useCallback(async () => {
    if (!selectedSchoolId) return;
    await gradeSyncMutation.mutateAsync(selectedSchoolId);
    await refreshSchoolData(selectedSchoolId);
  }, [gradeSyncMutation, refreshSchoolData, selectedSchoolId]);

  const addGradeRecord = useCallback(async (input: Parameters<typeof createGrade>[1]) => {
    if (!selectedSchoolId) return;
    await gradeCreateMutation.mutateAsync({ schoolId: selectedSchoolId, input });
    await refreshSchoolData(selectedSchoolId);
  }, [gradeCreateMutation, refreshSchoolData, selectedSchoolId]);

  const editGradeRecord = useCallback(async (gradeId: string, input: Parameters<typeof updateGrade>[2]) => {
    if (!selectedSchoolId) return;
    await gradeUpdateMutation.mutateAsync({ schoolId: selectedSchoolId, gradeId, input });
    await refreshSchoolData(selectedSchoolId);
  }, [gradeUpdateMutation, refreshSchoolData, selectedSchoolId]);

  const addClasses = useCallback(async (rows: Array<Omit<SchoolClass, "id">>) => {
    if (!selectedSchoolId) return [];
    const created: OperationalClassRecord[] = [];
    for (const row of rows) {
      const res = await classCreateMutation.mutateAsync({
        schoolId: selectedSchoolId,
        input: {
          name: row.name,
          grade: row.grade || undefined,
          academicYear: row.academicYear || selectedSchool?.academicYear || undefined,
          homeroomTeacherId: row.homeroomTeacherId || undefined,
          status: row.status || "ACTIVE",
        },
      });
      created.push(res);
    }
    await refreshSchoolData(selectedSchoolId);
    return created;
  }, [classCreateMutation, refreshSchoolData, selectedSchool, selectedSchoolId]);

  const addStudents = useCallback(async (rows: Array<Omit<SchoolStudent, "id">>) => {
    if (!selectedSchoolId) return [];
    const items = rows.map((row) => toStudentInput(row, selectedSchool));
    // A row naming a class the school does not have used to be saved with no class, silently (BUG-B-005, BUG-B-009).
    // Now the class is created first (the import dialog lists them before the user confirms), so a sheet with new classes imports in one go.
    const missing = [...new Map(rows.filter((row, index) => row.className.trim() && !items[index].academicClassId).map((row) => [row.className.trim().toLowerCase(), row])).values()];
    const createdIds = new Map<string, string>();
    for (const row of missing) {
      const created = await classCreateMutation.mutateAsync({
        schoolId: selectedSchoolId,
        input: { name: row.className.trim(), grade: row.grade || parseClassNameAndGrade(row.className).grade || undefined, academicYear: selectedSchool?.academicYear || undefined, status: "ACTIVE" },
      });
      createdIds.set(row.className.trim().toLowerCase(), created.id);
    }
    items.forEach((item, index) => { item.academicClassId ||= createdIds.get(rows[index].className.trim().toLowerCase()); });
    // Returned in row order: callers match a row to its saved student (and login) by index, since a blank code is issued by the backend.
    const saved: Array<{ studentCode: string; username?: string | null; authUserId?: string | null; replayed?: boolean }> = new Array(items.length);
    // Rows that ask for a login go over REST (GraphQL variables must not carry passwords); the rest keep the old path.
    const accountRows = items.flatMap((item, index) => ("password" in item ? [index] : []));
    const plainRows = items.flatMap((item, index) => ("password" in item ? [] : [index]));
    if (accountRows.length) {
      const result = await importSchoolStudentsWithAccounts(selectedSchoolId, accountRows.map((index) => items[index] as SchoolStudentAccountInput));
      const replayed = new Set(result.replayedStudentIds);
      result.items.forEach((item, i) => { saved[accountRows[i]] = { ...item, replayed: replayed.has(item.id) }; });
    }
    const plain = plainRows.map((index) => items[index]);
    if (plain.length > 1) (await studentImportMutation.mutateAsync({ schoolId: selectedSchoolId, items: plain })).items.forEach((item, i) => { saved[plainRows[i]] = item; });
    else if (plain[0]) saved[plainRows[0]] = await studentCreateMutation.mutateAsync({ schoolId: selectedSchoolId, input: plain[0] });
    await refreshSchoolData(selectedSchoolId);
    return saved;
  }, [classCreateMutation, refreshSchoolData, selectedSchool, selectedSchoolId, studentCreateMutation, studentImportMutation]);

  const updateClassGrade = useCallback(async (classId: string, grade: string) => {
    if (!selectedSchoolId) return;
    const classroom = selectedSchool?.classes.find((item) => item.id === classId);
    if (!classroom || classroom.version === undefined) return;
    await classUpdateMutation.mutateAsync({ schoolId: selectedSchoolId, classId, version: classroom.version, input: { grade } });
    await refreshSchoolData(selectedSchoolId);
  }, [classUpdateMutation, refreshSchoolData, selectedSchool, selectedSchoolId]);

  const enrollStudentsInClass = useCallback(async (studentIds: string[], classId: string, academicYear?: string) => {
    if (!selectedSchoolId || !classId || !studentIds.length) return;
    await enrollmentMutation.mutateAsync({
      items: studentIds.map((studentId) => ({ studentId, classId, academicYear: academicYear || selectedSchool?.academicYear || undefined })),
    });
    await refreshSchoolData(selectedSchoolId);
  }, [enrollmentMutation, refreshSchoolData, selectedSchool, selectedSchoolId]);

  return {
    addClasses,
    addStudents,
    enrollStudentsInClass,
    updateClassGrade,
    saveSchool,
    archiveSchool: archiveSchoolById,
    restoreSchool: restoreSchoolById,
    createYear,
    activateYear,
    closeYear,
    syncGrades,
    addGradeRecord,
    editGradeRecord,
    schools,
    selectedSchool,
    selectedSchoolId,
    setSelectedSchoolId,
    isLoading: directoryQuery.isLoading || (Boolean(selectedSchoolId) && operationsQuery.isLoading),
    isFetching: directoryQuery.isFetching || operationsQuery.isFetching,
    isSaving: saveMutation.isPending || archiveMutation.isPending || restoreMutation.isPending || yearCreateMutation.isPending || yearActivateMutation.isPending || yearCloseMutation.isPending || gradeSyncMutation.isPending || gradeCreateMutation.isPending || gradeUpdateMutation.isPending || classCreateMutation.isPending || classUpdateMutation.isPending || studentCreateMutation.isPending || studentImportMutation.isPending || enrollmentMutation.isPending,
    // Load errors only: a failed save shows the global toast and must leave the form on screen.
    error: directoryQuery.error ?? operationsQuery.error,
    refetch: () => refreshSchoolData(selectedSchoolId),
    unsupportedApiMessage: "Ghi danh môn học cho học sinh chưa làm được ở màn này.",
  };
}

function toStudentInput(row: Omit<SchoolStudent, "id">, school: ReturnType<typeof useSchoolManagement>["selectedSchool"]): SchoolStudentInput | SchoolStudentAccountInput {
  const classroom = school?.classes.find((item) => item.name.trim().toLocaleLowerCase() === row.className.trim().toLocaleLowerCase());
  return {
    studentCode: row.code.trim(),
    fullName: row.fullName.trim(),
    academicClassId: row.academicClassId || classroom?.id || undefined,
    birthday: row.birthDate || undefined,
    parentPhone: row.guardianPhone || undefined,
    status: row.status === "studying" ? "ACTIVE" : row.status === "at-risk" ? "AT_RISK" : "INACTIVE",
    ...(row.account ? { username: row.account.username, password: row.account.password } : {}),
  };
}

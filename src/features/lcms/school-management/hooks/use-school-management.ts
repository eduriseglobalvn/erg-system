import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateAcademicYear,
  archiveSchool,
  bulkEnrollSchoolStudents,
  closeAcademicYear,
  createAcademicYear,
  createSchoolClass,
  createGrade,
  createSchool,
  createSchoolStudent,
  createSchoolSubject,
  importSchoolStudents,
  updateSchoolClass,
  getSchoolDirectory,
  getSchoolOperations,
  schoolManagementQueryKeys,
  syncDefaultGrades,
  updateGrade,
  updateSchool,
} from "@/features/lcms/school-management/api/school-management-api";
import type { SchoolClass, SchoolDraft, SchoolStudent, SchoolSubject } from "@/features/lcms/school-management/types/school-management-types";
import type { SchoolClassInput, SchoolStudentInput, SchoolSubjectInput } from "@/features/lcms/school-management/api/school-management-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";

export function useSchoolManagement(initialSchoolId?: string | null) {
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId ?? "");
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount("lcms")?.id?.trim() || "anonymous";
  const directoryQuery = useQuery({
    queryKey: schoolManagementQueryKeys.directory(tenantId, accountId),
    queryFn: ({ signal }) => getSchoolDirectory("", signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
  const directorySchools = useMemo(() => directoryQuery.data?.items ?? [], [directoryQuery.data]);

  useEffect(() => {
    if (!directorySchools.length) return;
    if (!selectedSchoolId) {
      setSelectedSchoolId(directorySchools[0].id);
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
    if (schoolId) {
      await queryClient.invalidateQueries({
        queryKey: schoolManagementQueryKeys.operations(tenantId, accountId, schoolId),
      });
    }
  }, [accountId, queryClient, tenantId]);

  const saveMutation = useMutation({
    mutationFn: ({ draft, schoolId, version }: { draft: SchoolDraft; schoolId?: string; version?: number }) => (
      schoolId ? updateSchool(schoolId, version ?? 0, draft) : createSchool(draft)
    ),
  });
  const archiveMutation = useMutation({ mutationFn: archiveSchool });
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
  const subjectCreateMutation = useMutation({ mutationFn: (input: SchoolSubjectInput) => createSchoolSubject(input) });
  const enrollmentMutation = useMutation({ mutationFn: ({ items }: { items: Array<{ studentId: string; classId: string; academicYear?: string | null }> }) => bulkEnrollSchoolStudents(items) });

  const saveSchool = useCallback(async (draft: SchoolDraft, schoolId?: string) => {
    const version = selectedSchool && schoolId === selectedSchool.id ? selectedSchool.version : schools.find((school) => school.id === schoolId)?.version;
    const result = await saveMutation.mutateAsync({ draft, schoolId, version });
    const resolvedId = result.id;
    setSelectedSchoolId(resolvedId);
    await refreshSchoolData(resolvedId);
    return resolvedId;
  }, [refreshSchoolData, saveMutation, schools, selectedSchool]);

  const removeSchool = useCallback(async (schoolId: string) => {
    await archiveMutation.mutateAsync(schoolId);
    setSelectedSchoolId((current) => current === schoolId ? "" : current);
    await refreshSchoolData();
  }, [archiveMutation, refreshSchoolData]);

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
    if (!selectedSchoolId) return;
    for (const row of rows) {
      await classCreateMutation.mutateAsync({
        schoolId: selectedSchoolId,
        input: {
          name: row.name,
          grade: row.grade || undefined,
          academicYear: row.academicYear || selectedSchool?.academicYear || undefined,
          homeroomTeacherId: row.homeroomTeacherId || undefined,
          status: row.status || "ACTIVE",
        },
      });
    }
    await refreshSchoolData(selectedSchoolId);
  }, [classCreateMutation, refreshSchoolData, selectedSchool, selectedSchoolId]);

  const addStudents = useCallback(async (rows: Array<Omit<SchoolStudent, "id">>) => {
    if (!selectedSchoolId) return;
    const items = rows.map((row) => toStudentInput(row, selectedSchool));
    if (items.length > 1) await studentImportMutation.mutateAsync({ schoolId: selectedSchoolId, items });
    else if (items[0]) await studentCreateMutation.mutateAsync({ schoolId: selectedSchoolId, input: items[0] });
    await refreshSchoolData(selectedSchoolId);
  }, [refreshSchoolData, selectedSchool, selectedSchoolId, studentCreateMutation, studentImportMutation]);

  const addSubject = useCallback(async (row: Omit<SchoolSubject, "id" | "studentCount">) => {
    if (!selectedSchoolId) return;
    await subjectCreateMutation.mutateAsync({
      schoolId: selectedSchoolId,
      name: row.name,
      code: row.code,
      status: row.status || "ACTIVE",
    });
    await refreshSchoolData(selectedSchoolId);
  }, [refreshSchoolData, selectedSchoolId, subjectCreateMutation]);

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
    addSubject,
    enrollStudentsInClass,
    updateClassGrade,
    saveSchool,
    removeSchool,
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
    isSaving: saveMutation.isPending || archiveMutation.isPending || yearCreateMutation.isPending || yearActivateMutation.isPending || yearCloseMutation.isPending || gradeSyncMutation.isPending || gradeCreateMutation.isPending || gradeUpdateMutation.isPending || classCreateMutation.isPending || classUpdateMutation.isPending || studentCreateMutation.isPending || studentImportMutation.isPending || subjectCreateMutation.isPending || enrollmentMutation.isPending,
    error: directoryQuery.error ?? operationsQuery.error ?? saveMutation.error ?? archiveMutation.error,
    refetch: () => refreshSchoolData(selectedSchoolId),
    unsupportedApiMessage: "CRUD lớp, học sinh, môn học và ghi danh lớp đã nối contract backend. Ghi danh môn học chưa có mutation trong schema hiện tại.",
  };
}

function toStudentInput(row: Omit<SchoolStudent, "id">, school: ReturnType<typeof useSchoolManagement>["selectedSchool"]): SchoolStudentInput {
  const classroom = school?.classes.find((item) => item.name.trim().toLocaleLowerCase() === row.className.trim().toLocaleLowerCase());
  return {
    studentCode: row.code.trim(),
    fullName: row.fullName.trim(),
    academicClassId: row.academicClassId || classroom?.id || undefined,
    birthday: row.birthDate || undefined,
    parentPhone: row.guardianPhone || undefined,
    status: row.status === "studying" ? "ACTIVE" : row.status === "at-risk" ? "AT_RISK" : "INACTIVE",
  };
}

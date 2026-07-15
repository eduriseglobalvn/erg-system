import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activateAcademicYear,
  archiveSchool,
  closeAcademicYear,
  createAcademicYear,
  createGrade,
  createSchool,
  getSchoolDirectory,
  getSchoolOperations,
  schoolManagementQueryKeys,
  syncDefaultGrades,
  updateGrade,
  updateSchool,
} from "@/features/lcms/school-management/api/school-management-api";
import type { SchoolClass, SchoolDraft, SchoolStudent, SchoolSubject } from "@/features/lcms/school-management/types/school-management-types";

export function useSchoolManagement(initialSchoolId?: string | null) {
  const queryClient = useQueryClient();
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId ?? "");
  const directoryQuery = useQuery({
    queryKey: schoolManagementQueryKeys.directory(),
    queryFn: () => getSchoolDirectory(),
    staleTime: 60_000,
  });
  const directorySchools = useMemo(() => directoryQuery.data?.items ?? [], [directoryQuery.data]);

  useEffect(() => {
    if (!directorySchools.length) return;
    if (!selectedSchoolId) {
      setSelectedSchoolId(directorySchools[0].id);
    }
  }, [directorySchools, selectedSchoolId]);

  const operationsQuery = useQuery({
    queryKey: schoolManagementQueryKeys.operations(selectedSchoolId),
    queryFn: () => getSchoolOperations(selectedSchoolId),
    enabled: Boolean(selectedSchoolId),
    staleTime: 30_000,
  });

  const schools = useMemo(() => directorySchools.map((school) => (
    school.id === selectedSchoolId && operationsQuery.data ? operationsQuery.data : school
  )), [directorySchools, operationsQuery.data, selectedSchoolId]);
  const selectedSchool = operationsQuery.data
    ?? schools.find((school) => school.id === selectedSchoolId)
    ?? null;

  const refreshSchoolData = useCallback(async (schoolId?: string) => {
    await queryClient.invalidateQueries({ queryKey: schoolManagementQueryKeys.root });
    if (schoolId) await queryClient.invalidateQueries({ queryKey: schoolManagementQueryKeys.operations(schoolId) });
  }, [queryClient]);

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

  // API lớp, học sinh và môn học chưa thuộc backend phase 1. Các callback được giữ để
  // UI hiện hữu không vỡ, nhưng tuyệt đối không tạo dữ liệu giả cục bộ.
  const unavailable = useCallback(() => undefined, []);

  return {
    addClasses: unavailable as (rows: Array<Omit<SchoolClass, "id">>) => void,
    addGrade: unavailable as (grade: string) => void,
    addStudents: unavailable as (rows: Array<Omit<SchoolStudent, "id">>) => void,
    addSubject: unavailable as (row: Omit<SchoolSubject, "id" | "studentCount">) => void,
    assignSubject: unavailable as (subjectId: string, studentIds: string[]) => void,
    enrollStudentsInSubjects: unavailable as (studentIds: string[], subjectIds: string[]) => void,
    updateClassGrade: unavailable as (classId: string, grade: string) => void,
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
    isSaving: saveMutation.isPending || archiveMutation.isPending || yearCreateMutation.isPending || yearActivateMutation.isPending || yearCloseMutation.isPending || gradeSyncMutation.isPending || gradeCreateMutation.isPending || gradeUpdateMutation.isPending,
    error: directoryQuery.error ?? operationsQuery.error ?? saveMutation.error ?? archiveMutation.error,
    refetch: () => refreshSchoolData(selectedSchoolId),
    unsupportedApiMessage: "API lớp học, học sinh, nhập liệu và ghi danh chưa có trong backend phase 1.",
  };
}

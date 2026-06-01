import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  loadLearningResourceLibraryBootstrap,
  loadLearningResourceLibraryProgress,
  loadLearningResourceResourceForViewer,
  mapLibraryResourceToLearningResourceResource,
  type LearningResourceLibraryBootstrapDTO,
  type LearningResourceLibraryProgressDTO,
} from "@/features/lms/learning-resources/api/learning-resource-api";
import type { LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import { getCurrentAcademicYear } from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";
import { useLearningResourceDashboardScope } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import type { LearningResourceTeacherProgressSummary } from "@/features/lms/learning-resources/types/teacher-resource-dashboard-types";

type LearningResourceLibraryLesson = {
  id: string;
  title: string;
  description?: string;
  resourceCount: number;
  resources: LearningResourceResource[];
  progress: LearningResourceTeacherProgressSummary;
};

type LearningResourceLibrarySection = {
  id: string;
  title: string;
  description?: string;
  resourceCount: number;
  lessonCount: number;
  progress: LearningResourceTeacherProgressSummary;
  lessons: LearningResourceLibraryLesson[];
};

type LearningResourceLibrarySubject = {
  id: string;
  label: string;
  description?: string;
  groupCount: number;
  lessonCount: number;
  resourceCount: number;
  sections: LearningResourceLibrarySection[];
};

function emptyProgress(): LearningResourceTeacherProgressSummary {
  return {
    progressRate: 0,
    taughtCount: 0,
    totalCount: 0,
    pendingCount: 0,
  };
}

function progressFromRate(progressRate = 0, totalCount = 1): LearningResourceTeacherProgressSummary {
  const normalizedRate = Math.max(0, Math.min(100, progressRate));
  const normalizedTotal = Math.max(0, totalCount);
  const taughtCount = normalizedTotal > 0 ? Math.round((normalizedRate / 100) * normalizedTotal) : 0;

  return {
    progressRate: normalizedRate,
    taughtCount,
    totalCount: normalizedTotal,
    pendingCount: Math.max(0, normalizedTotal - taughtCount),
  };
}

function summarizeProgress(items: LearningResourceTeacherProgressSummary[]): LearningResourceTeacherProgressSummary {
  if (!items.length) {
    return emptyProgress();
  }

  return {
    progressRate: items.reduce((sum, item) => sum + item.progressRate, 0) / items.length,
    taughtCount: items.reduce((sum, item) => sum + item.taughtCount, 0),
    totalCount: items.reduce((sum, item) => sum + item.totalCount, 0),
    pendingCount: items.reduce((sum, item) => sum + item.pendingCount, 0),
  };
}

export function toLibrarySubjects(
  bootstrap: LearningResourceLibraryBootstrapDTO | undefined,
  progressByLessonId: Map<string, number> = new Map(),
): LearningResourceLibrarySubject[] {
  if (!bootstrap?.subjects?.length) return [];

  return bootstrap.subjects.map((subject) => {
    const sections = subject.groups.map((group) => {
      const lessons = group.lessons.map((lesson) => {
        const resources = lesson.resources.map((resource, index) =>
          mapLibraryResourceToLearningResourceResource(resource, {
            subjectId: subject.id,
            groupId: group.id,
            lessonId: lesson.id,
            sortOrder: index + 1,
          }),
        );

        const progressRate = progressByLessonId.get(lesson.id) ?? lesson.progressRate ?? 0;
        return {
          id: lesson.id,
          title: lesson.label,
          resourceCount: resources.length,
          resources,
          progress: progressFromRate(progressRate, resources.length || 1),
        } satisfies LearningResourceLibraryLesson;
      });

      return {
        id: group.id,
        title: group.label,
        resourceCount: lessons.reduce((sum, lesson) => sum + lesson.resourceCount, 0),
        lessonCount: lessons.length,
        progress: summarizeProgress(lessons.map((lesson) => lesson.progress)),
        lessons,
      } satisfies LearningResourceLibrarySection;
    });

    return {
      id: subject.id,
      label: subject.label,
      groupCount: sections.length,
      lessonCount: sections.reduce((sum, section) => sum + section.lessonCount, 0),
      resourceCount: sections.reduce((sum, section) => sum + section.resourceCount, 0),
      sections,
    } satisfies LearningResourceLibrarySubject;
  });
}

async function openLibraryResource(resource: LearningResourceResource) {
  const hydratedResource = await loadLearningResourceResourceForViewer(resource);
  const targetUrl = hydratedResource.viewer.embedUrl || hydratedResource.viewer.secureEmbedUrl;

  if (!targetUrl && !hydratedResource.viewer.slides?.length) {
    throw new Error("Học liệu này chưa có đường dẫn mở từ hệ thống.");
  }

  return hydratedResource;
}

function libraryBootstrapQueryKey(schoolId: string, academicYear: string) {
  return ["hoclieu", "library-bootstrap", schoolId, academicYear] as const;
}

export function libraryProgressQueryKey(schoolId: string, academicYear: string) {
  return ["hoclieu", "library-progress", schoolId, academicYear] as const;
}

function progressMap(progress: LearningResourceLibraryProgressDTO | undefined) {
  return new Map((progress?.lessons ?? []).map((lesson) => [lesson.lessonId, lesson.progressRate]));
}

export function useLearningResourceLibraryCatalog() {
  const queryClient = useQueryClient();
  const scope = useLearningResourceDashboardScope();
  const schoolId = scope?.selectedSchoolId ?? "";
  const academicYear = scope?.academicYear ?? getCurrentAcademicYear();

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const libraryQuery = useQuery({
    queryKey: libraryBootstrapQueryKey(schoolId, academicYear),
    queryFn: () => loadLearningResourceLibraryBootstrap({ schoolId, academicYear }),
    enabled: Boolean(schoolId),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const progressQuery = useQuery({
    queryKey: libraryProgressQueryKey(schoolId, academicYear),
    queryFn: () => loadLearningResourceLibraryProgress({ schoolId, academicYear }),
    enabled: Boolean(schoolId),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const subjects = useMemo(() => toLibrarySubjects(libraryQuery.data, progressMap(progressQuery.data)), [libraryQuery.data, progressQuery.data]);
  const firstSubjectId = subjects[0]?.id ?? "";
  const effectiveSubjectId = selectedSubjectId || firstSubjectId;

  useEffect(() => {
    if (!selectedSubjectId && firstSubjectId) {
      setSelectedSubjectId(firstSubjectId);
    }
  }, [firstSubjectId, selectedSubjectId]);

  useEffect(() => {
    if (!schoolId) return;

    void queryClient.prefetchQuery({
      queryKey: libraryBootstrapQueryKey(schoolId, academicYear),
      queryFn: () => loadLearningResourceLibraryBootstrap({ schoolId, academicYear }),
      staleTime: 5 * 60_000,
    });
  }, [academicYear, queryClient, schoolId]);

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === effectiveSubjectId) ?? subjects[0] ?? null,
    [effectiveSubjectId, subjects],
  );

  useEffect(() => {
    if (!activeSubject) {
      setSelectedSectionId("");
      return;
    }

    if (!activeSubject.sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(activeSubject.sections[0]?.id ?? "");
    }
  }, [activeSubject, selectedSectionId]);

  const filteredSections = useMemo(() => {
    if (!activeSubject) return [] as LearningResourceLibrarySection[];

    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return activeSubject.sections;
    }

    return activeSubject.sections
      .map((section) => {
        const sectionMatches = section.title.toLowerCase().includes(query);
        const lessons = section.lessons
          .map((lesson) => {
            const lessonMatches = lesson.title.toLowerCase().includes(query);
            const resources = lesson.resources.filter((resource) => {
              const haystacks = [resource.title, resource.subtitle, resource.viewer.description, resource.formatBadge]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return haystacks.includes(query);
            });

            if (lessonMatches) {
              return lesson;
            }

            return {
              ...lesson,
              resources,
              resourceCount: resources.length,
            };
          })
          .filter((lesson) => lesson.resourceCount > 0);

        if (sectionMatches) {
          return section;
        }

        return {
          ...section,
          lessons,
          lessonCount: lessons.length,
          resourceCount: lessons.reduce((sum, lesson) => sum + lesson.resourceCount, 0),
          progress: summarizeProgress(lessons.map((lesson) => lesson.progress)),
        };
      })
      .filter((section) => section.lessonCount > 0);
  }, [activeSubject, searchValue]);

  const activeSection = useMemo(
    () => filteredSections.find((section) => section.id === selectedSectionId) ?? filteredSections[0] ?? null,
    [filteredSections, selectedSectionId],
  );

  useEffect(() => {
    if (!activeSection) {
      setSelectedLessonId("");
      return;
    }

    if (!activeSection.lessons.some((lesson) => lesson.id === selectedLessonId)) {
      setSelectedLessonId(activeSection.lessons[0]?.id ?? "");
    }
  }, [activeSection, selectedLessonId]);

  const activeLesson = useMemo(
    () => activeSection?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? activeSection?.lessons[0] ?? null,
    [activeSection, selectedLessonId],
  );

  const loading = !schoolId || (libraryQuery.isLoading && !libraryQuery.data);
  const loadingSubject = libraryQuery.isFetching && Boolean(libraryQuery.data);

  useEffect(() => {
    const nextError = libraryQuery.error;
    if (!nextError) {
      setError(null);
      return;
    }

    setError(nextError instanceof Error ? nextError.message : "Không thể tải kho học liệu.");
  }, [libraryQuery.error]);

  async function handleSelectSubject(subjectId: string) {
    setSelectedSubjectId(subjectId);
    setError(null);
  }

  function handleSelectSection(subjectId: string, sectionId: string) {
    setSelectedSubjectId(subjectId);
    setSelectedSectionId(sectionId);
    setSelectedLessonId("");
    setError(null);
  }

  function handleSelectLesson(lessonId: string) {
    setSelectedLessonId(lessonId);
  }

  async function handleOpenResource(resource: LearningResourceResource) {
    try {
      setError(null);
      return await openLibraryResource(resource);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể mở học liệu.");
      return null;
    }
  }

  return {
    activeLesson,
    activeSection,
    activeSubject,
    error,
    loading,
    loadingSubject,
    onOpenResource: handleOpenResource,
    progressQueryKey: libraryProgressQueryKey(schoolId, academicYear),
    onSelectLesson: handleSelectLesson,
    onSelectSection: handleSelectSection,
    onSelectSubject: handleSelectSubject,
    searchValue,
    sections: filteredSections,
    selectedLessonId,
    selectedSectionId,
    selectedSubjectId: effectiveSubjectId,
    setSearchValue,
    subjects,
  };
}

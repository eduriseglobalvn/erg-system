import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { loadHocLieuTaxonomies } from "@/features/admin-operations/api/hoclieu-authoring-api";
import { loadHocLieuResourceForViewer, loadHocLieuResourcesBySubject } from "@/features/hoclieu/api/hoclieu-api";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";
import { getCurrentAcademicYear, loadHocLieuTeacherProgress } from "@/features/hoclieu/api/teacher-dashboard-api";
import { useHocLieuDashboardScope } from "@/features/hoclieu/hooks/use-hoclieu-dashboard-scope";
import type { HocLieuTeacherProgressSummary } from "@/features/hoclieu/types/teacher-dashboard-types";
import {
  buildHocLieuLearningSubjects,
  matchesResourceToLearningNode,
  type HocLieuLearningSubject,
} from "@/utils/hoclieu-learning-tree";

type HocLieuLibraryLesson = {
  id: string;
  title: string;
  description?: string;
  resourceCount: number;
  resources: HocLieuResource[];
  progress: HocLieuTeacherProgressSummary;
};

type HocLieuLibrarySection = {
  id: string;
  title: string;
  description?: string;
  resourceCount: number;
  lessonCount: number;
  progress: HocLieuTeacherProgressSummary;
  lessons: HocLieuLibraryLesson[];
};

type HocLieuLibrarySubject = {
  id: string;
  label: string;
  description?: string;
  groupCount: number;
  lessonCount: number;
  resourceCount: number;
  sections: HocLieuLibrarySection[];
};

const TAXONOMY_QUERY_KEY = ["hoclieu", "content-model"] as const;

function emptyProgress(): HocLieuTeacherProgressSummary {
  return {
    progressRate: 0,
    taughtCount: 0,
    totalCount: 0,
    pendingCount: 0,
  };
}

function summarizeProgress(items: HocLieuTeacherProgressSummary[]): HocLieuTeacherProgressSummary {
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

function toSections(
  subject: HocLieuLearningSubject,
  resources: HocLieuResource[],
  progressByLessonId: Record<string, HocLieuTeacherProgressSummary>,
): HocLieuLibrarySection[] {
  return subject.tree.reduce<HocLieuLibrarySection[]>((sections, group) => {
    const lessons = group.children
      .filter((lesson) => lesson.kind === "lesson" && lesson.optionId)
      .map((lesson) => {
        const lessonId = lesson.optionId || lesson.id;
        const lessonResources = resources
          .filter((resource) => matchesResourceToLearningNode(resource, lesson))
          .sort((left, right) => left.sortOrder - right.sortOrder || left.title.localeCompare(right.title, "vi"));

        return {
          id: lessonId,
          title: lesson.label,
          description: lesson.description,
          resourceCount: lessonResources.length,
          resources: lessonResources,
          progress: progressByLessonId[lessonId] ?? emptyProgress(),
        } satisfies HocLieuLibraryLesson;
      })
      .filter((lesson) => lesson.resourceCount > 0 || lesson.progress.totalCount > 0);

    if (!lessons.length) {
      return sections;
    }

    sections.push({
      id: group.optionId || group.id,
      title: group.label,
      description: group.description,
      resourceCount: lessons.reduce((sum, lesson) => sum + lesson.resourceCount, 0),
      lessonCount: lessons.length,
      progress: summarizeProgress(lessons.map((lesson) => lesson.progress)),
      lessons,
    });

    return sections;
  }, []);
}

async function openLibraryResource(resource: HocLieuResource, previewWindow?: Window | null) {
  const hydratedResource = await loadHocLieuResourceForViewer(resource);
  const targetUrl = hydratedResource.viewer.embedUrl || hydratedResource.viewer.secureEmbedUrl;

  if (!targetUrl) {
    previewWindow?.close();
    throw new Error("Học liệu này chưa có đường dẫn mở từ hệ thống.");
  }

  if (previewWindow && !previewWindow.closed) {
    previewWindow.location.href = targetUrl;
    return;
  }

  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function toProgressMap(progress: Awaited<ReturnType<typeof loadHocLieuTeacherProgress>> | null | undefined) {
  return Object.fromEntries(
    (progress?.items ?? []).map((item) => [
      item.id,
      {
        progressRate: item.progressRate,
        taughtCount: item.status === "taught" ? 1 : 0,
        totalCount: 1,
        pendingCount: item.status === "taught" ? 0 : 1,
      } satisfies HocLieuTeacherProgressSummary,
    ]),
  );
}

function subjectResourcesQueryKey(subjectId: string) {
  return ["hoclieu", "subject-resources", subjectId] as const;
}

function subjectProgressQueryKey(subjectId: string, schoolId: string, academicYear: string) {
  return ["hoclieu", "subject-progress", subjectId, schoolId, academicYear] as const;
}

export function useHocLieuLibraryCatalog() {
  const queryClient = useQueryClient();
  const scope = useHocLieuDashboardScope();
  const schoolId = scope?.selectedSchoolId ?? "";
  const academicYear = scope?.academicYear ?? getCurrentAcademicYear();

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const taxonomyQuery = useQuery({
    queryKey: TAXONOMY_QUERY_KEY,
    queryFn: loadHocLieuTaxonomies,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });

  const firstSubjectId = taxonomyQuery.data?.subjects[0]?.id ?? "";
  const effectiveSubjectId = selectedSubjectId || firstSubjectId;

  useEffect(() => {
    if (!selectedSubjectId && firstSubjectId) {
      setSelectedSubjectId(firstSubjectId);
    }
  }, [firstSubjectId, selectedSubjectId]);

  const resourcesQuery = useQuery({
    queryKey: subjectResourcesQueryKey(effectiveSubjectId),
    queryFn: () => loadHocLieuResourcesBySubject(effectiveSubjectId),
    enabled: Boolean(effectiveSubjectId),
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const progressQuery = useQuery({
    queryKey: subjectProgressQueryKey(effectiveSubjectId, schoolId, academicYear),
    queryFn: () => loadHocLieuTeacherProgress({ subjectId: effectiveSubjectId, schoolId, academicYear }).then((progress) => toProgressMap(progress)),
    enabled: Boolean(effectiveSubjectId && schoolId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

  const subjects = useMemo(() => {
    if (!taxonomyQuery.data) return [] as HocLieuLibrarySubject[];

    const flattenedResources = resourcesQuery.data ?? [];

    return buildHocLieuLearningSubjects(taxonomyQuery.data, flattenedResources).map((subject) => {
      const subjectResources = subject.id === effectiveSubjectId ? flattenedResources : [];
      const progressByLessonId = subject.id === effectiveSubjectId ? progressQuery.data ?? {} : {};

      return {
        id: subject.id,
        label: subject.label,
        description: subject.description,
        groupCount: subject.groupCount,
        lessonCount: subject.lessonCount,
        resourceCount: subjectResources.length,
        sections: toSections(subject, subjectResources, progressByLessonId),
      };
    });
  }, [effectiveSubjectId, progressQuery.data, resourcesQuery.data, taxonomyQuery.data]);

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
    if (!activeSubject) return [] as HocLieuLibrarySection[];

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

  const loading = taxonomyQuery.isLoading || (Boolean(effectiveSubjectId) && resourcesQuery.isLoading && !resourcesQuery.data);
  const loadingSubject = !loading && (resourcesQuery.isFetching || progressQuery.isFetching);

  useEffect(() => {
    const nextError = taxonomyQuery.error || resourcesQuery.error || progressQuery.error;
    if (!nextError) {
      setError(null);
      return;
    }

    setError(nextError instanceof Error ? nextError.message : "Không thể tải kho học liệu.");
  }, [progressQuery.error, resourcesQuery.error, taxonomyQuery.error]);

  async function handleSelectSubject(subjectId: string) {
    setSelectedSubjectId(subjectId);
    setError(null);

    void queryClient.prefetchQuery({
      queryKey: subjectResourcesQueryKey(subjectId),
      queryFn: () => loadHocLieuResourcesBySubject(subjectId),
      staleTime: 2 * 60_000,
    });

    if (schoolId) {
      void queryClient.prefetchQuery({
        queryKey: subjectProgressQueryKey(subjectId, schoolId, academicYear),
        queryFn: () => loadHocLieuTeacherProgress({ subjectId, schoolId, academicYear }).then((progress) => toProgressMap(progress)),
        staleTime: 60_000,
      });
    }
  }

  function handleSelectSection(sectionId: string) {
    setSelectedSectionId(sectionId);
  }

  function handleSelectLesson(lessonId: string) {
    setSelectedLessonId(lessonId);
  }

  async function handleOpenResource(resource: HocLieuResource) {
    const previewWindow = window.open("", "_blank");
    try {
      setError(null);
      await openLibraryResource(resource, previewWindow);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể mở học liệu.");
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

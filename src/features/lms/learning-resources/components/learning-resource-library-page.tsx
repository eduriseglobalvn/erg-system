import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";

import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth";
import {
  loadLearningResourceLibrarySections,
  loadLearningResourceResourceForViewer,
} from "@/features/lms/learning-resources/api/learning-resource-api";
import {
  DEFAULT_LEARNING_RESOURCE_SELECTION,
  type LearningResourceResource,
  type LearningResourceResourceSection,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { ResourceViewerModal } from "@/features/lms/learning-resources/components/learning-resource-viewer-modal";
import { LearningResourceExplorer } from "@/features/lms/learning-resources/components/library-page/explorer";
import {
  getDefaultSelectionForGrade,
  getLearningResourceExplorerCategories,
  getLearningResourceExplorerSubjects,
  matchesResource,
} from "@/features/lms/learning-resources/components/library-page/library-model";

export function LearningResourceLibraryPage() {
  const initialGradeId = DEFAULT_LEARNING_RESOURCE_SELECTION.gradeId;
  const initialSelection = useMemo(() => getDefaultSelectionForGrade(initialGradeId), [initialGradeId]);
  const [account, setAccount] = useState(() => getCurrentAccount());
  const activeGradeId = initialSelection.gradeId;
  const activeSubjectId = initialSelection.subjectId;
  const [activeCategoryId, setActiveCategoryId] = useState(initialSelection.categoryId);
  const [keyword, setKeyword] = useState("");
  const categories = useMemo(() => getLearningResourceExplorerCategories(), []);
  const subjects = useMemo(() => getLearningResourceExplorerSubjects(), []);
  const [librarySections, setLibrarySections] = useState<LearningResourceResourceSection[]>([]);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [viewerLoadingResourceId, setViewerLoadingResourceId] = useState<string | null>(null);
  const [activeResource, setActiveResource] = useState<LearningResourceResource | null>(null);

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  useEffect(() => {
    if (!account) return undefined;

    let isCancelled = false;

    async function loadLibrary() {
      try {
        setLibraryError(null);
        const sections = await loadLearningResourceLibrarySections();
        if (!isCancelled) setLibrarySections(sections);
      } catch {
        if (!isCancelled) {
          setLibrarySections([]);
          setLibraryError(null);
        }
      }
    }

    void loadLibrary();

    return () => {
      isCancelled = true;
    };
  }, [account]);

  const visibleSections = useMemo(() => {
    return librarySections.map((section) => ({
      ...section,
      resources: section.resources.filter((resource) =>
        matchesResource(resource, {
          gradeId: activeGradeId,
          subjectId: activeSubjectId,
          categoryId: activeCategoryId,
          keyword,
        }),
      ),
    })).filter((section) => section.resources.length > 0);
  }, [activeCategoryId, activeGradeId, activeSubjectId, keyword, librarySections]);

  const treeResources = useMemo(() => {
    const keywordValue = keyword.trim().toLowerCase();
    return librarySections.flatMap((section) =>
      section.resources.filter((resource) => {
        const subjectMatches = activeSubjectId === "all" || resource.subjectId === activeSubjectId;
        const gradeMatches =
          !resource.gradeId ||
          resource.gradeId === activeGradeId ||
          ["ic3", "mos", "tin-hoc"].includes(resource.subjectId) ||
          resource.subjectId.startsWith("mock-");
        const keywordMatches =
          keywordValue.length === 0 ||
          [resource.title, resource.subtitle, resource.formatBadge, resource.viewer.title]
            .join(" ")
            .toLowerCase()
            .includes(keywordValue);
        return subjectMatches && gradeMatches && keywordMatches;
      }),
    );
  }, [activeGradeId, activeSubjectId, keyword, librarySections]);

  const totalVisibleResources = visibleSections.reduce((total, section) => total + section.resources.length, 0);

  async function handleOpenResource(resource: LearningResourceResource) {
    setActiveResource(resource);
    setLibraryError(null);

    if (!account) return;

    setViewerLoadingResourceId(resource.id);

    try {
      const hydratedResource = await loadLearningResourceResourceForViewer(resource);
      setActiveResource((currentResource) => (currentResource?.id === resource.id ? hydratedResource : currentResource));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "Không thể mở viewer từ API.");
    } finally {
      setViewerLoadingResourceId(null);
    }
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: { xs: "calc(100dvh - 64px)", md: "calc(100vh - 64px)" },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* flex column so the explorer shell (flex: 1) fills the remaining height */}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <LearningResourceExplorer
          activeCategoryId={activeCategoryId}
          activeGradeId={activeGradeId}
          activeSubjectId={activeSubjectId}
          categories={categories}
          keyword={keyword}
          libraryError={libraryError}
          onKeywordChange={setKeyword}
          onOpenResource={(resource) => void handleOpenResource(resource)}
          onRefresh={() => setKeyword((value) => value)}
          onSelectCategory={setActiveCategoryId}
          sections={visibleSections}
          subjects={subjects}
          totalVisibleResources={totalVisibleResources}
          treeResources={treeResources}
          viewerLoadingResourceId={viewerLoadingResourceId}
        />
      </Box>

      {activeResource ? <ResourceViewerModal resource={activeResource} onClose={() => setActiveResource(null)} /> : null}
    </Box>
  );
}

import {
  loadLmsLearningResourceLibrary,
  type LmsLearningResourceCard,
  type LmsLearningResourceLibrary,
  type LmsLearningResourceLibraryInput,
  type LmsLearningResourceProgress,
  type LmsLearningResourceTaxonomyNode,
} from "@/features/lms/api/lms-graphql-api";
import { hasApiBase } from "@/lib/api-client";

export type GraphQlLearningResourceLibrarySnapshot = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LmsLearningResourceTaxonomyNode[];
  resources: LmsLearningResourceLibrary["resources"] & { items: LmsLearningResourceCard[] };
  progress: LmsLearningResourceProgress[];
  recentOpened: LmsLearningResourceLibrary["recentOpened"];
};

const GRAPHQL_LIBRARY_PAGE_SIZE = 50;
const GRAPHQL_LIBRARY_MAX_PAGES = 10;

export async function loadGraphQlLearningResourceLibrary(
  input: LmsLearningResourceLibraryInput = {},
  signal?: AbortSignal,
): Promise<GraphQlLearningResourceLibrarySnapshot | null> {
  if (!hasApiBase()) return null;

  const pageSize = Math.min(Math.max(input.size ?? GRAPHQL_LIBRARY_PAGE_SIZE, 1), GRAPHQL_LIBRARY_PAGE_SIZE);
  const baseInput: LmsLearningResourceLibraryInput = {
    ...input,
    size: pageSize,
    page: input.page ?? 0,
  };

  try {
    const pages: LmsLearningResourceLibrary[] = [];
    let currentPage = baseInput.page ?? 0;
    let hasNext = true;

    for (let pageIndex = 0; hasNext && pageIndex < GRAPHQL_LIBRARY_MAX_PAGES; pageIndex += 1) {
      const response = await loadLmsLearningResourceLibrary({
        ...baseInput,
        page: currentPage,
        size: pageSize,
      }, signal);

      pages.push(response);
      hasNext = Boolean(response.resources.hasNext);
      currentPage += 1;

      if (!hasNext) {
        const resources = pages.flatMap((page) => page.resources.items ?? []);
        const latest = pages[pages.length - 1] ?? response;

        return {
          tenantId: latest.tenantId,
          educationUnitId: latest.educationUnitId,
          taxonomyTree: latest.taxonomyTree ?? [],
          resources: {
            ...latest.resources,
            items: resources,
            page: baseInput.page ?? 0,
            size: resources.length || latest.resources.size,
            totalItems: latest.resources.totalItems ?? resources.length,
            totalPages: latest.resources.totalPages ?? pages.length,
            hasNext: false,
            hasPrevious: Boolean(baseInput.page && baseInput.page > 0),
          },
          progress: latest.progress ?? [],
          recentOpened: latest.recentOpened ?? [],
        };
      }
    }

    const latest = pages[pages.length - 1];
    if (!latest) return null;
    const resources = pages.flatMap((page) => page.resources.items ?? []);

    return {
      tenantId: latest.tenantId,
      educationUnitId: latest.educationUnitId,
      taxonomyTree: latest.taxonomyTree ?? [],
      resources: {
        ...latest.resources,
        items: resources,
        page: baseInput.page ?? 0,
        size: resources.length || latest.resources.size,
        totalItems: latest.resources.totalItems ?? resources.length,
        totalPages: latest.resources.totalPages ?? pages.length,
        hasNext: latest.resources.hasNext,
        hasPrevious: Boolean(baseInput.page && baseInput.page > 0),
      },
      progress: latest.progress ?? [],
      recentOpened: latest.recentOpened ?? [],
    };
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error;
    return null;
  }
}

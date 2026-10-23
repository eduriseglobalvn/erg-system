import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import { isLmsEntity, isLmsGraphQlPage, withTenant } from "@/features/lms/api/lms-graphql-shared";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";

export type LmsLearningResourceLibraryInput = {
  tenantId?: string;
  educationUnitId?: string;
  academicYear?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  sectionId?: string;
  topicId?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
};

export type LmsLearningResourceTaxonomyNode = {
  id: string;
  kind?: string | null;
  label?: string | null;
  slug?: string | null;
  parentId?: string | null;
  subjectId?: string | null;
  categoryId?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  description?: string | null;
  childCount?: number | null;
  resourceCount?: number | null;
};

export type LmsLearningResourceCard = {
  id: string;
  subjectId?: string | null;
  gradeId?: string | null;
  categoryId?: string | null;
  sectionId?: string | null;
  topicId?: string | null;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  visibility?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type LmsLearningResourceProgress = {
  resourceId: string;
  progressRate?: number | null;
  updatedAt?: string | null;
};

export type LmsLearningResourceRecentOpened = {
  resourceId: string;
  title?: string | null;
  openedAt?: string | null;
};

export type LmsLearningResourceLibrary = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LmsLearningResourceTaxonomyNode[];
  resources: GraphQlPage<LmsLearningResourceCard>;
  progress: LmsLearningResourceProgress[];
  recentOpened: LmsLearningResourceRecentOpened[];
};

const LmsLearningResourceLibraryDocument = `
query LmsLearningResourceLibrary($input: LearningResourceLibraryInput) {
  lms {
    learningResourceLibrary(input: $input) {
      tenantId
      educationUnitId
      taxonomyTree {
        id
        kind
        label
        slug
        parentId
        subjectId
        categoryId
        sortOrder
        status
        description
        childCount
        resourceCount
      }
      resources {
        items {
          id
          subjectId
          gradeId
          categoryId
          sectionId
          topicId
          title
          slug
          subtitle
          thumbnailUrl
          visibility
          status
          publishedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      progress {
        resourceId
        progressRate
        updatedAt
      }
      recentOpened {
        resourceId
        title
        openedAt
      }
    }
  }
}
`;

export async function loadLmsLearningResourceLibrary(
  input: LmsLearningResourceLibraryInput,
  signal?: AbortSignal,
) {
  const response = await graphQlRequest<
    { lms: { learningResourceLibrary: LmsLearningResourceLibrary } },
    { input: LmsLearningResourceLibraryInput }
  >({
    operationName: "LmsLearningResourceLibrary",
    portal: "lms",
    query: LmsLearningResourceLibraryDocument,
    signal,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return validateResponse(
    response,
    isLmsLearningResourceLibraryResponse,
    "lms.learning-resource-library",
  ).lms.learningResourceLibrary;
}

function isLmsLearningResourceLibraryResponse(
  value: unknown,
): value is { lms: { learningResourceLibrary: LmsLearningResourceLibrary } } {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.learningResourceLibrary)) return false;
  const library = value.lms.learningResourceLibrary;
  return Array.isArray(library.taxonomyTree) && library.taxonomyTree.every(isLmsEntity) &&
    isLmsGraphQlPage(library.resources, isLmsEntity) &&
    Array.isArray(library.progress) && library.progress.every(
      (item) => isObject(item) && isNonEmptyString(item.resourceId),
    ) &&
    Array.isArray(library.recentOpened) && library.recentOpened.every(
      (item) => isObject(item) && isNonEmptyString(item.resourceId),
    );
}

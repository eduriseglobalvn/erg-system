import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import {
  mapGraphQlLibraryToCurriculumTree,
  mapGraphQlLibraryToResources,
  mapGraphQlLibraryToStudioBootstrap,
  mapGraphQlLibraryToTaxonomies,
  stringParam,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-library-mapper";
import { compactObject } from "@/features/lcms/admin-operations/api/learning-resource-authoring-utils";
import type {
  LearningResourceLibraryGraphQl,
  LearningResourceLibraryGraphQlData,
  LearningResourceLibraryGraphQlInput,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-transport-types";

const LearningResourceLibraryDocument = `
query LcmsLearningResourceLibrary($input: LearningResourceLibraryInput) {
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
    }
  }
}
`;

export async function loadLearningResourceLibraryGraphQl(
  input: Partial<LearningResourceLibraryGraphQlInput> = {},
  signal?: AbortSignal,
): Promise<LearningResourceLibraryGraphQl> {
  const page = Number(input.page ?? 0);
  const size = Number(input.size ?? 100);
  const variables = {
    input: compactObject({
      tenantId: input.tenantId ?? getDefaultTenantId(),
      educationUnitId: input.educationUnitId,
      academicYear: input.academicYear,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      categoryId: input.categoryId,
      sectionId: input.sectionId,
      topicId: input.topicId,
      status: input.status ?? "active",
      visibility: input.visibility,
      page: Number.isFinite(page) && page >= 0 ? page : 0,
      size: Number.isFinite(size) && size > 0 ? size : 100,
    }),
  };
  const data = await graphQlRequest<LearningResourceLibraryGraphQlData, typeof variables>({
    operationName: "LcmsLearningResourceLibrary",
    portal: "lcms",
    query: LearningResourceLibraryDocument,
    signal,
    variables,
  });
  return validateResponse(
    data,
    isLearningResourceLibraryGraphQlData,
    "lcms.learning-resource-library",
  ).lms.learningResourceLibrary;
}

function isLearningResourceLibraryGraphQlData(
  value: unknown,
): value is { lms: { learningResourceLibrary: LearningResourceLibraryGraphQl } } {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.learningResourceLibrary)) return false;
  const library = value.lms.learningResourceLibrary;
  return Array.isArray(library.taxonomyTree) && isObject(library.resources) &&
    Array.isArray(library.resources.items);
}

export function loadLearningResourceStudioBootstrap() {
  return loadLearningResourceLibraryGraphQl().then(mapGraphQlLibraryToStudioBootstrap);
}

export function loadLearningResourceCurriculumTree() {
  return loadLearningResourceLibraryGraphQl().then(mapGraphQlLibraryToCurriculumTree);
}

export async function loadLearningResourceTaxonomies() {
  const library = await loadLearningResourceLibraryGraphQl({ size: 1 });
  return mapGraphQlLibraryToTaxonomies(library);
}

export async function loadLearningResourceStudioWorkspaceData(limit = 120, signal?: AbortSignal) {
  const library = await loadLearningResourceLibraryGraphQl({ size: limit }, signal);
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  const resources = mapGraphQlLibraryToResources(library, { limit });

  return {
    taxonomy,
    subjects: taxonomy.subjects,
    resources,
  };
}

export async function listLearningResourceTaxonomies(kind: string) {
  const taxonomy = await loadLearningResourceTaxonomies();

  switch (kind) {
    case "subjects":
      return taxonomy.subjects;
    case "categories":
    case "groups":
      return taxonomy.categories;
    case "sections":
    case "lessons":
      return taxonomy.sections;
    case "topics":
      return taxonomy.topics;
    case "book-series":
    case "bookSeries":
      return taxonomy.bookSeries;
    default:
      return [];
  }
}

export function listLearningResourceSubjects() {
  return listLearningResourceTaxonomies("subjects");
}

export async function listLearningResourceResources(params: Record<string, string | number | undefined> = {}) {
  const limit = Number(params.limit ?? 100);
  const library = await loadLearningResourceLibraryGraphQl({
    subjectId: stringParam(params.subjectId),
    categoryId: stringParam(params.categoryId || params.levelId),
    sectionId: stringParam(params.sectionId),
    topicId: stringParam(params.topicId || params.sectionId),
    size: Number.isFinite(limit) && limit > 0 ? limit : 100,
  });
  return mapGraphQlLibraryToResources(library, params);
}

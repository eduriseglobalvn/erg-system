import { listLearningResourceResources } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { LearningResourceResource, LearningResourceResourceSection } from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import {
  mapGraphQlLearningResourceToResource,
  mapGraphQlLibraryToBootstrap,
  mapGraphQlLibraryToProgress,
  mapGraphQlLibraryToSections,
} from "@/features/lms/learning-resources/api/learning-resource-graphql-mapper";
import { loadGraphQlLearningResourceLibrary } from "@/features/lms/learning-resources/api/learning-resource-graphql-transport";
import { groupCardsBySection, mapCardToResource } from "@/features/lms/learning-resources/api/learning-resource-mapper";
import {
  getMockLearningResourceLibrarySections,
  mockLibraryBootstrap,
} from "@/features/lms/learning-resources/api/learning-resource-mock-library";
import { LEARNING_RESOURCE_LIBRARY_SECTIONS } from "@/features/lms/learning-resources/api/learning-resource-mock-data";
import type { LearningResourceLibraryProgressDTO } from "@/features/lms/learning-resources/api/learning-resource-types";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";

export async function loadLearningResourceLibraryBootstrap(
  input: { schoolId: string; academicYear: string; tenantId?: string },
  signal?: AbortSignal,
) {
  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({
    educationUnitId: input.schoolId,
    academicYear: input.academicYear,
    tenantId: input.tenantId,
  }, signal);

  if (graphQlLibrary?.resources.items.length || graphQlLibrary?.taxonomyTree.length) {
    return mapGraphQlLibraryToBootstrap(graphQlLibrary, input);
  }

  if (runtimeFixturesEnabled()) {
    return mockLibraryBootstrap(input);
  }

  return { schoolId: input.schoolId, academicYear: input.academicYear, subjects: [] };
}

export async function loadLearningResourceLibraryProgress(
  input: { schoolId: string; academicYear: string; tenantId?: string },
  signal?: AbortSignal,
) {
  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({
    educationUnitId: input.schoolId,
    academicYear: input.academicYear,
    tenantId: input.tenantId,
  }, signal);

  if (graphQlLibrary?.progress.length) {
    return mapGraphQlLibraryToProgress(graphQlLibrary, input);
  }

  return { schoolId: input.schoolId, academicYear: input.academicYear, lessons: [] } satisfies LearningResourceLibraryProgressDTO;
}

export async function loadLearningResourceLibrarySections(): Promise<LearningResourceResourceSection[]> {
  if (runtimeFixturesEnabled()) return getMockLearningResourceLibrarySections();

  const graphQlLibrary = await loadGraphQlLearningResourceLibrary();
  if (graphQlLibrary?.resources.items.length) {
    return mapGraphQlLibraryToSections(graphQlLibrary);
  }

  try {
    const result = await listLearningResourceResources({ limit: 100 });
    const cards = result.data;
    return groupCardsBySection(cards.map(mapCardToResource));
  } catch (error) {
    if (runtimeFixturesEnabled()) return LEARNING_RESOURCE_LIBRARY_SECTIONS;
    throw error;
  }
}

export async function loadLearningResourceResourcesBySubject(subjectId: string): Promise<LearningResourceResource[]> {
  if (runtimeFixturesEnabled()) {
    return getMockLearningResourceLibrarySections()
      .flatMap((section) => section.resources)
      .filter((resource) => resource.subjectId === subjectId);
  }

  const graphQlLibrary = await loadGraphQlLearningResourceLibrary({ subjectId });
  if (graphQlLibrary?.resources.items.length) {
    return graphQlLibrary.resources.items
      .filter((resource) => !subjectId || resource.subjectId === subjectId)
      .map((resource, index) =>
        mapGraphQlLearningResourceToResource(resource, {
          subjectId: resource.subjectId || subjectId,
          groupId: resource.categoryId || resource.subjectId || subjectId,
          lessonId: resource.sectionId || resource.topicId || resource.categoryId || resource.subjectId || subjectId,
          sortOrder: index + 1,
        }),
      );
  }

  try {
    const result = await listLearningResourceResources({ subjectId, limit: 100 });
    const cards = result.data;
    return cards.map((card, index) => mapCardToResource(card, index));
  } catch (error) {
    if (runtimeFixturesEnabled()) {
      return LEARNING_RESOURCE_LIBRARY_SECTIONS.flatMap((section) => section.resources).filter((resource) => resource.subjectId === subjectId);
    }
    throw error;
  }
}

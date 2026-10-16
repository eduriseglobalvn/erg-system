import {
  mockLearningResourceAuthoringResources,
  mockLearningResourceAuthoringTaxonomy,
} from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import type {
  LearningResourceCategory,
  LearningResourceResourceSection,
  LearningResourceSubject,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import { LEARNING_RESOURCE_LIBRARY_SECTIONS } from "@/features/lms/learning-resources/api/learning-resource-mock-data";
import { groupCardsBySection, mapCardToResource } from "@/features/lms/learning-resources/api/learning-resource-mapper";
import type { LearningResourceLibraryBootstrapDTO } from "@/features/lms/learning-resources/api/learning-resource-types";

export function getMockLearningResourceLibrarySubjects(): LearningResourceSubject[] {
  return mockLearningResourceAuthoringTaxonomy.subjects.map((subject) => ({
    id: subject.id,
    label: subject.label,
  }));
}

export function getMockLearningResourceLibraryCategories(): LearningResourceCategory[] {
  const subjectRoots: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.subjects.map((subject) => ({
    id: subject.id,
    label: subject.label,
    icon: subject.id === "mock-stem" ? "stem" : "certificate",
  }));
  const categoryFolders: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.categories.map((category) => ({
    id: category.id,
    label: category.label,
    parentId: category.subjectId,
    icon: category.subjectId === "mock-stem" ? "stem" : "certificate",
  }));
  const sectionFolders: LearningResourceCategory[] = mockLearningResourceAuthoringTaxonomy.sections.map((section) => ({
    id: section.id,
    label: section.label,
    parentId: section.categoryId,
    icon: "document",
  }));

  return [...subjectRoots, ...categoryFolders, ...sectionFolders];
}

export function getDefaultMockLearningResourceLibrarySelection(gradeId: string) {
  const subjectId = mockLearningResourceAuthoringTaxonomy.subjects[0]?.id ?? "mock-ic3-gs6";

  return {
    gradeId,
    subjectId,
    categoryId: subjectId,
  };
}

export function getMockLearningResourceLibrarySections(): LearningResourceResourceSection[] {
  return groupCardsBySection(mockLearningResourceAuthoringResources.map((resource, index) => mapCardToResource(resource, index)));
}

export function mockLibraryBootstrap(input: { schoolId: string; academicYear: string }): LearningResourceLibraryBootstrapDTO {
  const subjects = LEARNING_RESOURCE_LIBRARY_SECTIONS.map((section) => ({
    id: section.subjectId,
    label: section.title,
    groups: [
      {
        id: section.id,
        label: section.subtitle || section.title,
        lessons: [
          {
            id: section.id,
            label: section.subtitle || section.title,
            progressRate: 0,
            resources: section.resources.map((resource) => ({
              id: resource.id,
              title: resource.title,
              type: resource.resourceType === "quiz" || resource.fileType === "QUIZ" ? "exercise" : "lecture",
              fileType: resource.fileType,
              thumbnailUrl: resource.thumbnailUrl,
              launchUrl: resource.viewer.embedUrl || resource.viewer.secureEmbedUrl,
            })),
          },
        ],
      },
    ],
  }));

  return {
    schoolId: input.schoolId,
    academicYear: input.academicYear,
    subjects,
  };
}

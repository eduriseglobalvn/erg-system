import type {
  LearningResourceResourceCard,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { LocalContentItem } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export const USE_LEARNING_RESOURCE_AUTHORING_MOCK = false;
export const mockLearningResourceAuthoringTaxonomy: LearningResourceTaxonomyResponse = {
  bookSeries: [],
  categories: [],
  fileTypes: [],
  grades: [],
  sections: [],
  subjects: [],
  topics: [],
};
export const mockLearningResourceAuthoringResources: LearningResourceResourceCard[] = [];
export const mockLearningResourceAuthoringLocalContent: LocalContentItem[] = [];

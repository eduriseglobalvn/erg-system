import type {
  LearningResourceResourceCard,
  LearningResourceTaxonomyResponse,
} from "@/features/lms/learning-resources/api/learning-resource-authoring-api";
import type { LocalContentItem } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";

// Production never seeds the authoring workspace with demo content; the flag stays false and the
// collections stay empty. Demo data: src/test/fixtures/mock-learning-resource-authoring-data.ts.
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
export const mockExerciseLibrary: ExerciseLibraryItem[] = [];
export const fallbackQuizBankItems: QuizBankItem[] = [];

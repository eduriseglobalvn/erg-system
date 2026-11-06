import type { CurriculumProgramRow } from "@/features/lcms/admin-operations/api/curriculum-program-api";

export type EditableCurriculumRow = CurriculumProgramRow & {
  isNew?: boolean;
};

export type TopicGroup = { topic: string; start: number; end: number; count: number };

import type { LocalContentItem, StudioNode, StudioSubject, TaxonomyCreateKind, TaxonomyCreateMode, TaxonomyDialogState } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

export interface TaxonomyCreateDialogProps {
  state: TaxonomyDialogState;
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  quizBankItems: QuizBankItem[];
  onClose: () => void;
  onCreateLocalContent: (items: LocalContentItem[]) => Promise<void>;
  onCreateLecture: (payload: {
    title: string;
    subtitle?: string;
    description?: string;
    thumbnailUrl?: string;
    upstreamUrl?: string;
    programSlug: string;
    subjectId: string;
    categoryId: string;
    sectionId?: string;
    bookSeriesId?: string;
    topicId?: string;
    documentTypeId?: string;
    selectedFileType: "PPTX";
    totalSlides?: number;
    status: string;
    visibility: string;
    canDownload: boolean;
  }) => Promise<void>;
  onUploadResource: () => Promise<void>;
  onCreated: (result: { mode: TaxonomyCreateMode; kind: TaxonomyCreateKind; id: string; subjectId?: string }) => Promise<void>;
}


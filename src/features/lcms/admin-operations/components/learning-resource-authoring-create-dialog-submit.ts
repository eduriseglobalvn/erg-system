import { createLearningResourceTaxonomy, uploadLearningResourceResource, type CreateTaxonomyPayload } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { apiKindForNodeKind, normalizeTaxonomyOption, parsePositiveInteger } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { getTaxonomyIconColor, getTaxonomyIconId, type TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { StudioNode, StudioSubject, TaxonomyCreateKind, TaxonomyDialogState } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { normalizeGoogleSlidesUrl, normalizeGoogleViewerUrl, type ContentDialogOptionId, type ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type { ResolvedTaxonomyMode } from "./learning-resource-authoring-create-dialog-config";
import type { TaxonomyCreateDialogProps } from "./learning-resource-authoring-create-dialog-types";

interface SubmissionInput {
  description: string;
  draftLevelId: string;
  draftSubjectId: string;
  filteredExercises: ExerciseLibraryItem[];
  iconColor: string;
  iconId: string;
  label: string;
  onClose: TaxonomyCreateDialogProps["onClose"];
  onCreateLecture: TaxonomyCreateDialogProps["onCreateLecture"];
  onCreateLocalContent: TaxonomyCreateDialogProps["onCreateLocalContent"];
  onCreated: TaxonomyCreateDialogProps["onCreated"];
  onUploadResource: TaxonomyCreateDialogProps["onUploadResource"];
  resourceFileType: string;
  resourceLocation: ReturnType<typeof import("@/features/lcms/admin-operations/components/learning-resource-authoring-utils").buildResourceLocation>;
  resourceTotalSlides: string;
  resourceUrl: string;
  selectedExerciseIds: string[];
  selectedNode?: StudioNode;
  selectedOption: ContentDialogOptionId | null;
  selectedSubject?: StudioSubject;
  slidesUrl: string;
  state: TaxonomyDialogState;
  status: string;
  taxonomyMode: ResolvedTaxonomyMode;
}

export async function executeCreateDialogSubmission(input: SubmissionInput) {
  if (input.taxonomyMode) return submitTaxonomy(input.taxonomyMode, input);
  if (input.selectedOption === "lecture") return submitLecture(input);
  if (input.selectedOption === "exercise") return submitExercises(input);
  if (input.selectedOption === "resource") return submitResource(input);
}

async function submitTaxonomy(mode: TaxonomyRole, input: SubmissionInput) {
  const trimmedLabel = input.label.trim();
  if (!trimmedLabel) {
    throw new Error(mode === "subject" ? "Vui lòng nhập tên môn học." : mode === "level" ? "Vui lòng nhập tên level." : "Vui lòng nhập tên chủ đề.");
  }
  if ((mode === "level" || mode === "topic") && !input.draftSubjectId) throw new Error("Vui lòng chọn môn học.");
  if (mode === "topic" && !input.draftLevelId) throw new Error("Vui lòng chọn level cha.");

  const resolvedKind: TaxonomyCreateKind = mode === "topic" ? "section" : "category";
  const payload: CreateTaxonomyPayload = {
    label: trimmedLabel,
    description: input.description.trim(),
    status: input.status,
    metadata: {
      iconId: getTaxonomyIconId(input.iconId, mode),
      iconColor: getTaxonomyIconColor(input.iconColor, mode),
      taxonomyRole: mode,
    },
  };
  if (mode === "level" || mode === "topic") payload.subjectId = input.draftSubjectId;
  if (mode === "topic") payload.categoryId = input.draftLevelId;

  const created = normalizeTaxonomyOption(
    await createLearningResourceTaxonomy(mode === "subject" ? "subjects" : apiKindForNodeKind(resolvedKind), payload),
  );
  if (!created?.id) throw new Error("BE đã tạo dữ liệu nhưng không trả về id hợp lệ.");

  await input.onCreated({
    mode: input.state?.mode ?? mode,
    kind: resolvedKind,
    id: created.id,
    subjectId: mode === "subject" ? created.id : input.draftSubjectId,
  });
  input.onClose();
}

async function submitLecture(input: SubmissionInput) {
  const trimmedLabel = input.label.trim();
  const normalizedSlidesUrl = normalizeGoogleSlidesUrl(input.slidesUrl);
  if (!trimmedLabel) throw new Error("Vui lòng nhập tên bài giảng.");
  if (!input.selectedSubject || !input.selectedNode?.optionId) throw new Error("Vui lòng chọn chủ đề trước khi thêm bài giảng.");
  if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");
  if (!input.resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được level để gắn bài giảng.");

  await input.onCreateLecture({
    title: trimmedLabel,
    subtitle: "Google Slides",
    upstreamUrl: normalizedSlidesUrl,
    programSlug: input.selectedSubject.id,
    subjectId: input.selectedSubject.id,
    categoryId: input.resourceLocation.categoryId,
    sectionId: input.resourceLocation.sectionId,
    bookSeriesId: input.resourceLocation.bookSeriesId,
    topicId: input.resourceLocation.topicId,
    documentTypeId: "lecture",
    selectedFileType: "PPTX",
    status: input.status,
    visibility: input.status === "hidden" ? "private" : "public",
    canDownload: false,
  });
}

async function submitExercises(input: SubmissionInput) {
  const parentOptionId = input.selectedNode?.optionId;
  if (!input.selectedSubject || !input.selectedNode || !parentOptionId) throw new Error("Vui lòng chọn chủ đề trước khi gắn bài tập.");
  if (!input.selectedExerciseIds.length) throw new Error("Vui lòng chọn ít nhất một bài tập từ Quiz bank.");

  const selectedExercises = input.filteredExercises.filter((item) => input.selectedExerciseIds.includes(item.id));
  const timestamp = Date.now();
  await input.onCreateLocalContent(selectedExercises.map((item) => ({
    id: `exercise-${item.id}-${timestamp}`,
    kind: "exercise",
    subjectId: input.selectedSubject!.id,
    parentNodeId: input.selectedNode!.id,
    parentOptionId,
    title: item.title,
    description: input.description.trim() || [item.topicLabel, item.sectionLabel].filter(Boolean).join(" / "),
    topicLabel: item.topicLabel,
    sectionLabel: item.sectionLabel,
    questionCount: item.questionCount,
    durationMinutes: item.durationMinutes,
    sourceQuizId: item.sourceQuizId ?? item.id,
    sourceLabel: item.sourceLabel ?? "Quiz bank",
    quizKind: item.quizKind,
    scopeLabel: item.scopeLabel,
    status: input.status,
  })));
}

async function submitResource(input: SubmissionInput) {
  const normalizedResourceUrl = normalizeGoogleViewerUrl(input.resourceUrl);
  if (!input.selectedSubject || !input.selectedNode) throw new Error("Vui lòng chọn chủ đề cần gắn tài liệu.");
  if (!input.resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được level để gắn tài liệu.");
  if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive hoặc Google Slides.");
  const parsedTotalSlides = parsePositiveInteger(input.resourceTotalSlides);
  if (input.resourceFileType === "PPTX" && input.resourceTotalSlides.trim() && !parsedTotalSlides) {
    throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
  }

  await uploadLearningResourceResource({
    title: input.label.trim() || "Tài liệu Google Drive",
    description: input.description.trim(),
    selectedFileType: input.resourceFileType,
    subjectId: input.selectedSubject.id,
    programSlug: input.selectedSubject.id,
    categoryId: input.resourceLocation.categoryId,
    sectionId: input.resourceLocation.sectionId,
    bookSeriesId: input.resourceLocation.bookSeriesId,
    topicId: input.resourceLocation.topicId,
    documentTypeId: input.resourceFileType,
    status: input.status,
    visibility: input.status === "hidden" ? "private" : "public",
    upstreamUrl: normalizedResourceUrl,
    totalSlides: parsedTotalSlides,
    canDownload: input.resourceFileType !== "PPTX",
  });
  await input.onUploadResource();
}


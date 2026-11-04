import { createLearningResourceTaxonomy, uploadLearningResourceResource, type CreateTaxonomyPayload } from "@/features/lms/learning-resources/api/learning-resource-authoring-api";
import { apiKindForNodeKind, normalizeTaxonomyOption, parsePositiveInteger } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { getTaxonomyIconColor, getTaxonomyIconId, type TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { StudioNode, StudioSubject, TaxonomyCreateKind, TaxonomyDialogState } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { normalizeGoogleSlidesUrl, normalizeGoogleViewerUrl, type ContentDialogOptionId, type ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type { AuthoringItemType } from "./learning-resource-authoring-create-dialog-presentation";
import type { ResolvedTaxonomyMode } from "./learning-resource-authoring-create-dialog-config";
import type { TaxonomyCreateDialogProps } from "./learning-resource-authoring-create-dialog-types";

interface SubmissionInput {
  description: string;
  draftLevelId: string;
  draftSubjectId: string;
  draftTopicId?: string;
  draftTopicOptions?: StudioNode[];
  filteredExercises: ExerciseLibraryItem[];
  iconColor: string;
  iconId: string;
  itemType?: AuthoringItemType;
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
  subjects?: StudioSubject[];
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
  let targetLevelId = input.draftLevelId;
  if (mode === "topic" && !targetLevelId) {
    const existing = input.selectedSubject?.tree.find((node) => node.optionId)
      ?? input.subjects?.find((s) => s.id === input.draftSubjectId)?.tree.find((node) => node.optionId);
    if (existing?.optionId) {
      targetLevelId = existing.optionId;
    } else if (input.draftSubjectId) {
      const createdLevel = normalizeTaxonomyOption(
        await createLearningResourceTaxonomy("levels", {
          label: "Chung",
          description: "Chương trình chung",
          subjectId: input.draftSubjectId,
          status: "active",
          metadata: { taxonomyRole: "level" },
        }),
      );
      targetLevelId = createdLevel?.id ?? "";
    }
  }

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
  if (mode === "topic" && targetLevelId) payload.categoryId = targetLevelId;

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

async function resolveTargetTopicAndLevel(input: SubmissionInput): Promise<{
  subjectId: string;
  targetLevelId: string;
  targetTopicId: string;
}> {
  const subjectId = input.draftSubjectId || input.selectedSubject?.id || input.subjects?.[0]?.id;
  if (!subjectId) throw new Error("Vui lòng chọn môn học.");

  // Resolve targetLevelId
  let targetLevelId = input.draftLevelId || input.resourceLocation.categoryId || "";
  if (!targetLevelId) {
    const existingLevel = input.selectedSubject?.tree.find((node) => node.optionId)
      ?? input.subjects?.find((s) => s.id === subjectId)?.tree.find((node) => node.optionId);
    if (existingLevel?.optionId) {
      targetLevelId = existingLevel.optionId;
    }
  }

  // Resolve targetTopicId
  let targetTopicId = input.draftTopicId || "";
  if (!targetTopicId) {
    if (input.selectedNode?.optionId && (input.selectedNode.kind === "lesson" || input.selectedNode.kind === "section" || input.selectedNode.kind === "topic")) {
      targetTopicId = input.selectedNode.optionId;
    } else if (input.draftTopicOptions?.length) {
      targetTopicId = input.draftTopicOptions[0].optionId || input.draftTopicOptions[0].id;
    }
  }

  // If still no topic, auto-create level (if none) and default topic
  if (!targetTopicId) {
    if (!targetLevelId) {
      const createdLevel = normalizeTaxonomyOption(
        await createLearningResourceTaxonomy("levels", {
          label: "Chung",
          description: "Chương trình chung",
          subjectId,
          status: "active",
          metadata: { taxonomyRole: "level" },
        }),
      );
      targetLevelId = createdLevel?.id ?? "";
    }

    const createdTopic = normalizeTaxonomyOption(
      await createLearningResourceTaxonomy("sections", {
        label: "Chủ đề chung",
        description: "Chủ đề học tập",
        subjectId,
        categoryId: targetLevelId,
        status: "active",
        metadata: { taxonomyRole: "topic" },
      }),
    );
    targetTopicId = createdTopic?.id ?? "";
  }

  return { subjectId, targetLevelId, targetTopicId };
}

async function submitLecture(input: SubmissionInput) {
  const trimmedLabel = input.label.trim();
  const normalizedSlidesUrl = normalizeGoogleSlidesUrl(input.slidesUrl);
  if (!trimmedLabel) throw new Error("Vui lòng nhập tên bài giảng.");
  if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");

  const { subjectId, targetLevelId, targetTopicId } = await resolveTargetTopicAndLevel(input);

  await input.onCreateLecture({
    title: trimmedLabel,
    subtitle: "Google Slides",
    upstreamUrl: normalizedSlidesUrl,
    programSlug: subjectId,
    subjectId,
    categoryId: targetLevelId,
    sectionId: targetTopicId,
    bookSeriesId: "",
    topicId: targetTopicId,
    documentTypeId: "lecture",
    selectedFileType: "PPTX",
    status: input.status,
    visibility: input.status === "hidden" ? "private" : "public",
    canDownload: false,
  });
}

async function submitExercises(input: SubmissionInput) {
  if (!input.selectedExerciseIds.length) throw new Error("Vui lòng chọn ít nhất một bài tập từ Quiz bank.");

  const { subjectId, targetTopicId } = await resolveTargetTopicAndLevel(input);

  const selectedExercises = input.filteredExercises.filter((item) => input.selectedExerciseIds.includes(item.id));
  const timestamp = Date.now();
  await input.onCreateLocalContent(selectedExercises.map((item) => ({
    id: `exercise-${item.id}-${timestamp}`,
    kind: "exercise",
    subjectId,
    parentNodeId: targetTopicId,
    parentOptionId: targetTopicId,
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
  if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive hoặc Google Slides.");
  const parsedTotalSlides = parsePositiveInteger(input.resourceTotalSlides);
  if (input.resourceFileType === "PPTX" && input.resourceTotalSlides.trim() && !parsedTotalSlides) {
    throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
  }

  const { subjectId, targetLevelId, targetTopicId } = await resolveTargetTopicAndLevel(input);

  await uploadLearningResourceResource({
    title: input.label.trim() || "Tài liệu Google Drive",
    description: input.description.trim(),
    selectedFileType: input.resourceFileType,
    subjectId,
    programSlug: subjectId,
    categoryId: targetLevelId,
    sectionId: targetTopicId,
    bookSeriesId: "",
    topicId: targetTopicId,
    documentTypeId: input.resourceFileType,
    status: input.status,
    visibility: input.status === "hidden" ? "private" : "public",
    upstreamUrl: normalizedResourceUrl,
    totalSlides: parsedTotalSlides,
    canDownload: input.resourceFileType !== "PPTX",
  });
  await input.onUploadResource();
}

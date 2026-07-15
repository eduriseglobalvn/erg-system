import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import TextField from "@mui/material/TextField";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import {
  BookOpen,
  ChevronLeft,
  FileQuestion,
  FileText,
  Folder,
  Layers3,
  Presentation,
  Search,
  X,
} from "@/components/mui-icon-shim";

import { inputClassName } from "@/components/ui/input";
import { AppSelect } from "@/components/ui/app-select";
import {
  createLearningResourceTaxonomy,
  uploadLearningResourceResource,
  type CreateTaxonomyPayload,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { mockExerciseLibrary } from "@/features/lcms/admin-operations/api/mock-exercise-library";
import {
  filterExerciseLibraryItems,
  isGoogleSlidesUrl,
  normalizeGoogleSlidesUrl,
  normalizeGoogleViewerUrl,
  resolveExerciseLibraryItems,
  type ContentDialogOptionId,
  type ExerciseLibraryItem,
} from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type {
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyCreateKind,
  TaxonomyCreateMode,
  TaxonomyDialogState,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import {
  apiKindForNodeKind,
  buildResourceLocation,
  defaultStatusForOption,
  normalizeTaxonomyOption,
  parsePositiveInteger,
  pathLabel,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import {
  getTaxonomyIconColor,
  getTaxonomyIconId,
  taxonomyIconColorOptions,
  TaxonomyIcon,
  type TaxonomyRole,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

type DialogStep = "pick" | "details";
type ResolvedTaxonomyMode = TaxonomyRole | null;

const RESOURCE_BLUE = "#0F6CBD";
const RESOURCE_BLUE_SOFT = "#EAF4FF";
const RESOURCE_BLUE_BORDER = "#B8D6FA";
const RESOURCE_RED = "#F35C6B";
const RESOURCE_RED_SOFT = "#FFF1F3";
const RESOURCE_RED_BORDER = "#FFD0D6";
const RESOURCE_BORDER = "rgba(145,158,171,0.2)";

const quickIconIdsByRole: Record<TaxonomyRole, string[]> = {
  subject: ["LocalLibrary", "AutoStories", "School", "DesktopWindows"],
  level: ["Layers", "BookmarkAdded", "Class", "School"],
  topic: ["Folder", "Article", "Slideshow", "Quiz"],
};

export function TaxonomyCreateDialog({
  state,
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  quizBankItems,
  onClose,
  onCreateLocalContent,
  onCreateLecture,
  onUploadResource,
  onCreated,
}: {
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
}) {
  const [step, setStep] = useState<DialogStep>("details");
  const [selectedOption, setSelectedOption] = useState<ContentDialogOptionId | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [draftLevelId, setDraftLevelId] = useState("");
  const [iconId, setIconId] = useState("");
  const [iconColor, setIconColor] = useState("");
  const [slidesUrl, setSlidesUrl] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [resourceFileType, setResourceFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTotalSlides, setResourceTotalSlides] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const open = Boolean(state);
  const availableOptions = useMemo(() => getAvailableDialogOptions(state, selectedNode), [selectedNode, state]);
  const taxonomyMode = resolveTaxonomyMode(state, selectedOption);
  const taxonomyRole: TaxonomyRole = taxonomyMode ?? "topic";
  const isTaxonomyMode = Boolean(taxonomyMode);
  const draftSubject = subjects.find((subject) => subject.id === draftSubjectId) ?? selectedSubject ?? subjects[0];
  const draftLevelOptions = draftSubject?.tree.filter(isLevelNode) ?? [];
  const selectedLevelFromPath = selectedPath.find(isLevelNode);
  const selectedLevelLabel = selectedLevelFromPath?.label;
  const resourceLocation = useMemo(() => buildResourceLocation(selectedPath), [selectedPath]);
  const title = getDialogTitle(taxonomyMode, selectedOption);
  const subtitle = getDialogSubtitle(taxonomyMode, selectedOption);
  const contextLabel = pathLabel(selectedSubject?.label ?? draftSubject?.label ?? "", selectedPath);
  const exerciseLibraryItems = useMemo(() => {
    return resolveExerciseLibraryItems(quizBankItems, mockExerciseLibrary, hasApiBase());
  }, [quizBankItems]);
  const filteredExercises = filterExerciseLibraryItems(exerciseLibraryItems, {
    query: exerciseQuery,
    subjectId: selectedSubject?.id,
    subjectLabel: selectedSubject?.label,
    topicLabel: selectedNode?.kind === "lesson" ? selectedNode.label : undefined,
    sectionLabel: selectedLevelLabel,
  });
  const submitLabel = getSubmitLabel(taxonomyMode, selectedOption, saving);
  const canSubmit = getCanSubmit({
    draftLevelId,
    draftSubjectId,
    label,
    resourceUrl,
    selectedExerciseIds,
    selectedOption,
    slidesUrl,
    taxonomyMode,
    saving,
  });
  const submitHint = getSubmitHint({
    canSubmit,
    draftLevelId,
    draftSubjectId,
    label,
    resourceUrl,
    selectedExerciseIds,
    selectedOption,
    slidesUrl,
    taxonomyMode,
  });

  useEffect(() => {
    if (!open) return;
    const autoOption = state?.initialOption ?? (availableOptions.length === 1 ? availableOptions[0] : null);
    const nextTaxonomyMode = resolveTaxonomyMode(state, autoOption);
    const nextSubjectId = selectedSubject?.id || subjects[0]?.id || "";
    const contextLevelId =
      selectedNode?.sourceKind === "category" && selectedNode.optionId
        ? selectedNode.optionId
        : selectedNode?.location.categoryId || selectedLevelFromPath?.optionId || "";

    setStep(nextTaxonomyMode || autoOption ? "details" : "pick");
    setSelectedOption(autoOption);
    setLabel("");
    setDescription("");
    setDraftSubjectId(nextSubjectId);
    setDraftLevelId(contextLevelId);
    setIconId(getTaxonomyIconId(undefined, nextTaxonomyMode ?? "topic"));
    setIconColor(getTaxonomyIconColor(undefined, nextTaxonomyMode ?? "topic"));
    setSlidesUrl("");
    setExerciseQuery("");
    setSelectedExerciseIds([]);
    setResourceFileType("PDF");
    setResourceUrl("");
    setResourceTotalSlides("");
    setStatus(defaultStatusForOption(autoOption, state?.mode === "subject"));
    setError("");
    setSaving(false);
  }, [
    availableOptions,
    open,
    selectedLevelFromPath?.optionId,
    selectedNode,
    selectedSubject?.id,
    state,
    subjects,
  ]);

  useEffect(() => {
    if (!open || taxonomyMode !== "topic") return;
    if (draftLevelOptions.some((node) => node.optionId === draftLevelId)) return;
    setDraftLevelId(draftLevelOptions[0]?.optionId ?? "");
  }, [draftLevelId, draftLevelOptions, open, taxonomyMode]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, saving]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!state) return;

    setSaving(true);
    setError("");
    try {
      if (taxonomyMode) {
        await submitTaxonomy(taxonomyMode);
        return;
      }

      if (selectedOption === "lecture") {
        await submitLecture();
        return;
      }

      if (selectedOption === "exercise") {
        await submitExercises();
        return;
      }

      if (selectedOption === "resource") {
        await submitResource();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tạo mục. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  async function submitTaxonomy(mode: TaxonomyRole) {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      throw new Error(mode === "subject" ? "Vui lòng nhập tên môn học." : mode === "level" ? "Vui lòng nhập tên level." : "Vui lòng nhập tên chủ đề.");
    }
    if ((mode === "level" || mode === "topic") && !draftSubjectId) {
      throw new Error("Vui lòng chọn môn học.");
    }
    if (mode === "topic" && !draftLevelId) {
      throw new Error("Vui lòng chọn level cha.");
    }

    const resolvedKind: TaxonomyCreateKind = mode === "topic" ? "section" : "category";
    const payload: CreateTaxonomyPayload = {
      label: trimmedLabel,
      description: description.trim(),
      status,
      metadata: {
        iconId: getTaxonomyIconId(iconId, mode),
        iconColor: getTaxonomyIconColor(iconColor, mode),
        taxonomyRole: mode,
      },
    };

    if (mode === "level" || mode === "topic") {
      payload.subjectId = draftSubjectId;
    }
    if (mode === "topic") {
      payload.categoryId = draftLevelId;
    }

    const created = normalizeTaxonomyOption(
      await createLearningResourceTaxonomy(mode === "subject" ? "subjects" : apiKindForNodeKind(resolvedKind), payload),
    );
    if (!created?.id) {
      throw new Error("BE đã tạo dữ liệu nhưng không trả về id hợp lệ.");
    }

    await onCreated({
      mode: state?.mode ?? mode,
      kind: resolvedKind,
      id: created.id,
      subjectId: mode === "subject" ? created.id : draftSubjectId,
    });
    onClose();
  }

  async function submitLecture() {
    const trimmedLabel = label.trim();
    const normalizedSlidesUrl = normalizeGoogleSlidesUrl(slidesUrl);
    if (!trimmedLabel) throw new Error("Vui lòng nhập tên bài giảng.");
    if (!selectedSubject || !selectedNode?.optionId) throw new Error("Vui lòng chọn chủ đề trước khi thêm bài giảng.");
    if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");
    if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được level để gắn bài giảng.");

    await onCreateLecture({
      title: trimmedLabel,
      subtitle: "Google Slides",
      upstreamUrl: normalizedSlidesUrl,
      programSlug: selectedSubject.id,
      subjectId: selectedSubject.id,
      categoryId: resourceLocation.categoryId,
      sectionId: resourceLocation.sectionId,
      bookSeriesId: resourceLocation.bookSeriesId,
      topicId: resourceLocation.topicId,
      documentTypeId: "lecture",
      selectedFileType: "PPTX",
      status,
      visibility: status === "hidden" ? "private" : "public",
      canDownload: false,
    });
  }

  async function submitExercises() {
    const parentOptionId = selectedNode?.optionId;
    if (!selectedSubject || !selectedNode || !parentOptionId) throw new Error("Vui lòng chọn chủ đề trước khi gắn bài tập.");
    if (!selectedExerciseIds.length) throw new Error("Vui lòng chọn ít nhất một bài tập từ Quiz bank.");

    const selectedExercises = filteredExercises.filter((item) => selectedExerciseIds.includes(item.id));
    const timestamp = Date.now();
    await onCreateLocalContent(
      selectedExercises.map((item) => ({
        id: `exercise-${item.id}-${timestamp}`,
        kind: "exercise",
        subjectId: selectedSubject.id,
        parentNodeId: selectedNode.id,
        parentOptionId,
        title: item.title,
        description: description.trim() || [item.topicLabel, item.sectionLabel].filter(Boolean).join(" / "),
        topicLabel: item.topicLabel,
        sectionLabel: item.sectionLabel,
        questionCount: item.questionCount,
        durationMinutes: item.durationMinutes,
        sourceQuizId: item.sourceQuizId ?? item.id,
        sourceLabel: item.sourceLabel ?? "Quiz bank",
        quizKind: item.quizKind,
        scopeLabel: item.scopeLabel,
        status,
      })),
    );
  }

  async function submitResource() {
    const normalizedResourceUrl = normalizeGoogleViewerUrl(resourceUrl);
    if (!selectedSubject || !selectedNode) throw new Error("Vui lòng chọn chủ đề cần gắn tài liệu.");
    if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được level để gắn tài liệu.");
    if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive hoặc Google Slides.");
    const parsedTotalSlides = parsePositiveInteger(resourceTotalSlides);
    if (resourceFileType === "PPTX" && resourceTotalSlides.trim() && !parsedTotalSlides) throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");

    await uploadLearningResourceResource({
      title: label.trim() || "Tài liệu Google Drive",
      description: description.trim(),
      selectedFileType: resourceFileType,
      subjectId: selectedSubject.id,
      programSlug: selectedSubject.id,
      categoryId: resourceLocation.categoryId,
      sectionId: resourceLocation.sectionId,
      bookSeriesId: resourceLocation.bookSeriesId,
      topicId: resourceLocation.topicId,
      documentTypeId: resourceFileType,
      status,
      visibility: status === "hidden" ? "private" : "public",
      upstreamUrl: normalizedResourceUrl,
      totalSlides: parsedTotalSlides,
      canDownload: resourceFileType !== "PPTX",
    });
    await onUploadResource();
  }

  function handleSubjectChange(subjectId: string) {
    const nextSubject = subjects.find((subject) => subject.id === subjectId);
    setDraftSubjectId(subjectId);
    setDraftLevelId(nextSubject?.tree.find(isLevelNode)?.optionId ?? "");
  }

  function handleLectureTitleChange(value: string) {
    if (isGoogleSlidesUrl(value)) {
      setSlidesUrl(value);
      setLabel("");
      return;
    }
    setLabel(value);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-10">
      <button
        type="button"
        aria-label="Đóng popup tạo mới"
        className="fixed inset-0 bg-[#1C252E]/50"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-create-title"
        className={cn(
          "relative my-auto flex max-h-[min(820px,calc(100dvh-96px))] w-full flex-col overflow-hidden rounded-lg border bg-white shadow-[0_24px_72px_rgba(28,37,46,0.18)]",
          selectedOption === "exercise" ? "max-w-[900px]" : selectedOption === "lecture" ? "max-w-[600px]" : "max-w-[680px]",
        )}
        style={{ borderColor: RESOURCE_BORDER }}
        onSubmit={handleSubmit}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="flex min-w-0 items-start gap-3">
            <ModeIcon taxonomyMode={taxonomyMode} option={selectedOption} />
            <div className="min-w-0">
              <h2 id="resource-create-title" className="text-lg font-bold leading-7 text-[#1C252E]">
                {title}
              </h2>
              {selectedOption !== "lecture" ? <p className="mt-1 text-sm leading-5 text-[#637381]">{subtitle}</p> : null}
            </div>
          </div>
          <ErgIconButton
            label="Đóng"
            size="small"
            disabled={saving}
            onClick={onClose}
            sx={{ color: "text.secondary" }}
          >
            <X className="h-4 w-4" />
          </ErgIconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable]">
          {selectedOption !== "lecture" ? <HierarchyStrip active={taxonomyMode ?? selectedOption ?? "subject"} /> : null}
          <ContextBox
            contextLabel={contextLabel}
            draftLevelId={draftLevelId}
            draftLevelOptions={draftLevelOptions}
            draftSubject={draftSubject}
            mode={taxonomyMode}
            option={selectedOption}
            selectedNode={selectedNode}
          />

          {step === "pick" ? (
            <ContentTypePicker
              options={availableOptions}
              onPick={(option) => {
                setSelectedOption(option);
                setStatus(defaultStatusForOption(option, false));
                setStep("details");
              }}
            />
          ) : (
            <div className="mt-5 space-y-5">
              {isTaxonomyMode ? (
                <TaxonomyFields
                  description={description}
                  draftLevelId={draftLevelId}
                  draftLevelOptions={draftLevelOptions}
                  draftSubjectId={draftSubjectId}
                  label={label}
                  role={taxonomyRole}
                  showLevelPicker={taxonomyMode === "topic"}
                  showSubjectPicker={taxonomyMode === "level" || taxonomyMode === "topic"}
                  subjects={subjects}
                  onDescriptionChange={setDescription}
                  onLabelChange={setLabel}
                  onLevelChange={setDraftLevelId}
                  onSubjectChange={handleSubjectChange}
                />
              ) : null}

              {!isTaxonomyMode && selectedOption ? (
                <SelectedOptionHeader
                  option={selectedOption}
                  canGoBack={availableOptions.length > 1}
                  onBack={() => {
                    setSelectedOption(null);
                    setStep("pick");
                  }}
                />
              ) : null}

              {!isTaxonomyMode && selectedOption === "lecture" ? (
                <LectureFields
                  label={label}
                  slidesUrl={slidesUrl}
                  onLabelChange={handleLectureTitleChange}
                  onSlidesUrlChange={setSlidesUrl}
                />
              ) : null}

              {!isTaxonomyMode && selectedOption === "exercise" ? (
                <ExerciseFields
                  description={description}
                  exerciseQuery={exerciseQuery}
                  exercises={filteredExercises}
                  selectedExerciseIds={selectedExerciseIds}
                  selectedNode={selectedNode}
                  selectedSubject={selectedSubject}
                  onDescriptionChange={setDescription}
                  onExerciseQueryChange={setExerciseQuery}
                  onToggleExercise={(exerciseId) =>
                    setSelectedExerciseIds((current) =>
                      current.includes(exerciseId) ? current.filter((item) => item !== exerciseId) : [...current, exerciseId],
                    )
                  }
                />
              ) : null}

              {!isTaxonomyMode && selectedOption === "resource" ? (
                <ResourceFields
                  description={description}
                  label={label}
                  resourceFileType={resourceFileType}
                  resourceTotalSlides={resourceTotalSlides}
                  resourceUrl={resourceUrl}
                  selectedPathLabel={contextLabel}
                  onDescriptionChange={setDescription}
                  onLabelChange={setLabel}
                  onResourceFileTypeChange={setResourceFileType}
                  onResourceTotalSlidesChange={setResourceTotalSlides}
                  onResourceUrlChange={setResourceUrl}
                />
              ) : null}

              {step === "details" ? <StatusField taxonomy={isTaxonomyMode} value={status} onChange={setStatus} /> : null}
            </div>
          )}

          {error ? (
            <div className="mt-5 rounded-lg border border-[#FFD0D6] bg-[#FFF1F3] px-4 py-3 text-sm font-semibold text-[#B71D18]">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col items-stretch gap-3 border-t bg-[#FBFCFE] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="min-w-0 flex-1 text-xs font-semibold text-[#637381]">
            {submitHint}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
          <ErgButton
            type="button"
            variant="outlined"
            size="medium"
            disabled={saving}
            onClick={onClose}
          >
            Hủy
          </ErgButton>
          {step === "details" ? (
            <ErgButton
              type="submit"
              variant="contained"
              size="medium"
              loading={saving}
              disabled={!canSubmit}
              sx={{ minWidth: 132 }}
            >
              {submitLabel}
            </ErgButton>
          ) : null}
          </div>
        </footer>
      </form>
    </div>
  );
}

function TaxonomyFields({
  description,
  draftLevelId,
  draftLevelOptions,
  draftSubjectId,
  label,
  role,
  showLevelPicker,
  showSubjectPicker,
  subjects,
  onDescriptionChange,
  onLabelChange,
  onLevelChange,
  onSubjectChange,
}: {
  description: string;
  draftLevelId: string;
  draftLevelOptions: StudioNode[];
  draftSubjectId: string;
  label: string;
  role: TaxonomyRole;
  showLevelPicker: boolean;
  showSubjectPicker: boolean;
  subjects: StudioSubject[];
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
}) {
  const titleLabel = role === "subject" ? "Tên môn học" : role === "level" ? "Tên level" : "Tên chủ đề";
  const titlePlaceholder = role === "subject" ? "Ví dụ: IC3 GS6" : role === "level" ? "Ví dụ: Máy tính căn bản" : "Ví dụ: 01. Quản lý thư mục và tệp";

  return (
    <div className="grid gap-4">
      {showSubjectPicker ? (
        <Field label="Môn học">
          <AppSelect variant="native" className={inputClassName} value={draftSubjectId} onChange={(event) => onSubjectChange(event.target.value)}>
            <option value="">Chọn môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.label}
              </option>
            ))}
          </AppSelect>
        </Field>
      ) : null}

      {showLevelPicker ? (
        <Field label="Level cha">
          <AppSelect variant="native" className={inputClassName} value={draftLevelId} onChange={(event) => onLevelChange(event.target.value)} disabled={!draftSubjectId}>
            <option value="">Chọn level</option>
            {draftLevelOptions.map((level) => (
              <option key={level.optionId ?? level.id} value={level.optionId ?? ""}>
                {level.label}
              </option>
            ))}
          </AppSelect>
          {draftSubjectId && !draftLevelOptions.length ? (
            <p className="text-xs leading-5 text-[#B76E00]">Môn học này chưa có level. Hãy tạo level trước khi tạo chủ đề.</p>
          ) : null}
        </Field>
      ) : null}

      <TextField fullWidth size="small" label={titleLabel} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder={titlePlaceholder} autoFocus />

      <Field label="Mô tả ngắn">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ghi chú ngắn để giáo viên nhận biết mục này."
          className={cn(inputClassName, "min-h-20 resize-none py-3")}
        />
      </Field>

    </div>
  );
}

function LectureFields({
  label,
  slidesUrl,
  onLabelChange,
  onSlidesUrlChange,
}: {
  label: string;
  slidesUrl: string;
  onLabelChange: (value: string) => void;
  onSlidesUrlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 pt-1">
      <Field label="Tên bài giảng">
        <input className={inputClassName} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Ví dụ: Bài giảng 01 - Quản lý thư mục" autoFocus />
      </Field>
      <Field label="Link Google Slides">
        <input className={inputClassName} value={slidesUrl} onChange={(event) => onSlidesUrlChange(event.target.value)} placeholder="Dán link edit, publish hoặc embed của Google Slides" />
      </Field>
    </div>
  );
}

function ExerciseFields({
  description,
  exerciseQuery,
  exercises,
  selectedExerciseIds,
  selectedNode,
  selectedSubject,
  onDescriptionChange,
  onExerciseQueryChange,
  onToggleExercise,
}: {
  description: string;
  exerciseQuery: string;
  exercises: ExerciseLibraryItem[];
  selectedExerciseIds: string[];
  selectedNode?: StudioNode;
  selectedSubject?: StudioSubject;
  onDescriptionChange: (value: string) => void;
  onExerciseQueryChange: (value: string) => void;
  onToggleExercise: (exerciseId: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <Field label="Tìm trong Quiz bank">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#919EAB]" />
            <input className={cn(inputClassName, "pl-9")} value={exerciseQuery} onChange={(event) => onExerciseQueryChange(event.target.value)} placeholder="Tên quiz, chủ đề, độ khó" autoFocus />
          </div>
        </Field>
        <ReadOnlyField label="Môn học" value={selectedSubject?.label ?? "Chưa chọn"} />
        <ReadOnlyField label="Chủ đề" value={selectedNode?.label ?? "Chưa chọn"} />
      </div>

      <Field label="Ghi chú khi gắn bài tập">
        <textarea
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Ví dụ: Giao cuối tiết hoặc dùng để luyện tập về nhà."
          className={cn(inputClassName, "min-h-16 resize-none py-3")}
        />
      </Field>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: RESOURCE_BORDER }}>
        <div className="flex items-center justify-between border-b bg-[#FBFCFE] px-4 py-3" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="text-sm font-bold text-[#1C252E]">Bài tập từ Quiz bank</div>
          <div className="text-xs font-bold text-[#F35C6B]">{selectedExerciseIds.length} đã chọn / {exercises.length} hiển thị</div>
        </div>
        <div className="grid max-h-[320px] gap-2 overflow-y-auto p-3 [scrollbar-gutter:stable]">
          {exercises.length ? (
            exercises.map((item) => (
              <ExerciseOptionCard
                key={item.id}
                item={item}
                selected={selectedExerciseIds.includes(item.id)}
                onToggle={() => onToggleExercise(item.id)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed bg-[#FBFCFE] px-4 py-8 text-center text-sm text-[#637381]" style={{ borderColor: RESOURCE_BORDER }}>
              Không có bài tập từ Quiz bank khớp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResourceFields({
  description,
  label,
  resourceFileType,
  resourceTotalSlides,
  resourceUrl,
  selectedPathLabel,
  onDescriptionChange,
  onLabelChange,
  onResourceFileTypeChange,
  onResourceTotalSlidesChange,
  onResourceUrlChange,
}: {
  description: string;
  label: string;
  resourceFileType: string;
  resourceTotalSlides: string;
  resourceUrl: string;
  selectedPathLabel: string;
  onDescriptionChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onResourceFileTypeChange: (value: string) => void;
  onResourceTotalSlidesChange: (value: string) => void;
  onResourceUrlChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <Field label="Tên hiển thị">
          <input className={inputClassName} value={label} onChange={(event) => onLabelChange(event.target.value)} placeholder="Ví dụ: Tài liệu thực hành 01" autoFocus />
        </Field>
        <Field label="Loại tài liệu">
          <AppSelect variant="native" className={inputClassName} value={resourceFileType} onChange={(event) => onResourceFileTypeChange(event.target.value)}>
            <option value="PDF">PDF</option>
            <option value="PPTX">Google Slides / PPTX</option>
            <option value="VIDEO">Video</option>
            <option value="AUDIO">Audio</option>
            <option value="IMAGE">Ảnh</option>
            <option value="ZIP">ZIP</option>
            <option value="HTML5">HTML5</option>
          </AppSelect>
        </Field>
      </div>
      <Field label="Link Google Drive / Google Slides">
        <input className={inputClassName} value={resourceUrl} onChange={(event) => onResourceUrlChange(event.target.value)} placeholder="Dán link share, preview hoặc embed từ Google Drive" />
        <p className="text-xs leading-5 text-[#637381]">Link sẽ được gắn vào: {selectedPathLabel || "vị trí đang chọn"}.</p>
      </Field>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
        <Field label="Mô tả ngắn">
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Ghi chú cho giáo viên." className={cn(inputClassName, "min-h-20 resize-none py-3")} />
        </Field>
        {resourceFileType === "PPTX" ? (
          <Field label="Tổng số slide">
            <input className={inputClassName} value={resourceTotalSlides} onChange={(event) => onResourceTotalSlidesChange(event.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="20" />
          </Field>
        ) : null}
      </div>
    </div>
  );
}

export function QuickIconPicker({
  iconColor,
  iconId,
  role,
  onIconChange,
  onIconColorChange,
}: {
  iconColor: string;
  iconId: string;
  role: TaxonomyRole;
  onIconChange: (value: string) => void;
  onIconColorChange: (value: string) => void;
}) {
  const resolvedIconId = getTaxonomyIconId(iconId, role);
  const resolvedColor = getTaxonomyIconColor(iconColor, role);
  const quickColors = taxonomyIconColorOptions.filter((option) => ["#0F6CBD", "#2563EB", "#F35C6B", "#D73D50", "#475569"].includes(option.value));

  return (
    <Field label="Icon hiển thị">
      <div className="rounded-lg border bg-[#FBFCFE] p-3" style={{ borderColor: RESOURCE_BORDER }}>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border bg-white" style={{ borderColor: RESOURCE_BORDER }}>
            <TaxonomyIcon iconId={resolvedIconId} iconColor={resolvedColor} role={role} size="md" className="border-0 bg-transparent" />
          </span>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {quickIconIdsByRole[role].map((optionId) => (
              <button
                key={optionId}
                type="button"
                className={cn(
                  "grid h-9 place-items-center rounded-lg border bg-white transition",
                  resolvedIconId === getTaxonomyIconId(optionId, role) ? "ring-2 ring-[#0F6CBD]/25" : "hover:bg-[#F4F6F8]",
                )}
                style={{ borderColor: resolvedIconId === getTaxonomyIconId(optionId, role) ? RESOURCE_BLUE_BORDER : RESOURCE_BORDER }}
                onClick={() => onIconChange(optionId)}
                aria-label={`Chọn icon ${optionId}`}
              >
                <TaxonomyIcon iconId={optionId} iconColor={resolvedColor} role={role} size="md" className="border-0 bg-transparent" />
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickColors.map((option) => (
            <button
              key={option.value}
              type="button"
              className="h-7 w-7 rounded-full border border-white shadow-sm ring-offset-2 transition"
              style={{
                backgroundColor: option.value,
                boxShadow: resolvedColor === option.value ? `0 0 0 2px white, 0 0 0 4px ${RESOURCE_BLUE}` : undefined,
              }}
              title={option.label}
              aria-label={`Chọn màu icon ${option.label}`}
              onClick={() => onIconColorChange(option.value)}
            />
          ))}
        </div>
      </div>
    </Field>
  );
}

function ContentTypePicker({ options, onPick }: { options: ContentDialogOptionId[]; onPick: (option: ContentDialogOptionId) => void }) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {options.map((option) => {
        const meta = getOptionMeta(option);
        return (
          <button
            key={option}
            type="button"
            className="rounded-lg border bg-white p-4 text-left transition hover:border-[#B8D6FA] hover:bg-[#F8FBFF]"
            style={{ borderColor: RESOURCE_BORDER }}
            onClick={() => onPick(option)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: meta.tone === "red" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT, color: meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}>
              {meta.icon}
            </span>
            <span className="mt-3 block text-sm font-bold text-[#1C252E]">{meta.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#637381]">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedOptionHeader({ canGoBack, option, onBack }: { canGoBack: boolean; option: ContentDialogOptionId; onBack: () => void }) {
  const meta = getOptionMeta(option);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-[#FBFCFE] px-4 py-3" style={{ borderColor: RESOURCE_BORDER }}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white"
          style={{ color: option === "lecture" ? "#E8710A" : meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#1C252E]">{meta.title}</div>
          {option !== "lecture" ? <div className="truncate text-xs text-[#637381]">{meta.description}</div> : null}
        </div>
      </div>
      {canGoBack ? (
        <ErgButton type="button" variant="outlined" size="small" startIcon={<ChevronLeft className="h-4 w-4" />} onClick={onBack}>
          Chọn lại
        </ErgButton>
      ) : null}
    </div>
  );
}

function ContextBox({
  contextLabel,
  draftLevelId,
  draftLevelOptions,
  draftSubject,
  mode,
  option,
  selectedNode,
}: {
  contextLabel: string;
  draftLevelId: string;
  draftLevelOptions: StudioNode[];
  draftSubject?: StudioSubject;
  mode: ResolvedTaxonomyMode;
  option: ContentDialogOptionId | null;
  selectedNode?: StudioNode;
}) {
  const level = draftLevelOptions.find((item) => item.optionId === draftLevelId);
  const targetText =
    mode === "subject"
      ? "Tạo môn học ở cấp gốc"
      : mode === "level"
        ? `Level sẽ nằm dưới ${draftSubject?.label ?? "môn học đã chọn"}`
        : mode === "topic"
          ? `Chủ đề sẽ nằm dưới ${draftSubject?.label ?? "môn học"} / ${level?.label ?? "level đã chọn"}`
          : `Nội dung sẽ nằm trong ${contextLabel || selectedNode?.label || "chủ đề đang chọn"}`;

  return (
    <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: option === "exercise" ? RESOURCE_RED_BORDER : RESOURCE_BLUE_BORDER, background: option === "exercise" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT }}>
      <div className="text-[11px] font-bold uppercase text-[#637381]">Vị trí tạo</div>
      <div className="mt-1 text-sm font-bold text-[#1C252E]">{targetText}</div>
    </div>
  );
}

function HierarchyStrip({ active }: { active: ContentDialogOptionId | TaxonomyRole }) {
  const items: Array<{ id: ContentDialogOptionId | TaxonomyRole; label: string }> = [
    { id: "subject", label: "Môn học" },
    { id: "level", label: "Level" },
    { id: "topic", label: "Chủ đề" },
    { id: "lecture", label: "Nội dung" },
  ];
  const normalizedActive = active === "resource" || active === "exercise" ? "lecture" : active;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const selected = normalizedActive === item.id;
        return (
          <span key={item.id} className="inline-flex items-center gap-2">
            <span
              className={cn("inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-bold", selected ? "bg-[#0F6CBD] text-white" : "bg-white text-[#637381]")}
              style={{ borderColor: selected ? RESOURCE_BLUE : RESOURCE_BORDER }}
            >
              {item.label}
            </span>
            {index < items.length - 1 ? <span className="text-[#C4CDD5]">/</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function ExerciseOptionCard({ item, selected, onToggle }: { item: ExerciseLibraryItem; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={cn("rounded-lg border p-3 text-left transition", selected ? "bg-[#FFF1F3]" : "bg-white hover:bg-[#FBFCFE]")}
      style={{ borderColor: selected ? RESOURCE_RED_BORDER : RESOURCE_BORDER }}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#1C252E]">{item.title}</div>
          <div className="mt-1 truncate text-xs text-[#637381]">{[item.topicLabel, item.sectionLabel].filter(Boolean).join(" / ") || item.subjectLabel}</div>
        </div>
        <input type="checkbox" readOnly checked={selected} className="mt-1 h-4 w-4 shrink-0 accent-[#F35C6B]" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#637381]">
        <span className="rounded-md bg-[#F4F6F8] px-2 py-1">{item.quizKind === "test" ? "Test" : "Train"}</span>
        <span>{item.questionCount} câu</span>
        <span>{item.durationMinutes} phút</span>
        {item.scopeLabel ? <span>{item.scopeLabel}</span> : null}
      </div>
    </button>
  );
}

function StatusField({ taxonomy, value, onChange }: { taxonomy?: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Trạng thái">
      <AppSelect variant="native" className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={taxonomy ? "active" : "published"}>Đã xuất bản</option>
        <option value="draft">Bản nháp</option>
        <option value="hidden">Đã ẩn</option>
      </AppSelect>
    </Field>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <div className={cn(inputClassName, "flex items-center truncate bg-[#F8FAFC] text-[#637381]")}>{value}</div>
    </Field>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#637381]">{label}</span>
      {children}
    </label>
  );
}

function ModeIcon({ option, taxonomyMode }: { option: ContentDialogOptionId | null; taxonomyMode: ResolvedTaxonomyMode }) {
  const meta = taxonomyMode ? getTaxonomyMeta(taxonomyMode) : option ? getOptionMeta(option) : getTaxonomyMeta("subject");
  const isLecture = option === "lecture";
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border" style={{ background: isLecture ? "#FFF4E5" : meta.tone === "red" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT, borderColor: isLecture ? "#FFD29B" : meta.tone === "red" ? RESOURCE_RED_BORDER : RESOURCE_BLUE_BORDER, color: isLecture ? "#E8710A" : meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}>
      {meta.icon}
    </span>
  );
}

function getAvailableDialogOptions(state: TaxonomyDialogState, selectedNode?: StudioNode): ContentDialogOptionId[] {
  if (!state) return [];
  if (state.mode === "subject" || state.mode === "level" || state.mode === "topic" || state.mode === "root") return [];
  if (state.initialOption) return [state.initialOption];
  if (selectedNode?.kind === "group") return ["section"];
  if (selectedNode?.kind === "lesson" || selectedNode?.kind === "section" || selectedNode?.kind === "topic") return ["lecture", "exercise", "resource"];
  return ["category"];
}

function resolveTaxonomyMode(state: TaxonomyDialogState, option: ContentDialogOptionId | null): ResolvedTaxonomyMode {
  if (!state) return null;
  if (state.mode === "subject") return "subject";
  if (state.mode === "level" || state.mode === "root") return "level";
  if (state.mode === "topic") return "topic";
  if (option === "category") return "level";
  if (option === "section") return "topic";
  return null;
}

function getCanSubmit({
  draftLevelId,
  draftSubjectId,
  label,
  resourceUrl,
  saving,
  selectedExerciseIds,
  selectedOption,
  slidesUrl,
  taxonomyMode,
}: {
  draftLevelId: string;
  draftSubjectId: string;
  label: string;
  resourceUrl: string;
  saving: boolean;
  selectedExerciseIds: string[];
  selectedOption: ContentDialogOptionId | null;
  slidesUrl: string;
  taxonomyMode: ResolvedTaxonomyMode;
}) {
  if (saving) return false;
  if (taxonomyMode) {
    if (!label.trim()) return false;
    if ((taxonomyMode === "level" || taxonomyMode === "topic") && !draftSubjectId) return false;
    if (taxonomyMode === "topic" && !draftLevelId) return false;
    return true;
  }
  if (selectedOption === "lecture") return Boolean(label.trim() && slidesUrl.trim());
  if (selectedOption === "resource") return Boolean(resourceUrl.trim());
  if (selectedOption === "exercise") return selectedExerciseIds.length > 0;
  return false;
}

function getSubmitHint({
  canSubmit,
  draftLevelId,
  draftSubjectId,
  label,
  resourceUrl,
  selectedExerciseIds,
  selectedOption,
  slidesUrl,
  taxonomyMode,
}: {
  canSubmit: boolean;
  draftLevelId: string;
  draftSubjectId: string;
  label: string;
  resourceUrl: string;
  selectedExerciseIds: string[];
  selectedOption: ContentDialogOptionId | null;
  slidesUrl: string;
  taxonomyMode: ResolvedTaxonomyMode;
}) {
  if (canSubmit) return "";
  if (taxonomyMode === "subject" && !label.trim()) return "Nhập tên môn học để bật nút tạo.";
  if (taxonomyMode === "level" && !draftSubjectId) return "Chọn môn học trước khi tạo level.";
  if (taxonomyMode === "level" && !label.trim()) return "Nhập tên level để bật nút tạo.";
  if (taxonomyMode === "topic" && !draftSubjectId) return "Chọn môn học trước khi tạo chủ đề.";
  if (taxonomyMode === "topic" && !draftLevelId) return "Chọn level cha trước khi tạo chủ đề.";
  if (taxonomyMode === "topic" && !label.trim()) return "Nhập tên chủ đề để bật nút tạo.";
  if (selectedOption === "lecture" && !label.trim()) return "Nhập tên bài giảng.";
  if (selectedOption === "lecture" && !slidesUrl.trim()) return "Dán link Google Slides để thêm bài giảng.";
  if (selectedOption === "resource" && !resourceUrl.trim()) return "Dán link tài liệu để gắn vào chủ đề.";
  if (selectedOption === "exercise" && !selectedExerciseIds.length) return "Chọn ít nhất một bài tập từ Quiz bank.";
  return "Hoàn tất thông tin bắt buộc để tạo mục.";
}

function getDialogTitle(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null) {
  if (mode === "subject") return "Tạo môn học";
  if (mode === "level") return "Tạo level";
  if (mode === "topic") return "Tạo chủ đề";
  if (option === "lecture") return "Thêm bài giảng";
  if (option === "exercise") return "Gắn bài tập từ Quiz bank";
  if (option === "resource") return "Gắn tài liệu";
  return "Chọn loại nội dung";
}

function getDialogSubtitle(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null) {
  if (mode === "subject") return "Môn học là cấp cha cao nhất trong kho học liệu.";
  if (mode === "level") return "Level luôn nằm dưới một môn học, ví dụ IC3 GS6 / Máy tính căn bản.";
  if (mode === "topic") return "Chủ đề luôn nằm dưới một level và là nơi gắn bài giảng, tài liệu, bài tập.";
  if (option === "lecture") return "Bài giảng dùng Google Slides hoặc PPTX để giáo viên mở trực tiếp.";
  if (option === "exercise") return "Bài tập lấy từ Quiz bank, không nhập tay lại trong popup này.";
  if (option === "resource") return "Tài liệu là PDF, Drive, Video, Audio hoặc file tham khảo.";
  return "Chọn đúng loại nội dung cần thêm vào chủ đề hiện tại.";
}

function getSubmitLabel(mode: ResolvedTaxonomyMode, option: ContentDialogOptionId | null, saving: boolean) {
  if (saving) return "Đang lưu...";
  if (mode === "subject") return "Tạo môn học";
  if (mode === "level") return "Tạo level";
  if (mode === "topic") return "Tạo chủ đề";
  if (option === "lecture") return "Thêm bài giảng";
  if (option === "exercise") return "Gắn bài tập";
  if (option === "resource") return "Gắn tài liệu";
  return "Tạo mới";
}

function getTaxonomyMeta(mode: TaxonomyRole) {
  if (mode === "subject") return { title: "Môn học", icon: <BookOpen className="h-5 w-5" />, tone: "blue" as const };
  if (mode === "level") return { title: "Level", icon: <Layers3 className="h-5 w-5" />, tone: "blue" as const };
  return { title: "Chủ đề", icon: <Folder className="h-5 w-5" />, tone: "red" as const };
}

function getOptionMeta(option: ContentDialogOptionId) {
  if (option === "category") return { title: "Level", description: "Tạo level dưới môn học.", icon: <Layers3 className="h-5 w-5" />, tone: "blue" as const };
  if (option === "section") return { title: "Chủ đề", description: "Tạo chủ đề dưới level.", icon: <Folder className="h-5 w-5" />, tone: "red" as const };
  if (option === "lecture") return { title: "Bài giảng", description: "Google Slides hoặc PPTX.", icon: <Presentation className="h-5 w-5" />, tone: "blue" as const };
  if (option === "resource") return { title: "Tài liệu", description: "PDF, Drive, Video, Audio.", icon: <FileText className="h-5 w-5" />, tone: "blue" as const };
  return { title: "Bài tập từ Quiz bank", description: "Train/Test quiz có sẵn.", icon: <FileQuestion className="h-5 w-5" />, tone: "red" as const };
}

function isLevelNode(node: StudioNode) {
  return node.kind === "group" && node.sourceKind === "category" && Boolean(node.optionId);
}

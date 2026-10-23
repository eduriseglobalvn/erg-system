import { useEffect, useMemo, useState, type FormEvent } from "react";

import { mockExerciseLibrary } from "@/features/lcms/admin-operations/api/mock-exercise-library";
import { USE_LEARNING_RESOURCE_AUTHORING_MOCK } from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import {
  filterExerciseLibraryItems,
  isGoogleSlidesUrl,
  resolveExerciseLibraryItems,
  type ContentDialogOptionId,
} from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import {
  buildResourceLocation,
  defaultStatusForOption,
  pathLabel,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { getTaxonomyIconColor, getTaxonomyIconId, type TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
type DialogStep = "pick" | "details";
import { getAvailableDialogOptions, getCanSubmit, getDialogSubtitle, getDialogTitle, getSubmitHint, getSubmitLabel, isLevelNode, resolveTaxonomyMode } from "./learning-resource-authoring-create-dialog-model";
import { executeCreateDialogSubmission } from "./learning-resource-authoring-create-dialog-submit";
import type { TaxonomyCreateDialogProps } from "./learning-resource-authoring-create-dialog-types";

export function useTaxonomyCreateDialogController({
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
}: TaxonomyCreateDialogProps) {
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
  const draftLevelOptions = useMemo(
    () => draftSubject?.tree.filter(isLevelNode) ?? [],
    [draftSubject?.tree],
  );
  const selectedLevelFromPath = selectedPath.find(isLevelNode);
  const selectedLevelLabel = selectedLevelFromPath?.label;
  const resourceLocation = useMemo(() => buildResourceLocation(selectedPath), [selectedPath]);
  const title = getDialogTitle(taxonomyMode, selectedOption);
  const subtitle = getDialogSubtitle(taxonomyMode, selectedOption);
  const contextLabel = pathLabel(selectedSubject?.label ?? draftSubject?.label ?? "", selectedPath);
  const exerciseLibraryItems = useMemo(() => {
    return resolveExerciseLibraryItems(quizBankItems, mockExerciseLibrary, !USE_LEARNING_RESOURCE_AUTHORING_MOCK);
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
      await executeCreateDialogSubmission({
        description,
        draftLevelId,
        draftSubjectId,
        filteredExercises,
        iconColor,
        iconId,
        label,
        onClose,
        onCreateLecture,
        onCreateLocalContent,
        onCreated,
        onUploadResource,
        resourceFileType,
        resourceLocation,
        resourceTotalSlides,
        resourceUrl,
        selectedExerciseIds,
        selectedNode,
        selectedOption,
        selectedSubject,
        slidesUrl,
        state,
        status,
        taxonomyMode,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tạo mục. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
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

  return {
    availableOptions, canSubmit, contextLabel, description,
    draftLevelId, draftLevelOptions, draftSubject, draftSubjectId,
    error, exerciseQuery, filteredExercises,
    handleLectureTitleChange, handleSubjectChange, handleSubmit,
    isTaxonomyMode, label, onClose, open,
    resourceFileType, resourceTotalSlides, resourceUrl, saving,
    selectedExerciseIds, selectedNode, selectedOption, selectedSubject,
    setDescription, setDraftLevelId, setExerciseQuery, setLabel,
    setResourceFileType, setResourceTotalSlides, setResourceUrl,
    setSelectedExerciseIds, setSelectedOption, setSlidesUrl, setStatus, setStep,
    slidesUrl, status, step, subjects,
    submitHint, submitLabel, subtitle,
    taxonomyMode, taxonomyRole, title,
  };
}

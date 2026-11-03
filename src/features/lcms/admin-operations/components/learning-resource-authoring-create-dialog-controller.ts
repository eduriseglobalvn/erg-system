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
import type { StudioNode } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { getAvailableDialogOptions, getCanSubmit, getDialogSubtitle, getDialogTitle, getSubmitHint, getSubmitLabel, isLevelNode, resolveTaxonomyMode } from "./learning-resource-authoring-create-dialog-model";
import { executeCreateDialogSubmission } from "./learning-resource-authoring-create-dialog-submit";
import type { AuthoringItemType } from "./learning-resource-authoring-create-dialog-presentation";
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
  const [itemType, setItemType] = useState<AuthoringItemType>("level");
  const [selectedOption, setSelectedOption] = useState<ContentDialogOptionId | null>("lecture");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [draftSubjectId, setDraftSubjectId] = useState("");
  const [draftLevelId, setDraftLevelId] = useState("");
  const [draftTopicId, setDraftTopicId] = useState("");
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

  // If creating subject, mode is strictly subject
  const isSubjectMode = state?.mode === "subject";
  const effectiveTaxonomyMode: TaxonomyRole | null = isSubjectMode
    ? "subject"
    : itemType === "level"
      ? "level"
      : itemType === "topic"
        ? "topic"
        : null;

  const taxonomyRole: TaxonomyRole = effectiveTaxonomyMode ?? "topic";
  const isTaxonomyMode = Boolean(effectiveTaxonomyMode);
  const effectiveOption: ContentDialogOptionId | null = isTaxonomyMode ? null : (selectedOption || "lecture");

  const draftSubject = subjects.find((subject) => subject.id === draftSubjectId) ?? selectedSubject ?? subjects[0];
  const draftLevelOptions = useMemo(
    () => draftSubject?.tree.filter(isLevelNode) ?? [],
    [draftSubject?.tree],
  );

  const draftTopicOptions = useMemo(() => {
    if (!draftSubject) return [];
    if (draftLevelId) {
      const levelNode = draftSubject.tree.find((n) => n.optionId === draftLevelId || n.id === draftLevelId);
      if (levelNode) {
        return levelNode.children.filter((n) => n.kind === "lesson" || n.sourceKind === "section" || n.sourceKind === "topic");
      }
    }
    const topics: StudioNode[] = [];
    const visit = (node: StudioNode) => {
      if (node.kind === "lesson" || node.sourceKind === "section" || node.sourceKind === "topic") {
        topics.push(node);
      }
      node.children?.forEach(visit);
    };
    draftSubject.tree.forEach(visit);
    return topics;
  }, [draftLevelId, draftSubject]);

  const selectedLevelFromPath = selectedPath.find(isLevelNode);
  const selectedLevelLabel = selectedLevelFromPath?.label;
  const resourceLocation = useMemo(() => buildResourceLocation(selectedPath), [selectedPath]);
  const title = getDialogTitle(effectiveTaxonomyMode, effectiveOption);
  const subtitle = getDialogSubtitle(effectiveTaxonomyMode, effectiveOption);
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
  const submitLabel = getSubmitLabel(effectiveTaxonomyMode, effectiveOption, saving);
  const canSubmit = getCanSubmit({
    draftLevelId,
    draftSubjectId,
    label,
    resourceUrl,
    selectedExerciseIds,
    selectedOption: effectiveOption,
    slidesUrl,
    taxonomyMode: effectiveTaxonomyMode,
    saving,
  });
  const submitHint = getSubmitHint({
    canSubmit,
    draftLevelId,
    draftSubjectId,
    label,
    resourceUrl,
    selectedExerciseIds,
    selectedOption: effectiveOption,
    slidesUrl,
    taxonomyMode: effectiveTaxonomyMode,
  });

  useEffect(() => {
    if (!open) return;
    const autoOption = state?.initialOption ?? (availableOptions.length === 1 ? availableOptions[0] : null);
    const resolvedMode = resolveTaxonomyMode(state, autoOption);
    const nextSubjectId = selectedSubject?.id || subjects[0]?.id || "";
    const contextLevelId =
      selectedNode?.sourceKind === "category" && selectedNode.optionId
        ? selectedNode.optionId
        : selectedNode?.location.categoryId || selectedLevelFromPath?.optionId || "";
    const contextTopicId =
      selectedNode?.kind === "lesson" || selectedNode?.sourceKind === "section"
        ? (selectedNode.optionId || selectedNode.id)
        : "";

    let initialItemType: AuthoringItemType = "level";
    if (state?.mode === "level" || state?.mode === "root" || resolvedMode === "level") {
      initialItemType = "level";
    } else if (state?.mode === "topic" || resolvedMode === "topic") {
      initialItemType = "topic";
    } else if (state?.mode === "child" || autoOption) {
      initialItemType = "lesson";
    } else if (selectedNode?.kind === "lesson" || selectedNode?.sourceKind === "section") {
      initialItemType = "lesson";
    } else if (selectedNode?.kind === "group") {
      initialItemType = "topic";
    } else {
      initialItemType = "level";
    }

    setStep("details");
    setItemType(initialItemType);
    setSelectedOption(autoOption || "lecture");
    setLabel("");
    setDescription("");
    setDraftSubjectId(nextSubjectId);
    setDraftLevelId(initialItemType === "level" ? "" : contextLevelId);
    setDraftTopicId(initialItemType === "level" || initialItemType === "topic" ? "" : contextTopicId);
    setIconId(getTaxonomyIconId(undefined, resolvedMode ?? "topic"));
    setIconColor(getTaxonomyIconColor(undefined, resolvedMode ?? "topic"));
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
        draftTopicId,
        draftTopicOptions,
        filteredExercises,
        iconColor,
        iconId,
        itemType,
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
        selectedOption: effectiveOption,
        selectedSubject,
        subjects,
        slidesUrl,
        state,
        status,
        taxonomyMode: effectiveTaxonomyMode,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tạo mục. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function handleItemTypeChange(nextType: AuthoringItemType) {
    setItemType(nextType);
    if (nextType === "level") {
      setDraftLevelId("");
      setDraftTopicId("");
    }
  }

  function handleSubjectChange(subjectId: string) {
    const nextSubject = subjects.find((subject) => subject.id === subjectId);
    setDraftSubjectId(subjectId);
    const firstLevel = nextSubject?.tree.find(isLevelNode)?.optionId ?? "";
    setDraftLevelId(firstLevel);
    setDraftTopicId("");
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
    draftTopicId, draftTopicOptions,
    effectiveOption, effectiveTaxonomyMode,
    error, exerciseQuery, filteredExercises,
    handleItemTypeChange, handleLectureTitleChange, handleSubjectChange, handleSubmit,
    isSubjectMode, isTaxonomyMode, itemType, label, onClose, open,
    resourceFileType, resourceTotalSlides, resourceUrl, saving,
    selectedExerciseIds, selectedNode, selectedOption, selectedSubject,
    setDescription, setDraftLevelId, setDraftTopicId, setExerciseQuery, setItemType: handleItemTypeChange, setLabel,
    setResourceFileType, setResourceTotalSlides, setResourceUrl,
    setSelectedExerciseIds, setSelectedOption, setSlidesUrl, setStatus, setStep,
    slidesUrl, status, step, subjects,
    submitHint, submitLabel, subtitle,
    taxonomyMode: effectiveTaxonomyMode, taxonomyRole, title,
  };
}

import X from "@mui/icons-material/Close";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { defaultStatusForOption } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { cn } from "@/lib/utils";
import { RESOURCE_BORDER } from "./learning-resource-authoring-create-dialog-config";
import { ExerciseFields, LectureFields, ResourceFields, TaxonomyFields } from "./learning-resource-authoring-create-dialog-fields";
import {
  ContentTypePicker,
  getContextBreadcrumbText,
  ModeIcon,
  StatusField,
} from "./learning-resource-authoring-create-dialog-presentation";
import type { useTaxonomyCreateDialogController } from "./learning-resource-authoring-create-dialog-controller";

export function TaxonomyCreateDialogView({ controller }: { controller: ReturnType<typeof useTaxonomyCreateDialogController> }) {
  const {
    availableOptions,
    canSubmit,
    contextLabel,
    description,
    draftLevelId,
    draftLevelOptions,
    draftSubject,
    draftSubjectId,
    draftTopicId,
    draftTopicOptions,
    effectiveOption,
    error,
    exerciseQuery,
    filteredExercises,
    handleLectureTitleChange,
    handleSubjectChange,
    handleSubmit,
    isTaxonomyMode,
    itemType,
    label,
    onClose,
    open,
    resourceFileType,
    resourceTotalSlides,
    resourceUrl,
    saving,
    selectedExerciseIds,
    selectedNode,
    selectedSubject,
    setDescription,
    setDraftLevelId,
    setExerciseQuery,
    setLabel,
    setResourceFileType,
    setResourceTotalSlides,
    setResourceUrl,
    setSelectedExerciseIds,
    setSelectedOption,
    setSlidesUrl,
    setStatus,
    setStep,
    slidesUrl,
    status,
    step,
    subjects,
    submitHint,
    submitLabel,
    taxonomyMode,
    taxonomyRole,
    title,
  } = controller;

  if (!open) return null;

  const breadcrumbText = getContextBreadcrumbText({
    contextLabel,
    draftLevelId,
    draftLevelOptions,
    draftSubject,
    draftTopicId,
    draftTopicOptions,
    itemType,
    mode: taxonomyMode,
    selectedNode,
  });

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
          "relative my-auto flex max-h-[min(840px,calc(100dvh-80px))] w-full flex-col overflow-hidden rounded-lg border bg-white shadow-[0_24px_72px_rgba(28,37,46,0.18)]",
          effectiveOption === "exercise" ? "max-w-[900px]" : "max-w-[680px]",
        )}
        style={{ borderColor: RESOURCE_BORDER }}
        onSubmit={handleSubmit}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-3" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="flex min-w-0 items-center gap-3">
            <ModeIcon taxonomyMode={taxonomyMode} option={effectiveOption} />
            <div className="min-w-0">
              <h2 id="resource-create-title" className="truncate text-base font-bold text-[#1C252E]">
                {title}
              </h2>
              {breadcrumbText ? (
                <div className="mt-0.5 truncate text-xs font-semibold text-[#637381]">
                  Vị trí: <span className="text-[#0071E3]">{breadcrumbText}</span>
                </div>
              ) : null}
            </div>
          </div>
          <ErgIconButton label="Đóng" size="small" disabled={saving} onClick={onClose} sx={{ color: "text.secondary" }}>
            <X className="h-4 w-4" />
          </ErgIconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5 space-y-3 [scrollbar-gutter:stable]">
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
            <div className="space-y-3">
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

              {!isTaxonomyMode && effectiveOption === "lecture" ? (
                <LectureFields
                  label={label}
                  slidesUrl={slidesUrl}
                  onLabelChange={handleLectureTitleChange}
                  onSlidesUrlChange={setSlidesUrl}
                />
              ) : null}

              {!isTaxonomyMode && effectiveOption === "exercise" ? (
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

              {!isTaxonomyMode && effectiveOption === "resource" ? (
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

              <StatusField taxonomy={isTaxonomyMode} value={status} onChange={setStatus} />
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-lg border border-[#FFD0D6] bg-[#FFF1F3] px-4 py-3 text-sm font-semibold text-[#B71D18]">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-col items-stretch gap-3 border-t bg-[#FBFCFE] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6" style={{ borderColor: RESOURCE_BORDER }}>
          <div className="min-w-0 flex-1 text-xs font-semibold text-[#637381]">
            {submitHint}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            <ErgButton type="button" variant="outlined" size="medium" disabled={saving} onClick={onClose}>
              Hủy
            </ErgButton>
            <ErgButton type="submit" variant="contained" size="medium" loading={saving} disabled={!canSubmit} sx={{ minWidth: 132 }}>
              {submitLabel}
            </ErgButton>
          </div>
        </footer>
      </form>
    </div>
  );
}

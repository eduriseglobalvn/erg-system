import X from "@mui/icons-material/Close";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { defaultStatusForOption } from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import { cn } from "@/lib/utils";
import { RESOURCE_BORDER } from "./learning-resource-authoring-create-dialog-config";
import { ExerciseFields, LectureFields, ResourceFields, TaxonomyFields } from "./learning-resource-authoring-create-dialog-fields";
import { ContentTypePicker, ContextBox, HierarchyStrip, ModeIcon, SelectedOptionHeader, StatusField } from "./learning-resource-authoring-create-dialog-presentation";
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
    error,
    exerciseQuery,
    filteredExercises,
    handleLectureTitleChange,
    handleSubjectChange,
    handleSubmit,
    isTaxonomyMode,
    label,
    onClose,
    open,
    resourceFileType,
    resourceTotalSlides,
    resourceUrl,
    saving,
    selectedExerciseIds,
    selectedNode,
    selectedOption,
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
    subtitle,
    taxonomyMode,
    taxonomyRole,
    title,
  } = controller;

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


import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";
import { AssignHomeworkFooter } from "@/features/lms/components/assign-homework-footer";
import { MobileAssignProgress } from "@/features/lms/components/assign-homework-parts";
import { AssignHomeworkSetupCard } from "@/features/lms/components/assign-homework-desktop-view/setup-card";
import { ClassTargetCard } from "@/features/lms/components/assign-homework-desktop-view/class-target-card";
import { GradeTargetCard } from "@/features/lms/components/assign-homework-desktop-view/grade-target-card";
import { GroupTargetCard } from "@/features/lms/components/assign-homework-desktop-view/group-target-card";
import { ResourceSelectionStep } from "@/features/lms/components/assign-homework-desktop-view/resource-step";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

interface AssignHomeworkDesktopViewProps {
  model: AssignHomeworkController;
}

export function AssignHomeworkDesktopView({ model }: AssignHomeworkDesktopViewProps) {
  const {
    onBack,
    step,
    setStep,
    targetType,
    selectedStudentIds,
    validationError,
    setValidationError,
    isSubmitting,
    isMobile,
    handleNext,
    handleFinish,
  } = model;
  return (
    <div className="w-full h-full flex flex-col bg-[#f3f6fb] overflow-hidden text-slate-900 md:bg-[#f8fafc]">

      {/* Main workspace body - flex flex-col to enable layout flexing */}
      <div className="flex-1 flex flex-col min-h-0">
        {isMobile ? (
          <MobileAssignProgress step={step} targetType={targetType} selectedCount={selectedStudentIds.size} />
        ) : null}
        {step === 1 ? (
          <div className="w-full h-full px-4 py-4 space-y-4 flex flex-col min-h-0 md:px-8 md:py-6">
            {validationError ? (
              <div className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700 flex items-center justify-between shadow-xs">
                <span>{validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError("")}
                  className="ml-3 font-bold text-rose-500 hover:text-rose-700 cursor-pointer text-sm"
                  aria-label="Đóng thông báo"
                >
                  ✕
                </button>
              </div>
            ) : null}

            {isMobile ? null : (
              <ErgPageHeader description="Chọn đối tượng, thiết lập thời hạn rồi chọn bài tập để giao." title="Giao bài" />
            )}

            {/* Card: Assignment setup */}
            <AssignHomeworkSetupCard model={model} />

            {/* Card: Student list, group picker, or grade selector */}
            {targetType === "class" ? (
              <ClassTargetCard model={model} />
            ) : targetType === "group" ? (
              <GroupTargetCard model={model} />
            ) : (
              <GradeTargetCard model={model} />
            )}
          </div>
        ) : (
          <div className="w-full h-full px-4 py-4 flex flex-col min-h-0 md:px-8 md:py-6">
            {validationError ? (
              <div className="shrink-0 mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-700 flex items-center justify-between shadow-xs">
                <span>{validationError}</span>
                <button
                  type="button"
                  onClick={() => setValidationError("")}
                  className="ml-3 font-bold text-rose-500 hover:text-rose-700 cursor-pointer text-sm"
                  aria-label="Đóng thông báo"
                >
                  ✕
                </button>
              </div>
            ) : null}
            <ResourceSelectionStep model={model} />
          </div>
        )}
      </div>

      <AssignHomeworkFooter
        step={step}
        onBack={onBack}
        onPreviousStep={() => setStep(1)}
        onNext={step === 1 ? handleNext : handleFinish}
        onStepSelect={(targetStep) => {
          if (targetStep === 1) setStep(1);
          if (targetStep === 2) handleNext();
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

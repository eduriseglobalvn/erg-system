import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ErgIconButton } from "@/components/erg-mui/erg-actions";
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
  const errorBanner = validationError ? (
    <Box
      sx={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: 1, border: 1, borderColor: "error.main", bgcolor: "error.light", px: 2, py: 1.5, color: "error.main", boxShadow: 1 }}
    >
      <Typography component="span" variant="body2" sx={{ fontWeight: "fontWeightMedium" }}>{validationError}</Typography>
      <ErgIconButton label="Đóng thông báo" size="small" onClick={() => setValidationError("")} sx={{ ml: 1.5, color: "error.main" }}>
        <CloseIcon fontSize="small" />
      </ErgIconButton>
    </Box>
  ) : null;
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "background.default", overflow: "hidden", color: "text.primary" }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {isMobile ? (
          <MobileAssignProgress step={step} targetType={targetType} selectedCount={selectedStudentIds.size} />
        ) : null}
        {step === 1 ? (
          <Box sx={{ width: "100%", height: "100%", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
            {errorBanner}

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
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: "100%", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}>
            {errorBanner}
            <ResourceSelectionStep model={model} />
          </Box>
        )}
      </Box>

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
    </Box>
  );
}

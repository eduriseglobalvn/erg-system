import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function AssignHomeworkFooter({
  step,
  onBack,
  onPreviousStep,
  onNext,
  onStepSelect,
  isSubmitting = false,
}: {
  step: number;
  onBack: () => void;
  onPreviousStep: () => void;
  onNext: () => void;
  onStepSelect?: (step: number) => void;
  isSubmitting?: boolean;
}) {
  return (
    <Box
      component="footer"
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 4,
        py: 2,
        boxShadow: "0 -2px 10px rgba(15,23,42,0.04)",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, flexShrink: 0 }}>
        <Stack
          direction="row"
          spacing={1.25}
          onClick={() => {
            if (step === 2 && onStepSelect) onStepSelect(1);
          }}
          sx={{
            alignItems: "center",
            cursor: step === 2 ? "pointer" : "default",
            opacity: 1,
            "&:hover": step === 2 ? { opacity: 0.8 } : undefined,
          }}
        >
          <StepNumber active={step === 1} completed={step > 1}>1</StepNumber>
          <Typography sx={{ color: step === 1 ? "primary.main" : "success.main", fontSize: 15, fontWeight: 600 }}>
            Thiết lập bài tập
          </Typography>
        </Stack>
        <Box sx={{ width: 32, height: 1, bgcolor: "divider" }} />
        <Stack
          direction="row"
          spacing={1.25}
          onClick={() => {
            if (step === 1) onNext();
          }}
          sx={{
            alignItems: "center",
            cursor: step === 1 ? "pointer" : "default",
            opacity: 1,
            "&:hover": step === 1 ? { opacity: 0.8 } : undefined,
          }}
        >
          <StepNumber active={step === 2}>2</StepNumber>
          <Typography sx={{ color: step === 2 ? "primary.main" : "text.secondary", fontSize: 15, fontWeight: 600 }}>
            Chọn tài nguyên
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ position: "relative", zIndex: 60, ml: "auto", minWidth: 240, flexShrink: 0, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          disabled={isSubmitting}
          onClick={step === 1 ? onBack : onPreviousStep}
          sx={{ height: 40, minWidth: 88, fontWeight: 600, textTransform: "none" }}
        >
          {step === 1 ? "Hủy" : "Quay lại"}
        </Button>
        <Button
          variant="contained"
          disabled={isSubmitting}
          onClick={onNext}
          sx={{ height: 40, minWidth: 116, px: 3, fontWeight: 600, textTransform: "none" }}
        >
          {step === 1 ? "Tiếp theo" : isSubmitting ? "Đang giao..." : "Giao bài"}
        </Button>
      </Stack>
    </Box>
  );
}

function StepNumber({ active, children, completed = false }: { active: boolean; children: string; completed?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        border: 1,
        borderColor: active ? "primary.main" : completed ? "success.main" : "divider",
        borderRadius: 1,
        bgcolor: active ? "primary.main" : completed ? "success.main" : "background.paper",
        color: active || completed ? "common.white" : "text.secondary",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 160ms ease",
      }}
    >
      {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : children}
    </Box>
  );
}

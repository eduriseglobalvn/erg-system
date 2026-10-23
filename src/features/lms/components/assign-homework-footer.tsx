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
}: {
  step: number;
  onBack: () => void;
  onPreviousStep: () => void;
  onNext: () => void;
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
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <StepNumber active={step === 1} completed={step > 1}>1</StepNumber>
          <Typography sx={{ color: step === 1 ? "primary.main" : "success.main", fontSize: 15, fontWeight: 700 }}>
            Thiết lập bài tập
          </Typography>
        </Stack>
        <Box sx={{ width: 32, height: 1, bgcolor: "divider" }} />
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <StepNumber active={step === 2}>2</StepNumber>
          <Typography sx={{ color: step === 2 ? "primary.main" : "text.secondary", fontSize: 15, fontWeight: 700 }}>
            Chọn tài nguyên
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.25} sx={{ position: "relative", zIndex: 60, ml: "auto", minWidth: 240, flexShrink: 0, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          onClick={step === 1 ? onBack : onPreviousStep}
          sx={{ height: 40, minWidth: 88, fontWeight: 700, textTransform: "none" }}
        >
          {step === 1 ? "Hủy" : "Quay lại"}
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          sx={{ height: 40, minWidth: 116, px: 3, fontWeight: 700, textTransform: "none" }}
        >
          {step === 1 ? "Tiếp theo" : "Giao bài"}
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
        fontWeight: 700,
        transition: "all 160ms ease",
      }}
    >
      {completed ? <CheckIcon sx={{ fontSize: 16 }} /> : children}
    </Box>
  );
}

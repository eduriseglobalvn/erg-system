import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { Exercise } from "../exercise-bank-model";
import type { CreateExerciseStep } from "./types";

export function CreateExerciseHeader({
  initialExercise,
  subjectName,
  activeStep,
  setActiveStep,
  selectedQuestionIds,
  title,
  setTitle,
  setError,
  onClose,
}: {
  initialExercise?: Exercise | null;
  subjectName: string;
  activeStep: CreateExerciseStep;
  setActiveStep: (step: CreateExerciseStep) => void;
  selectedQuestionIds: string[];
  title: string;
  setTitle: (title: string) => void;
  setError: (error: string) => void;
  onClose: () => void;
}) {
  return (
    <DialogTitle
      sx={{
        m: 0,
        px: { xs: 2, sm: 3.5 },
        py: { xs: 1.25, sm: 1.5 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.25 }, minWidth: 0 }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 32, height: 32, flexShrink: 0, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default", color: "primary.main" }}>
          <AutoAwesomeIcon fontSize="small" />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2" noWrap sx={{ fontWeight: "fontWeightBold" }}>
            {initialExercise ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
          </Typography>
          <ErgStatusChip dot={false} label={subjectName} tone="info" sx={{ flexShrink: 0 }} />
          {initialExercise && <ErgStatusChip dot={false} label="Chỉnh sửa" tone="warning" sx={{ flexShrink: 0 }} />}
        </Box>
      </Box>

      {/* Stepper chuyển bước & Nút đóng */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.75, sm: 1 }, flexShrink: 0 }}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default", p: { xs: 0.25, sm: 0.5 } }}>
          <StepButton active={activeStep === "pick"} index={1} label="Bốc câu hỏi" onClick={() => setActiveStep("pick")}>
            {selectedQuestionIds.length > 0 && (
              <Box component="span" sx={{ borderRadius: 999, bgcolor: "primary.main", color: "primary.contrastText", px: 0.75, typography: "caption", lineHeight: 1.4 }}>
                {selectedQuestionIds.length}
              </Box>
            )}
          </StepButton>
          <StepButton
            active={activeStep === "setup"}
            index={2}
            label="Cấu hình bài tập"
            onClick={() => {
              if (selectedQuestionIds.length === 0) {
                setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình bài tập");
                return;
              }
              if (!title.trim()) {
                setTitle(`${subjectName} - Bài tập luyện tập (${selectedQuestionIds.length} câu)`);
              }
              setError("");
              setActiveStep("setup");
            }}
          />
        </Box>

        <Box sx={{ width: "1px", height: 16, bgcolor: "divider", mx: 0.25 }} />

        <ErgIconButton label="Đóng" size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </ErgIconButton>
      </Box>
    </DialogTitle>
  );
}

function StepButton({
  active,
  children,
  index,
  label,
  onClick,
}: {
  active: boolean;
  children?: ReactNode;
  index: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <ErgButton
      type="button"
      variant="text"
      size="small"
      color={active ? "primary" : "inherit"}
      onClick={onClick}
      sx={{
        gap: 1,
        minWidth: 0,
        px: { xs: 1.25, sm: 1.5 },
        py: 0.5,
        typography: "caption",
        fontWeight: active ? "fontWeightBold" : "fontWeightMedium",
        bgcolor: active ? "background.paper" : "transparent",
        boxShadow: active ? 1 : 0,
      }}
    >
      <Box
        component="span"
        sx={{
          display: "grid",
          placeItems: "center",
          width: 18,
          height: 18,
          borderRadius: "50%",
          typography: "caption",
          fontWeight: "fontWeightBold",
          bgcolor: active ? "primary.main" : "divider",
          color: active ? "primary.contrastText" : "text.primary",
        }}
      >
        {index}
      </Box>
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        {label}
      </Box>
      {children}
    </ErgButton>
  );
}

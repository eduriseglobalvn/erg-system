import Box from "@mui/material/Box";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { Exercise } from "../exercise-bank-model";
import type { CreateExerciseStep } from "./types";

export function CreateExerciseFooter({
  selectedQuestionIds,
  activeStep,
  setActiveStep,
  initialExercise,
  title,
  setTitle,
  subjectName,
  setError,
  handleSubmit,
  onClose,
}: {
  selectedQuestionIds: string[];
  activeStep: CreateExerciseStep;
  setActiveStep: (step: CreateExerciseStep) => void;
  initialExercise?: Exercise | null;
  title: string;
  setTitle: (title: string) => void;
  subjectName: string;
  setError: (error: string) => void;
  handleSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <DialogActions
      sx={{
        px: { xs: 2, sm: 3.5 },
        py: { xs: 1.5, sm: 1.75 },
        borderTop: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
        bgcolor: "background.paper",
      }}
    >
      {/* Thống kê số câu đã chọn */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
        {selectedQuestionIds.length > 0 ? (
          <>
            <ErgStatusChip label={`Đã chọn ${selectedQuestionIds.length} câu`} tone="info" />
            <Typography variant="caption" sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontWeight: "fontWeightMedium" }}>
              <ScheduleIcon fontSize="inherit" />
              Thời lượng: ~{Math.round(selectedQuestionIds.length * 2)} phút
            </Typography>
          </>
        ) : (
          <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", fontWeight: "fontWeightMedium" }}>
            * Chưa bốc câu hỏi nào (chọn ít nhất 1 câu)
          </Typography>
        )}
      </Box>

      {/* Nút hành động */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1, width: { xs: "100%", sm: "auto" } }}>
        {activeStep === "pick" ? (
          <>
            <ErgButton type="button" variant="outlined" onClick={onClose} sx={{ flex: { xs: 1, sm: "initial" } }}>
              Hủy bỏ
            </ErgButton>

            <ErgButton
              type="button"
              variant="contained"
              disabled={selectedQuestionIds.length === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (selectedQuestionIds.length === 0) {
                  setError("Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng trước khi cấu hình");
                  return;
                }
                if (!title.trim()) {
                  setTitle(`${subjectName} - Bài tập ôn luyện (${selectedQuestionIds.length} câu)`);
                }
                setError("");
                setActiveStep("setup");
              }}
              endIcon={<ArrowForwardIcon fontSize="small" />}
              sx={{ flex: { xs: 2, sm: "initial" } }}
            >
              {selectedQuestionIds.length > 0
                ? `Tiếp tục (${selectedQuestionIds.length} câu) →`
                : "Chọn câu hỏi để tiếp tục"}
            </ErgButton>
          </>
        ) : (
          <>
            <ErgButton
              type="button"
              variant="outlined"
              onClick={() => setActiveStep("pick")}
              startIcon={<ArrowBackIcon fontSize="small" />}
              sx={{ flex: { xs: 1, sm: "initial" } }}
            >
              Quay lại chọn câu
            </ErgButton>

            <ErgButton
              type="button"
              variant="contained"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }}
              endIcon={<CheckIcon fontSize="small" />}
              sx={{ flex: { xs: 2, sm: "initial" } }}
            >
              {initialExercise ? "Lưu thay đổi bài tập" : `Tạo bài tập (${selectedQuestionIds.length} câu)`}
            </ErgButton>
          </>
        )}
      </Box>
    </DialogActions>
  );
}

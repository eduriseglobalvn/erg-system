import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import {
  difficultyLabels,
  statusLabels,
  typeLabels,
  type ExerciseDifficulty,
  type ExerciseStatus,
  type ExerciseType,
} from "../exercise-bank-model";
import type { BankQuestion, CreateExerciseStep } from "./types";

export function SetupPreview({
  subjectName,
  level,
  type,
  status,
  title,
  classTargets,
  difficulty,
  selectedQuestionIds,
  selectedQuestions,
  setActiveStep,
}: {
  subjectName: string;
  level: string;
  type: ExerciseType;
  status: ExerciseStatus;
  title: string;
  classTargets: string;
  difficulty: ExerciseDifficulty;
  selectedQuestionIds: string[];
  selectedQuestions: BankQuestion[];
  setActiveStep: (step: CreateExerciseStep) => void;
}) {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, lg: 3.5 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "background.default",
        borderTop: { xs: 1, lg: 0 },
        borderColor: "divider",
      }}
    >
      {/* TIÊU ĐỀ CỘT PHẢI */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 0.5, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightBold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Xem trước thẻ bài tập
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "fontWeightMedium" }}>
          Cập nhật trực tiếp
        </Typography>
      </Box>

      {/* THẺ PREVIEW CARD */}
      <Box sx={cardSx}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <ErgStatusChip dot={false} label={`${subjectName} • ${level || "Level 1"}`} tone="info" />
            <ErgStatusChip dot={false} label={typeLabels[type]} />
          </Box>
          <ErgStatusChip label={statusLabels[status]} tone={status === "published" ? "success" : "warning"} />
        </Box>

        <Box>
          <Typography
            variant="subtitle2"
            component="h4"
            sx={{ fontWeight: "fontWeightBold", display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
          >
            {title.trim() ? title : "Chưa đặt tên bài tập..."}
          </Typography>
          <Typography variant="caption" component="p" sx={{ color: "text.secondary", mt: 0.5 }}>
            Áp dụng: {classTargets || "Chưa gán lớp cụ thể"}
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
          <PreviewStat label="Độ khó mục tiêu" value={difficultyLabels[difficulty]} />
          <PreviewStat label="Thời lượng dự tính" value={`~${Math.max(15, Math.round(Math.max(1, selectedQuestionIds.length) * 2))} phút`} />
        </Box>
      </Box>

      {/* THẺ TỔNG QUAN CÂU HỎI ĐÃ BỐC */}
      <Box sx={cardSx}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleOutlineIcon color="success" fontSize="small" />
            <Typography variant="subtitle2" component="h4" sx={{ fontWeight: "fontWeightBold" }}>
              Câu hỏi đã chọn ({selectedQuestionIds.length})
            </Typography>
          </Box>
          <ErgButton type="button" variant="text" size="small" onClick={() => setActiveStep("pick")}>
            ← Đổi câu hỏi
          </ErgButton>
        </Box>

        {selectedQuestionIds.length > 0 ? (
          <Stack spacing={1} sx={{ maxHeight: 220, overflowY: "auto", pr: 0.5 }}>
            {selectedQuestions.map((q, idx) => (
              <Box key={q.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.default", p: 1.25, display: "grid", gap: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                  <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary", fontWeight: "fontWeightBold" }}>#{idx + 1}</Typography>
                  <Typography variant="caption" component="p" noWrap sx={{ fontWeight: "fontWeightMedium" }}>{q.stem}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ErgStatusChip dot={false} label={q.categoryLabel} />
                  {q.answer && (
                    <>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Typography variant="caption" sx={{ color: "success.main", fontWeight: "fontWeightMedium" }}>
                        Đ/a: {q.answer}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <Box sx={{ py: 2, textAlign: "center" }}>
            <Typography variant="caption" component="p" sx={{ color: "text.secondary", fontStyle: "italic", mb: 1 }}>
              Chưa có câu hỏi nào được chọn từ ngân hàng.
            </Typography>
            <ErgButton type="button" variant="outlined" size="small" onClick={() => setActiveStep("pick")}>
              Bốc câu hỏi từ ngân hàng ngay →
            </ErgButton>
          </Box>
        )}

        {/* NÚT THAO TÁC BỐC THÊM */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: 1, borderColor: "divider" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Thời lượng: <strong>~{Math.round(selectedQuestionIds.length * 2)} phút</strong>
          </Typography>
          <ErgButton type="button" variant="text" size="small" onClick={() => setActiveStep("pick")}>
            + Chọn thêm câu hỏi
          </ErgButton>
        </Box>
      </Box>
    </Box>
  );
}

const cardSx = { border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", p: 2, display: "flex", flexDirection: "column", gap: 1.5, boxShadow: 1 } as const;

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ borderRadius: 1, border: 1, borderColor: "divider", bgcolor: "background.default", p: 1 }}>
      <Typography variant="caption" component="span" sx={{ display: "block", color: "text.secondary" }}>{label}</Typography>
      <Typography variant="caption" component="span" sx={{ display: "block", fontWeight: "fontWeightBold", mt: 0.25 }}>{value}</Typography>
    </Box>
  );
}

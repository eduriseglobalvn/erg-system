import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide, QuizEditorSlideOptions } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const questionTypeOptions = ["Graded", "Survey", "Practice"] as const;
const feedbackOptions = ["By Result", "None", "By choice"] as const;

export function MuiQuestionSettings({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const options = slide.options ?? {};

  const timePresets = [
    { label: "30s", value: "00:30" },
    { label: "1m", value: "01:00" },
    { label: "2m", value: "02:00" },
    { label: "5m", value: "05:00" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* Card 1: Question Behavior */}
      <Box
        sx={{
          p: 2,
          borderRadius: "12px",
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0F172A", fontSize: "13px" }}>
          Hành vi làm bài
        </Typography>

        {/* Shuffle Answers */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ pr: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
              {t("quiz.shuffleAnswers")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
              Tự động xáo trộn thứ tự các đáp án cho mỗi lượt làm
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={options.shuffleAnswers ?? false}
            onChange={(event) => onUpdateOptions({ shuffleAnswers: event.target.checked })}
            color="primary"
          />
        </Box>

        <Divider sx={{ borderColor: "#F1F5F9" }} />

        {/* Time Limit */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ pr: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                {t("quiz.limitTimeToAnswer")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
                Tự động kết thúc và nộp câu hỏi khi hết giờ
              </Typography>
            </Box>
            <Switch
              size="small"
              checked={options.limitTime ?? false}
              onChange={(event) => onUpdateOptions({ limitTime: event.target.checked })}
              color="primary"
            />
          </Box>

          {options.limitTime ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.5, pt: 0.5 }}>
              <TextField
                size="small"
                value={options.timeLimit ?? "01:00"}
                onChange={(event) => onUpdateOptions({ timeLimit: event.target.value })}
                placeholder="mm:ss"
                sx={{
                  width: 90,
                  "& input": { textAlign: "center", fontWeight: 600, fontSize: "13px", py: "6px" },
                }}
              />
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {timePresets.map((preset) => (
                  <Chip
                    key={preset.value}
                    label={preset.label}
                    size="small"
                    variant={options.timeLimit === preset.value ? "filled" : "outlined"}
                    color={options.timeLimit === preset.value ? "primary" : "default"}
                    onClick={() => onUpdateOptions({ timeLimit: preset.value })}
                    sx={{ fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                  />
                ))}
              </Box>
            </Box>
          ) : null}
        </Box>

        <Divider sx={{ borderColor: "#F1F5F9" }} />

        {/* Accept Partial */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ pr: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
              {t("quiz.acceptPartial")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
              Cộng điểm theo tỷ lệ các phương án đúng đã chọn
            </Typography>
          </Box>
          <Switch
            size="small"
            checked={options.acceptPartial ?? false}
            onChange={(event) => onUpdateOptions({ acceptPartial: event.target.checked })}
            color="primary"
          />
        </Box>

        {/* Multiple-response Limit Responses */}
        {slide.kind === "multiple-response" ? (
          <>
            <Divider sx={{ borderColor: "#F1F5F9" }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ pr: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                    {t("quiz.limitResponses")}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
                    Khóa ô chọn khi học sinh đạt số lựa chọn tối đa
                  </Typography>
                </Box>
                <Switch
                  size="small"
                  checked={options.limitResponses ?? false}
                  onChange={(event) => onUpdateOptions({ limitResponses: event.target.checked })}
                  color="primary"
                />
              </Box>
              {options.limitResponses ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600 }}>
                    Số lựa chọn:
                  </Typography>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Chip
                      key={num}
                      label={num}
                      size="small"
                      variant={options.limitResponsesValue === num ? "filled" : "outlined"}
                      color={options.limitResponsesValue === num ? "primary" : "default"}
                      onClick={() => onUpdateOptions({ limitResponsesValue: num })}
                      sx={{ minWidth: 28, fontWeight: 600, cursor: "pointer" }}
                    />
                  ))}
                </Box>
              ) : null}
            </Box>
          </>
        ) : null}
      </Box>

      {/* Card 2: Question Type & Feedback Mode */}
      <Box
        sx={{
          p: 2,
          borderRadius: "12px",
          bgcolor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#0F172A", fontSize: "13px" }}>
          {t("quiz.feedbackAndScoring")}
        </Typography>

        <LabeledSelect
          label={t("common.questionType")}
          value={options.questionType ?? "Graded"}
          options={questionTypeOptions.map((value) => ({
            value,
            label: formatQuestionTypeLabel(value, t),
            description:
              value === "Graded"
                ? t("common.feedback")
                : value === "Survey"
                  ? t("quiz.optionByChoice")
                  : t("quiz.optionPractice"),
          }))}
          onChange={(value) => onUpdateOptions({ questionType: value })}
        />

        <LabeledSelect
          label={t("common.feedback")}
          value={options.feedback ?? "By Result"}
          options={feedbackOptions.map((value) => ({
            value,
            label: formatFeedbackOptionLabel(value, t),
            description: value === "None" ? t("common.none") : t("common.feedbackAndBranching"),
          }))}
          onChange={(value) => onUpdateOptions({ feedback: value })}
        />
      </Box>
    </Box>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <Box className="classic-editor__mui-labeled-select">
      {label ? <Typography variant="caption">{label}</Typography> : null}
      <Box className="classic-editor__native-select-wrap">
        <select
          className="classic-editor__native-select"
          aria-label={label || "Select"}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.description ? `${option.label} - ${option.description}` : option.label}
            </option>
          ))}
        </select>
        <ExpandMoreIcon fontSize="small" aria-hidden="true" />
      </Box>
    </Box>
  );
}

function formatQuestionTypeLabel(option: (typeof questionTypeOptions)[number], t: ReturnType<typeof useI18n>["t"]) {
  if (option === "Graded") return t("common.graded");
  if (option === "Survey") return t("quiz.optionSurvey");
  return t("quiz.optionPractice");
}

function formatFeedbackOptionLabel(option: (typeof feedbackOptions)[number], t: ReturnType<typeof useI18n>["t"]) {
  if (option === "By Result") return t("common.byResult");
  if (option === "None") return t("common.none");
  return t("quiz.optionByChoice");
}

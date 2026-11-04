import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorFinalSlideOptions, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function MuiFinalSlideSettings({
  slide,
  onUpdateOptions,
}: {
  slide: QuizEditorSlide;
  onUpdateOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const options = slide.options?.finalSlide;

  return (
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
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
        Cài đặt trang kết thúc
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.showUsersScore")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Hiển thị điểm tổng kết và tỷ lệ đúng sau khi nộp bài
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.showUserScore ?? false}
          onChange={(event) => onUpdateOptions({ showUserScore: event.target.checked })}
          color="primary"
        />
      </Box>

      <Divider sx={{ borderColor: "#F1F5F9" }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.allowUserReviewQuiz")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Cho phép xem lại từng câu hỏi và đáp án chi tiết
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.allowReview ?? false}
          onChange={(event) => onUpdateOptions({ allowReview: event.target.checked })}
          color="primary"
        />
      </Box>

      <Divider sx={{ borderColor: "#F1F5F9" }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ pr: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
            {t("quiz.allowUserRetryQuiz")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748B", display: "block", fontSize: "11px" }}>
            Cho phép học sinh nhấn làm lại bài kiểm tra
          </Typography>
        </Box>
        <Switch
          size="small"
          checked={options?.allowRetry ?? false}
          onChange={(event) => onUpdateOptions({ allowRetry: event.target.checked })}
          color="primary"
        />
      </Box>
    </Box>
  );
}

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import type { MessageKey } from "@/platform/i18n";
import { useI18n } from "@/platform/i18n";
import type { IntroSlideKind } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { introSlideLabelKeys } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ClassicIntroPreview } from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";

export function IntroductionMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: IntroSlideKind) => void;
  onClose?: () => void;
}) {
  const { t } = useI18n();

  const introOptions = Object.entries(introSlideLabelKeys) as Array<[IntroSlideKind, MessageKey]>;

  const introDescriptions: Record<IntroSlideKind, string> = {
    "intro-slide": "Tiêu đề, lời chào mừng và mô tả tóm tắt nội dung bài kiểm tra.",
    "user-info": "Thu thập họ tên, email, lớp hoặc mã học viên trước khi làm bài.",
    "instruction-slide": "Quy chế thi, hướng dẫn cách tính điểm và lưu ý quan trọng.",
  };

  return (
    <Paper
      elevation={12}
      sx={{
        width: 380,
        maxWidth: "calc(100vw - 20px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.75,
          pb: 1.25,
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(180deg, #F8FAFD 0%, #FFFFFF 100%)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#0F172A",
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {t("quiz.popupIntroduction")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontSize: 11.5,
                fontWeight: 500,
                display: "block",
                mt: 0.25,
              }}
            >
              Màn mở đầu hoặc quy định trước khi bắt đầu câu hỏi
            </Typography>
          </Box>

          {onClose ? (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                width: 28,
                height: 28,
                color: "#64748B",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        {introOptions.map(([type, labelKey]) => (
          <ButtonBase
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              textAlign: "left",
              gap: 1.5,
              p: 1.25,
              borderRadius: "12px",
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "all 140ms ease",
              "&:hover": {
                bgcolor: "#FAFAFC",
                borderColor: "#0071E3",
                boxShadow: "0 8px 24px -4px rgba(0, 113, 227, 0.12)",
                transform: "translateY(-1.5px)",
                "& .intro-card__arrow": {
                  bgcolor: "#0071E3",
                  color: "#FFFFFF",
                },
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 48,
                flexShrink: 0,
                borderRadius: "8px",
                bgcolor: "#FAFAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <ClassicIntroPreview type={type} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {t(labelKey)}
              </Typography>
              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: "11px",
                  lineHeight: 1.35,
                  mt: 0.35,
                }}
              >
                {introDescriptions[type]}
              </Typography>
            </Box>

            <Box
              className="intro-card__arrow"
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#F1F5F9",
                color: "#94A3B8",
                flexShrink: 0,
                transition: "all 140ms ease",
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Paper>
  );
}

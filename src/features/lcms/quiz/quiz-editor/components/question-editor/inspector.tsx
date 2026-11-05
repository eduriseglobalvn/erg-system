import { useState } from "react";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { MuiFeedbackAndScoring } from "@/features/lcms/quiz/quiz-editor/components/question-editor/feedback-scoring";
import { MuiFinalSlideSettings } from "@/features/lcms/quiz/quiz-editor/components/question-editor/final-slide-settings";
import { MuiMediaSettings } from "@/features/lcms/quiz/quiz-editor/components/question-editor/media-settings";
import { MuiQuestionSettings } from "@/features/lcms/quiz/quiz-editor/components/question-editor/question-settings";
import { useI18n } from "@/platform/i18n";
import type { QuizEditorFeedbackRow, QuizEditorFinalSlideOptions, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function QuestionEditorInspector({
  draftSlide,
  onUpdateFeedbackRows,
  onPickMedia,
  onRemoveMedia,
  onUpdateMediaAlt,
  onUpdateOptions,
  onUpdateFinalSlideOptions,
}: {
  draftSlide: QuizEditorSlide;
  onUpdateFeedbackRows: (rows: QuizEditorFeedbackRow[]) => void;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onUpdateMediaAlt: (value: string) => void;
  onUpdateOptions: (patch: Partial<NonNullable<QuizEditorSlide["options"]>>) => void;
  onUpdateFinalSlideOptions: (patch: Partial<QuizEditorFinalSlideOptions>) => void;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"settings" | "feedback" | "media">("settings");

  const hasFeedback = Boolean(draftSlide.feedbackRows && draftSlide.feedbackRows.length > 0);
  const hasCustomFeedback = draftSlide.feedbackRows?.some((r) => r.feedback?.trim());
  const hasMedia = Boolean(draftSlide.media?.src);

  const currentTab = !hasFeedback && activeTab === "feedback" ? "settings" : activeTab;

  return (
    <Box
      className="classic-editor__mui-inspector"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        height: "100%",
      }}
    >
      {/* Top Segmented Tabs */}
      <Box
        sx={{
          display: "flex",
          p: "4px",
          borderRadius: "10px",
          bgcolor: "#F1F5F9",
          border: "1px solid #E2E8F0",
          gap: "4px",
        }}
      >
        <ButtonBase
          onClick={() => setActiveTab("settings")}
          sx={{
            flex: 1,
            py: "7px",
            px: "8px",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            bgcolor: currentTab === "settings" ? "#FFFFFF" : "transparent",
            color: currentTab === "settings" ? "#0071E3" : "#64748B",
            boxShadow: currentTab === "settings" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            "&:hover": {
              color: "#0071E3",
            },
          }}
        >
          <TuneRoundedIcon sx={{ fontSize: 16 }} />
          <span>{t("quiz.questionSettings") || "Cài đặt"}</span>
        </ButtonBase>

        {hasFeedback ? (
          <ButtonBase
            onClick={() => setActiveTab("feedback")}
            sx={{
              flex: 1,
              py: "7px",
              px: "8px",
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              bgcolor: currentTab === "feedback" ? "#FFFFFF" : "transparent",
              color: currentTab === "feedback" ? "#0071E3" : "#64748B",
              boxShadow: currentTab === "feedback" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
              "&:hover": {
                color: "#0071E3",
              },
            }}
          >
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16 }} />
            <span>{t("quiz.feedbackAndScoring") || "Phản hồi"}</span>
            {hasCustomFeedback ? (
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#0071E3" }} />
            ) : null}
          </ButtonBase>
        ) : null}

        <ButtonBase
          onClick={() => setActiveTab("media")}
          sx={{
            flex: 1,
            py: "7px",
            px: "8px",
            borderRadius: "7px",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            bgcolor: currentTab === "media" ? "#FFFFFF" : "transparent",
            color: currentTab === "media" ? "#0071E3" : "#64748B",
            boxShadow: currentTab === "media" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.15s ease",
            "&:hover": {
              color: "#0071E3",
            },
          }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 16 }} />
          <span>{t("common.picture") || "Hình ảnh"}</span>
          {hasMedia ? (
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10B981" }} />
          ) : null}
        </ButtonBase>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1, overflowY: "auto", pr: 0.5 }}>
        {currentTab === "settings" && (
          draftSlide.kind === "result-slide" ? (
            <MuiFinalSlideSettings slide={draftSlide} onUpdateOptions={onUpdateFinalSlideOptions} />
          ) : (
            <MuiQuestionSettings slide={draftSlide} onUpdateOptions={onUpdateOptions} />
          )
        )}

        {currentTab === "feedback" && hasFeedback && (
          <MuiFeedbackAndScoring rows={draftSlide.feedbackRows!} onChange={onUpdateFeedbackRows} />
        )}

        {currentTab === "media" && (
          <MuiMediaSettings
            slide={draftSlide}
            onPickMedia={onPickMedia}
            onRemoveMedia={onRemoveMedia}
            onUpdateMediaAlt={onUpdateMediaAlt}
          />
        )}
      </Box>
    </Box>
  );
}

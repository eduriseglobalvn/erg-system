import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";

import { LearnerInstructionScreen } from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/learner-preview-screens";
import type { QuizEditorSlide, QuizEditorSlideUpdate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { QuestionImageSlot } from "./question-image-slot";

type Props = { slide: QuizEditorSlide; onReplaceSlide: (update: QuizEditorSlideUpdate) => void };

// Minimal editor for intro / learner-info / instruction slides until their full authoring lands (spec Đợt 4).
export function IntroSlideCard({ slide, onReplaceSlide }: Props) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 2.25, p: 3.5 }}>
      <InputBase
        fullWidth
        inputProps={{ "aria-label": "Tiêu đề" }}
        multiline
        onChange={(event) => onReplaceSlide({ ...slide, title: event.target.value })}
        placeholder="Nhập tiêu đề"
        sx={{
          border: 1, borderColor: "transparent", borderRadius: 1, px: 1.5, py: 1, typography: "h6",
          "&.Mui-focused": { borderColor: "primary.main", boxShadow: tokens.shadow.focus },
        }}
        value={slide.title}
      />
      <QuestionImageSlot label="Thêm ảnh" media={slide.media} onChange={(media) => onReplaceSlide((current) => ({ ...current, media }))} />
      {/* The slot above shows the image, so the instruction list does not draw it again. */}
      <LearnerInstructionScreen
        onUpdateInstructions={(instructions) => onReplaceSlide((current) => ({ ...current, instructions }))}
        readOnly={false}
        slide={{ ...slide, media: undefined }}
      />
    </Box>
  );
}

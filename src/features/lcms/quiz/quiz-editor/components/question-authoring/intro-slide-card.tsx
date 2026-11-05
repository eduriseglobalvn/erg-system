import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import CloseIcon from "@mui/icons-material/Close";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide, QuizEditorSlideUpdate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { QuestionImageSlot } from "./question-image-slot";

type Props = { slide: QuizEditorSlide; onReplaceSlide: (update: QuizEditorSlideUpdate) => void };

// Minimal editor for intro / learner-info / instruction slides until their full authoring lands (spec Đợt 4).
export function IntroSlideCard({ slide, onReplaceSlide }: Props) {
  const { t } = useI18n();
  const instructions = slide.instructions?.length ? slide.instructions : [slide.description ?? ""];
  const setInstructions = (next: string[]) => onReplaceSlide((current) => ({ ...current, instructions: next }));
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
      {instructions.map((item, index) => (
        // Rows are positional (no ids), so the index is the stable key.
        <Box key={`${slide.id}-instruction-${index}`} sx={{ alignItems: "flex-start", display: "flex", gap: 1 }}>
          <InputBase
            fullWidth
            inputProps={{ "aria-label": `${t("common.description")} ${index + 1}` }}
            multiline
            onChange={(event) => setInstructions(instructions.map((text, i) => (i === index ? event.target.value : text)))}
            sx={{ border: 1, borderColor: "divider", borderRadius: 1, px: 1.5, py: 1 }}
            value={item}
          />
          <IconButton aria-label={t("common.remove")} onClick={() => setInstructions(instructions.filter((_, i) => i !== index))} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button onClick={() => setInstructions([...instructions, ""])} sx={{ alignSelf: "flex-start" }} variant="text">
        + {t("common.description")}
      </Button>
    </Box>
  );
}

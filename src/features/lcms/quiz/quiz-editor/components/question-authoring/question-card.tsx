import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { Question } from "@/domain/quiz/types";
import type { QuizEditorSlide, QuizEditorSlideMedia } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ChoiceAuthoring } from "./choice-authoring";
import { QuestionFeedbackLine } from "./question-feedback-line";
import { QuestionImageSlot, type ImageSize } from "./question-image-slot";
import type { QuestionReadiness } from "./question-readiness";
import { writeSlideQuestion } from "./slide-question";

const HINTS: Record<string, string> = {
  "no-correct": "Chưa có phương án đúng. Bấm vào ô chữ cái để đánh dấu.",
  "min-options": "Cần ít nhất 2 phương án có chữ. Gõ vào ô trống hoặc nhấn Enter để thêm.",
};

type Props = {
  slide: QuizEditorSlide;
  question: Question | null;
  meta: string;
  readiness: QuestionReadiness;
  onReplaceSlide: (slide: QuizEditorSlide) => void;
};

export function QuestionCard({ slide, question, meta, readiness, onReplaceSlide }: Props) {
  const hotspot = slide.kind === "hotspot";
  const titleIssue = readiness.issues.find((issue) => issue.area === "title");
  const answerIssues = readiness.issues.filter((issue) => issue.area === "answers");
  const write = (next: Question) => onReplaceSlide(writeSlideQuestion(slide, next));

  const setTitle = (title: string) => (question ? write({ ...question, title }) : onReplaceSlide({ ...slide, title }));

  // The image lives on the slide and in the runtime question; the slide keeps its file name.
  const setMedia = (media: QuizEditorSlideMedia | null, size?: ImageSize) => {
    if (!question) return onReplaceSlide({ ...slide, media });
    const next: Question = hotspot
      ? { ...question, hotspotImage: media ? { url: media.src, width: size?.width ?? question.hotspotImage?.width ?? 1200, height: size?.height ?? question.hotspotImage?.height ?? 675 } : undefined }
      : { ...question, contentImage: media ? { url: media.src, alt: media.alt } : undefined };
    onReplaceSlide({ ...writeSlideQuestion(slide, next), media });
  };

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 2.25, p: 3.5 }}>
      <Typography color="text.secondary" variant="caption">{meta}</Typography>
      <Box>
        <InputBase
          fullWidth
          inputProps={{ "aria-label": "Đề bài" }}
          multiline
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nhập đề bài"
          sx={{
            border: 1, borderColor: "transparent", borderRadius: 1, px: 1.5, py: 1, typography: "h6",
            "&.Mui-focused": { borderColor: "primary.main", boxShadow: tokens.shadow.focus },
          }}
          value={slide.title}
        />
        {titleIssue ? <Typography color="warning.main" sx={{ px: 1.5 }} variant="caption">{titleIssue.message}</Typography> : null}
      </Box>
      <QuestionImageSlot label={hotspot ? "Ảnh của câu hỏi điểm nóng" : "Thêm ảnh cho câu hỏi"} media={slide.media} onChange={setMedia} />
      {answerIssues.length ? (
        <Box role="alert" sx={{ bgcolor: tokens.statusTint.warning.bg, borderRadius: `${tokens.radius.control}px`, color: tokens.statusTint.warning.color, display: "flex", gap: 1, px: 1.5, py: 1, typography: "body2" }}>
          <WarningAmberIcon fontSize="small" />
          <Box>
            {answerIssues.map((issue) => <div key={issue.code}>{HINTS[issue.code] ?? issue.message}</div>)}
          </Box>
        </Box>
      ) : null}
      {question && slide.kind === "multiple-choice" ? (
        <ChoiceAuthoring mode="single" onChange={write} question={question} />
      ) : question ? (
        // The slot above owns the content image, so the renderer does not draw it a second time.
        <QuestionRenderer
          editable
          onChange={() => {}}
          onQuestionChange={(next) => write({ ...next, contentImage: question.contentImage })}
          question={{ ...question, contentImage: undefined }}
          value={createInitialAnswer(question)}
        />
      ) : null}
      <QuestionFeedbackLine onChange={(feedbackRows) => onReplaceSlide({ ...slide, feedbackRows })} slide={slide} />
    </Box>
  );
}

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";

import type { Question } from "@/domain/quiz/types";
import type { QuizEditorSlide, QuizEditorSlideMedia, QuizEditorSlideUpdate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { AnswerArea } from "./answer-area";
import { QuestionFeedbackLine } from "./question-feedback-line";
import { QuestionImageSlot, type ImageSize } from "./question-image-slot";
import type { QuestionReadiness } from "./question-readiness";
import { readSlideQuestion, writeSlideQuestion } from "./slide-question";

// Letter tiles and Enter-to-add exist only on the single-choice card.
const CHOICE_HINTS: Record<string, string> = {
  "no-correct": "Chưa có phương án đúng. Bấm vào ô chữ cái để đánh dấu.",
  "min-options": "Cần ít nhất 2 phương án có chữ. Gõ vào ô trống hoặc nhấn Enter để thêm.",
};

type Props = {
  slide: QuizEditorSlide;
  question: Question | null;
  meta: string;
  readiness: QuestionReadiness;
  onReplaceSlide: (update: QuizEditorSlideUpdate) => void;
};

export function QuestionCard({ slide, question, meta, readiness, onReplaceSlide }: Props) {
  const { t } = useI18n();
  const hotspot = slide.kind === "hotspot";
  const hints: Record<string, string> = slide.kind === "multiple-choice" ? CHOICE_HINTS : {};
  const titleIssue = readiness.issues.find((issue) => issue.area === "title");
  const answerIssues = readiness.issues.filter((issue) => issue.area === "answers");
  const write = (next: Question) => onReplaceSlide(writeSlideQuestion(slide, next));
  // Results of async steps (image processing) patch the latest slide, so edits made meanwhile survive.
  const updateLatest = (change: (latest: Question) => Question) =>
    onReplaceSlide((current) => {
      const latest = readSlideQuestion(current, t);
      return latest ? writeSlideQuestion(current, change(latest)) : current;
    });

  const setTitle = (title: string) => (question ? write({ ...question, title }) : onReplaceSlide({ ...slide, title }));

  // The image lives on the slide and in the runtime question; the slide keeps its file name.
  const setMedia = (media: QuizEditorSlideMedia | null, size?: ImageSize) =>
    onReplaceSlide((current) => {
      const latest = readSlideQuestion(current, t);
      if (!latest) return { ...current, media };
      const next: Question = current.kind === "hotspot"
        ? { ...latest, hotspotImage: media ? { url: media.src, width: size?.width ?? latest.hotspotImage?.width ?? 1200, height: size?.height ?? latest.hotspotImage?.height ?? 675 } : undefined }
        : { ...latest, contentImage: media ? { url: media.src, alt: media.alt } : undefined };
      return { ...writeSlideQuestion(current, next), media };
    });

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
        <Box role="status" sx={{ bgcolor: tokens.statusTint.warning.bg, borderRadius: `${tokens.radius.control}px`, color: tokens.statusTint.warning.color, display: "flex", gap: 1, px: 1.5, py: 1, typography: "body2" }}>
          <WarningAmberIcon fontSize="small" />
          <Box>
            {answerIssues.map((issue) => <div key={issue.code}>{hints[issue.code] ?? issue.message}</div>)}
          </Box>
        </Box>
      ) : null}
      {question ? <AnswerArea onChange={write} onUpdate={updateLatest} question={question} slide={slide} /> : null}
      <QuestionFeedbackLine onChange={(feedbackRows) => onReplaceSlide({ ...slide, feedbackRows })} points={question?.points ?? 0} slide={slide} />
    </Box>
  );
}

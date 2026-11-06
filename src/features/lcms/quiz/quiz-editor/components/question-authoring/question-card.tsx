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
import { QuestionImageSlot } from "./question-image-slot";
import type { QuestionReadiness } from "./question-readiness";
import { readSlideQuestion, writeSlideQuestion } from "./slide-question";

// Action hints for the kinds whose card has letter tiles; true/false has two fixed options, so no Enter-to-add.
const MIN_OPTIONS_HINT = "Cần ít nhất 2 phương án có chữ. Gõ vào ô trống hoặc nhấn Enter để thêm.";
const ACTION_HINTS: Partial<Record<string, Record<string, string>>> = {
  "multiple-choice": { "no-correct": "Chưa có phương án đúng. Bấm vào ô chữ cái để đánh dấu.", "min-options": MIN_OPTIONS_HINT },
  "multiple-response": { "no-correct": "Chưa có phương án đúng. Bấm ô chữ cái để đánh dấu các đáp án đúng.", "min-options": MIN_OPTIONS_HINT },
  "true-false": { "no-correct": "Chưa có phương án đúng. Bấm ô chữ cái để chọn đáp án đúng." },
};

/** The yellow strip set right above the spot it is about (spec §5). */
function IssueStrip({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <Box role="status" sx={{ bgcolor: tokens.statusTint.warning.bg, borderRadius: `${tokens.radius.control}px`, color: tokens.statusTint.warning.color, display: "flex", gap: 1, px: 1.5, py: 1, typography: "body2" }}>
      <WarningAmberIcon fontSize="small" />
      <Box>
        {lines.map((line, index) => <div key={`${index}:${line}`}>{line}</div>)}
      </Box>
    </Box>
  );
}

type Props = {
  slide: QuizEditorSlide;
  question: Question | null;
  meta: string;
  readiness: QuestionReadiness;
  onReplaceSlide: (update: QuizEditorSlideUpdate) => void;
};

export function QuestionCard({ slide, question, meta, readiness, onReplaceSlide }: Props) {
  const { t } = useI18n();
  const hints = ACTION_HINTS[slide.kind] ?? {};
  const titleIssues = readiness.issues.filter((issue) => issue.area === "title").map((issue) => issue.message);
  // A hotspot's image is its answer canvas, so "Chưa có ảnh" sits with the answers, first.
  // MatchingAuthoring shows pair-key itself, next to its confirm button.
  const answerIssues = readiness.issues
    .filter((issue) => issue.area !== "title" && issue.code !== "pair-key")
    .map((issue) => hints[issue.code] ?? issue.message);
  const write = (next: Question) => onReplaceSlide(writeSlideQuestion(slide, next));
  // Results of async steps (image processing) patch the latest slide, so edits made meanwhile survive.
  const updateLatest = (change: (latest: Question) => Question) =>
    onReplaceSlide((current) => {
      const latest = readSlideQuestion(current, t);
      return latest ? writeSlideQuestion(current, change(latest)) : current;
    });

  const setTitle = (title: string) => (question ? write({ ...question, title }) : onReplaceSlide({ ...slide, title }));

  // The image lives on the slide and in the runtime question; the slide keeps its file name.
  // A hotspot image is the answer canvas, so its authoring surface owns it.
  const setMedia = (media: QuizEditorSlideMedia | null) =>
    onReplaceSlide((current) => {
      const latest = readSlideQuestion(current, t);
      if (!latest) return { ...current, media };
      return { ...writeSlideQuestion(current, { ...latest, contentImage: media ? { url: media.src, alt: media.alt } : undefined }), media };
    });

  return (
    <Box sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 2.25, p: 3.5 }}>
      <Typography color="text.secondary" variant="caption">{meta}</Typography>
      <IssueStrip lines={titleIssues} />
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
      </Box>
      {slide.kind === "hotspot" ? null : <QuestionImageSlot label="Thêm ảnh cho câu hỏi" media={slide.media} onChange={setMedia} />}
      <IssueStrip lines={answerIssues} />
      {question ? <AnswerArea onChange={write} onUpdate={updateLatest} question={question} slide={slide} /> : null}
      <QuestionFeedbackLine onChange={(feedbackRows) => onReplaceSlide({ ...slide, feedbackRows })} points={question?.points ?? 0} slide={slide} />
    </Box>
  );
}

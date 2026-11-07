import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { CSSProperties } from "react";

import { buildIntroFacts, introRules } from "@/components/quiz/intro-facts";
import type { Question, Quiz } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

/** Only what the assignment really provides. Teacher, XP, rank and class progress need a backend that does not exist yet. */
export type QuizWelcomeMeta = {
  subjectLabel?: string;
  dueAt?: string;
};

type QuizWelcomeScreenProps = {
  quiz: Quiz;
  questions: Question[];
  answeredCount: number;
  restoredDraft: boolean;
  isTrainingMode: boolean;
  playerCardStyle: CSSProperties;
  canvasStyle: CSSProperties;
  welcomeMeta?: QuizWelcomeMeta;
  onStart: () => void;
};

const radius = `var(--quiz-radius, ${tk.radius.card}px)`;

/** Fact tiles and rule lines for both the desktop and the mobile intro. */
export function buildIntroContent(quiz: Quiz, questions: Question[], welcomeMeta?: QuizWelcomeMeta) {
  // Only a testing quiz runs a clock.
  const timeLimitSeconds = quiz.settings.mode === "testing" && quiz.settings.timeLimitMinutes ? quiz.settings.timeLimitMinutes * 60 : null;
  // Attempts allowed, attempts used and the pass score are not part of the runtime yet, so those tiles stay absent.
  const facts = buildIntroFacts({ questionCount: questions.length, timeLimitSeconds, dueAt: welcomeMeta?.dueAt }, new Date());
  // The player writes a draft after every answer in both modes.
  const rules = introRules({ autosave: true, timeLimitSeconds });
  return { facts, rules };
}

export function IntroFactGrid({ facts }: { facts: ReturnType<typeof buildIntroFacts> }) {
  return (
    <Box component="dl" sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", m: 0 }}>
      {facts.map((fact) => (
        <Box key={fact.id} sx={{ display: "flex", flexDirection: "column-reverse", bgcolor: tk.color.surface, border: `1px solid ${tk.color.border}`, borderRadius: `var(--quiz-radius, ${tk.radius.control}px)`, px: 2, py: 1.5 }}>
          <Typography component="dt" sx={{ color: tk.color.textMuted }} variant="caption">{fact.label}</Typography>
          <Typography component="dd" sx={{ color: tk.color.text, m: 0 }} variant="h6">{fact.value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function IntroStartButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      size="large"
      sx={{
        bgcolor: `var(--quiz-accent, ${tk.color.primary})`,
        borderRadius: `var(--quiz-radius, ${tk.radius.control}px)`,
        color: `var(--quiz-accent-contrast, ${tk.color.surface})`,
        minHeight: 48,
        // The accent is the teacher's colour, so hover darkens it instead of swapping in the ERG blue.
        "&:hover": { bgcolor: `var(--quiz-accent, ${tk.color.primaryHover})`, filter: "brightness(0.92)" },
      }}
      variant="contained"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function IntroDraftNotice({ answered, total }: { answered: number; total: number }) {
  return (
    <Typography role="status" sx={{ bgcolor: tk.statusTint.info.bg, borderRadius: `var(--quiz-radius, ${tk.radius.control}px)`, color: tk.statusTint.info.color, px: 2, py: 1.5 }} variant="body2">
      Đã khôi phục bản nháp: {answered}/{total} câu đã trả lời.
    </Typography>
  );
}

export function IntroRules({ rules }: { rules: string[] }) {
  return rules.length ? (
    <Box component="ul" sx={{ color: tk.color.textSecondary, display: "grid", gap: 0.5, m: 0, pl: 2.5 }}>
      {rules.map((rule) => <Typography component="li" key={rule} variant="body2">{rule}</Typography>)}
    </Box>
  ) : null;
}

export function QuizWelcomeScreen({
  quiz, questions, answeredCount, restoredDraft, isTrainingMode, playerCardStyle, canvasStyle, welcomeMeta, onStart,
}: QuizWelcomeScreenProps) {
  const { facts, rules } = buildIntroContent(quiz, questions, welcomeMeta);
  const subject = welcomeMeta?.subjectLabel?.trim();
  const description = quiz.description?.trim();

  return (
    <Box
      component="section"
      sx={{ border: `1px solid ${tk.color.border}`, ...playerCardStyle, borderRadius: radius, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", p: 2 }}
    >
      <Box sx={{ ...canvasStyle, display: "grid", flex: 1, gap: 3, m: "auto", maxWidth: 640, p: { xs: 2, sm: 4 }, width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip label={isTrainingMode ? "Luyện tập" : "Kiểm tra"} size="small" sx={{ bgcolor: tk.color.primarySofter, color: tk.color.text }} />
          {subject ? <Chip label={subject} size="small" variant="outlined" /> : null}
        </Box>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography component="h1" sx={{ color: tk.color.text }} variant="h4">{quiz.title}</Typography>
          {description ? <Typography sx={{ color: tk.color.textSecondary }} variant="body1">{description}</Typography> : null}
        </Box>
        <IntroFactGrid facts={facts} />
        <IntroRules rules={rules} />
        {restoredDraft ? <IntroDraftNotice answered={answeredCount} total={questions.length} /> : null}
        <Box>
          <IntroStartButton label={restoredDraft ? "Tiếp tục làm bài" : "Bắt đầu làm bài"} onClick={onStart} />
        </Box>
      </Box>
    </Box>
  );
}

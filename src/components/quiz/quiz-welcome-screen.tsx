import AlarmRounded from "@mui/icons-material/AlarmRounded";
import EventRounded from "@mui/icons-material/EventRounded";
import FormatListNumberedRounded from "@mui/icons-material/FormatListNumberedRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import QuizRounded from "@mui/icons-material/QuizRounded";
import ReplayRounded from "@mui/icons-material/ReplayRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import TimerRounded from "@mui/icons-material/TimerRounded";
import VerifiedRounded from "@mui/icons-material/VerifiedRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { CSSProperties, ReactNode } from "react";

import { buildIntroFacts, introRules, type IntroFact } from "@/components/quiz/intro-facts";
import { quizAccent, webSideSx } from "@/components/quiz/player-web-frame";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
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
const TIMED_RULE = "Đồng hồ chạy từ lúc bấm. Hết giờ bài tự nộp.";

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

const FACT_ICON: Record<IntroFact["id"], typeof TimerRounded> = {
  questions: FormatListNumberedRounded,
  duration: TimerRounded,
  attempts: ReplayRounded,
  passScore: VerifiedRounded,
  due: EventRounded,
};

/** Soft accent tiles: icon, big value, small label (WL1 / L01). */
export function IntroFactGrid({ facts }: { facts: ReturnType<typeof buildIntroFacts> }) {
  return (
    <Box component="dl" sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))", m: 0, position: "relative" }}>
      {facts.map((fact) => {
        const Icon = FACT_ICON[fact.id];
        return (
          // column-reverse keeps dt before dd in the markup while the value reads first.
          <Box key={fact.id} sx={{ bgcolor: tk.color.primarySofter, borderRadius: radius, display: "flex", flexDirection: "column-reverse", gap: 0.25, px: 1.75, py: 1.75 }}>
            <Typography component="dt" sx={{ color: tk.color.textMuted }} variant="caption">{fact.label}</Typography>
            <Typography component="dd" sx={{ color: tk.color.text, fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold", m: 0 }} variant="h2">{fact.value}</Typography>
            <Icon aria-hidden sx={{ color: quizAccent, fontSize: tk.size.iconMd }} />
          </Box>
        );
      })}
    </Box>
  );
}

export function IntroStartButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      size="large"
      startIcon={<PlayArrowRounded />}
      sx={{
        bgcolor: quizAccent,
        borderRadius: `var(--quiz-radius, ${tk.radius.control}px)`,
        color: `var(--quiz-accent-contrast, ${tk.color.surface})`,
        minHeight: 52,
        px: 3.5,
        typography: "h5",
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

// Web "Trước khi bắt đầu" rows: a title and a one-line explanation per rule that applies.
const RULE_ROW: Record<string, { icon: typeof TimerRounded; title: string; note?: string }> = {
  [TIMED_RULE]: { icon: TimerRounded, title: "Hết giờ bài tự nộp", note: "Đồng hồ chạy từ lúc bấm" },
  "Tự lưu sau mỗi câu": { icon: SaveRounded, title: "Tự lưu sau mỗi câu", note: "Đóng tab rồi mở lại vẫn làm tiếp" },
  "Xem đáp án sau khi nộp": { icon: VisibilityRounded, title: "Xem đáp án sau khi nộp" },
};

function Pill({ children, icon, tone }: { children: ReactNode; icon?: ReactNode; tone: "accent" | "warning" }) {
  const colors = tone === "accent" ? { bgcolor: tk.color.primarySofter, color: quizAccent } : { bgcolor: tk.statusTint.warning.bg, color: tk.statusTint.warning.color };
  return (
    <Box component="span" sx={{ ...colors, alignItems: "center", borderRadius: `${tk.radius.chip}px`, display: "inline-flex", fontWeight: "fontWeightBold", gap: 0.5, minHeight: tone === "accent" ? 26 : 32, px: tone === "accent" ? 1.25 : 1.5, typography: "caption", whiteSpace: "nowrap", "& svg": { fontSize: tk.size.iconSm } }}>
      {icon}{children}
    </Box>
  );
}

/** WL1: hero card (chips, title, due, fact tiles, start) and the "Trước khi bắt đầu" card on the right. */
export function QuizWelcomeScreen({
  quiz, questions, answeredCount, restoredDraft, isTrainingMode, playerCardStyle, canvasStyle, welcomeMeta, onStart,
}: QuizWelcomeScreenProps) {
  const { facts, rules } = buildIntroContent(quiz, questions, welcomeMeta);
  const subject = welcomeMeta?.subjectLabel?.trim();
  const description = quiz.description?.trim();
  const due = facts.find((fact) => fact.id === "due");
  const dueTime = formatDateTimeVi(welcomeMeta?.dueAt);
  const timed = rules.includes(TIMED_RULE);
  const ruleRows = rules.flatMap((rule) => (RULE_ROW[rule] ? [RULE_ROW[rule]] : []));

  return (
    <>
      <Box component="section" sx={{ display: "flex", flex: "1 1 640px", flexDirection: "column", gap: 2, maxWidth: 820, minWidth: 0 }}>
        <Box sx={{ bgcolor: tk.color.surface, border: `1px solid ${tk.color.border}`, ...playerCardStyle, ...canvasStyle, borderRadius: radius, display: "flex", flexDirection: "column", gap: 2.5, overflow: "hidden", p: 4, position: "relative" }}>
          <Box aria-hidden component="svg" viewBox="0 0 260 200" sx={{ color: quizAccent, height: 300, pointerEvents: "none", position: "absolute", right: -15, top: -21, width: 390 }}>
            <circle cx="200" cy="56" r="58" fill="currentColor" opacity=".10" />
            <circle cx="96" cy="150" r="26" fill="currentColor" opacity=".08" />
            <circle cx="236" cy="150" r="14" fill="currentColor" opacity=".12" />
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, position: "relative" }}>
            <Box aria-hidden sx={{ bgcolor: quizAccent, borderRadius: `${tk.radius.xl}px`, color: `var(--quiz-accent-contrast, ${tk.color.surface})`, display: "grid", flexShrink: 0, height: 56, placeItems: "center", width: 56 }}>
              <QuizRounded />
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {subject ? <Pill tone="accent">{subject}</Pill> : null}
              <Pill tone="accent" icon={isTrainingMode ? null : <TimerRounded />}>{isTrainingMode ? "Luyện tập" : "Kiểm tra"}</Pill>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 1, maxWidth: 560, position: "relative" }}>
            <Typography component="h1" sx={{ color: tk.color.text, fontWeight: "fontWeightBold" }} variant="h1">{quiz.title}</Typography>
            {description ? <Typography sx={{ color: tk.color.textSecondary }} variant="body1">{description}</Typography> : null}
          </Box>
          {due ? (
            <Box sx={{ display: "flex", position: "relative" }}>
              <Pill tone="warning" icon={<AlarmRounded />}>{dueTime ? `Hạn ${dueTime} · ` : null}<span>{due.value}</span></Pill>
            </Box>
          ) : null}
          <IntroFactGrid facts={facts.filter((fact) => fact.id !== "due")} />
          {restoredDraft ? <IntroDraftNotice answered={answeredCount} total={questions.length} /> : null}
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 2, position: "relative" }}>
            <IntroStartButton label={restoredDraft ? "Tiếp tục làm bài" : "Bắt đầu làm bài"} onClick={onStart} />
            {timed ? <Typography sx={{ color: tk.color.textMuted }} variant="caption">{TIMED_RULE}</Typography> : null}
          </Box>
        </Box>
      </Box>
      {ruleRows.length ? (
        <Box component="aside" sx={webSideSx}>
          <Box sx={{ bgcolor: tk.color.surface, border: `1px solid ${tk.color.border}`, borderRadius: radius, overflow: "hidden" }}>
            <Typography component="h2" sx={{ color: tk.color.text, px: 2, py: 1.75 }} variant="h6">Trước khi bắt đầu</Typography>
            {ruleRows.map(({ icon: Icon, title, note }) => (
              <Box key={title} sx={{ alignItems: "center", borderTop: `1px solid ${tk.color.divider}`, display: "flex", gap: 1.5, minHeight: 60, px: 2, py: 1.5 }}>
                <Icon aria-hidden sx={{ color: tk.color.textSecondary }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: tk.color.text }} variant="subtitle2">{title}</Typography>
                  {note ? <Typography component="div" sx={{ color: tk.color.textMuted }} variant="caption">{note}</Typography> : null}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}
    </>
  );
}

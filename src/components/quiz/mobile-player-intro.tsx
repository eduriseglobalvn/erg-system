import AlarmRoundedIcon from "@mui/icons-material/AlarmRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { CSSProperties, ReactNode } from "react";

import type { IntroFact } from "@/components/quiz/intro-facts";
import { buildIntroContent, IntroDraftNotice, type QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import type { Question, Quiz } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type Props = {
  playerCardStyle: CSSProperties;
  questions: Question[];
  quiz: Quiz;
  answeredCount?: number;
  restoredDraft?: boolean;
  welcomeMeta?: QuizWelcomeMeta;
  onStart: () => void;
};

const FACT_ICON: Record<Exclude<IntroFact["id"], "due">, ReactNode> = {
  questions: <FormatListNumberedRoundedIcon fontSize="small" />,
  duration: <TimerRoundedIcon fontSize="small" />,
  attempts: <ReplayRoundedIcon fontSize="small" />,
  passScore: <VerifiedRoundedIcon fontSize="small" />,
};

const CLOCK_RULE = /^Đồng hồ/;

function Pill({ children, icon, tone = "info" }: { children: ReactNode; icon?: ReactNode; tone?: "info" | "warning" }) {
  const tint = tk.statusTint[tone];
  return (
    <Box
      component="span"
      sx={{ alignItems: "center", bgcolor: tone === "info" ? tk.color.primarySofter : tint.bg, borderRadius: `${tk.radius.chip}px`, color: tone === "info" ? tk.color.primary : tint.color, display: "inline-flex", fontWeight: "fontWeightBold", gap: 0.5, height: 26, px: 1.25, typography: "caption", whiteSpace: "nowrap", "& svg": { fontSize: tk.size.iconSm } }}
    >
      {icon}
      {children}
    </Box>
  );
}

/** L01: hero card, fact tiles, rules as meta, start button docked at the bottom. */
export function MobilePlayerIntro({ playerCardStyle, answeredCount = 0, questions, quiz, restoredDraft = false, welcomeMeta, onStart }: Props) {
  const { facts, rules } = buildIntroContent(quiz, questions, welcomeMeta);
  const description = quiz.description?.trim();
  const subject = welcomeMeta?.subjectLabel?.trim();
  const training = quiz.settings.mode === "training";
  const due = facts.find((fact) => fact.id === "due");
  const tiles = facts.filter((fact) => fact.id !== "due");
  const clockRule = rules.find((rule) => CLOCK_RULE.test(rule));
  const metaRules = rules.filter((rule) => rule !== clockRule);
  return (
    <Box sx={{ display: { md: "none" } }}>
      <Box
        component="section"
        sx={{ ...playerCardStyle, backgroundImage: `linear-gradient(165deg, ${tk.color.primarySoft} 0%, transparent 72%)`, borderColor: "transparent", minHeight: "100vh", pb: 16 }}
      >
        <Box sx={{ display: "grid", gap: 1.5, px: 2, pt: 2 }}>
          <Box sx={{ bgcolor: tk.color.surface, border: `1px solid ${tk.color.border}`, borderRadius: `var(--quiz-radius, ${tk.radius.card}px)`, display: "grid", gap: 1.5, overflow: "hidden", p: 2.5, position: "relative" }}>
            <Box aria-hidden sx={{ bgcolor: tk.color.primarySofter, borderRadius: "50%", height: 116, position: "absolute", right: -18, top: -40, width: 116 }} />
            <Box sx={{ alignItems: "center", display: "flex", gap: 1, position: "relative" }}>
              <Box aria-hidden sx={{ bgcolor: `var(--quiz-accent, ${tk.color.primary})`, borderRadius: `${tk.radius.card}px`, color: `var(--quiz-accent-contrast, ${tk.color.surface})`, display: "grid", flexShrink: 0, height: 48, placeItems: "center", width: 48 }}>
                <QuizRoundedIcon />
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {subject ? <Pill>{subject}</Pill> : null}
                <Pill icon={training ? undefined : <TimerRoundedIcon />}>{training ? "Luyện tập" : "Kiểm tra"}</Pill>
              </Box>
            </Box>
            <Typography component="h1" sx={{ color: tk.color.text, position: "relative" }} variant="h2">{quiz.title}</Typography>
            {description ? <Typography sx={{ color: tk.color.textSecondary, position: "relative" }} variant="body2">{description}</Typography> : null}
            {due ? <Box sx={{ position: "relative" }}><Pill icon={<AlarmRoundedIcon />} tone="warning">{due.value}</Pill></Box> : null}
          </Box>

          <Box component="dl" sx={{ display: "grid", gap: 1, gridTemplateColumns: `repeat(${Math.max(tiles.length, 1)}, minmax(0, 1fr))`, m: 0 }}>
            {tiles.map((fact) => (
              <Box key={fact.id} sx={{ alignItems: "center", bgcolor: tk.color.primarySofter, borderRadius: `${tk.radius.card}px`, display: "flex", flexDirection: "column", gap: 0.25, px: 1, py: 1.25, textAlign: "center" }}>
                <Box aria-hidden component="span" sx={{ color: tk.color.primary, display: "flex" }}>{FACT_ICON[fact.id as keyof typeof FACT_ICON]}</Box>
                <Typography component="dt" sx={{ color: tk.color.textMuted, order: 2 }} variant="caption">{fact.label}</Typography>
                <Typography component="dd" sx={{ color: tk.color.text, fontVariantNumeric: "tabular-nums", m: 0, order: 1 }} variant="h4">{fact.value}</Typography>
              </Box>
            ))}
          </Box>

          {restoredDraft ? <IntroDraftNotice answered={answeredCount} total={questions.length} /> : null}

          {metaRules.length ? (
            <Box component="ul" sx={{ color: tk.color.textMuted, display: "flex", flexWrap: "wrap", gap: "6px 14px", listStyle: "none", m: 0, p: 0 }}>
              {metaRules.map((rule) => (
                <Box component="li" key={rule} sx={{ alignItems: "center", display: "inline-flex", gap: 0.5, typography: "caption", "& svg": { fontSize: tk.size.iconSm } }}>
                  {/^Tự lưu/.test(rule) ? <SaveOutlinedIcon aria-hidden /> : <VisibilityOutlinedIcon aria-hidden />}
                  {rule}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>

        {/* Fixed like the player footer: the host page clips anything below the first screen. */}
        <Box sx={{ bgcolor: `var(--quiz-player-bg, ${tk.color.surface})`, bottom: 0, display: "grid", gap: 1, left: 0, pb: "calc(env(safe-area-inset-bottom, 0px) + 20px)", position: "fixed", pt: 1.5, px: 2, right: 0, zIndex: 40 }}>
          <Button
            fullWidth
            size="large"
            startIcon={<PlayArrowRoundedIcon />}
            sx={{
              bgcolor: `var(--quiz-accent, ${tk.color.primary})`,
              borderRadius: `var(--quiz-radius, ${tk.radius.control}px)`,
              color: `var(--quiz-accent-contrast, ${tk.color.surface})`,
              minHeight: 54,
              typography: "h5",
              // The accent is the teacher's colour, so hover darkens it instead of swapping in the ERG blue.
              "&:hover": { bgcolor: `var(--quiz-accent, ${tk.color.primaryHover})`, filter: "brightness(0.92)" },
            }}
            variant="contained"
            onClick={onStart}
          >
            {restoredDraft ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}
          </Button>
          {clockRule ? <Typography sx={{ color: tk.color.textMuted, textAlign: "center" }} variant="caption">{clockRule}</Typography> : null}
        </Box>
      </Box>
    </Box>
  );
}

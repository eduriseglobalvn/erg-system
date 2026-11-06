import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { CSSProperties } from "react";

import { buildIntroContent, IntroFactGrid, IntroRules, IntroStartButton, type QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import type { Question, Quiz } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type Props = {
  playerCardStyle: CSSProperties;
  questions: Question[];
  quiz: Quiz;
  restoredDraft?: boolean;
  welcomeMeta?: QuizWelcomeMeta;
  onStart: () => void;
};

export function MobilePlayerIntro({ playerCardStyle, questions, quiz, restoredDraft = false, welcomeMeta, onStart }: Props) {
  const { facts, rules } = buildIntroContent(quiz, questions, welcomeMeta);
  const subject = welcomeMeta?.subjectLabel?.trim();
  return (
    <Box sx={{ display: { md: "none" } }}>
      <Box component="section" sx={{ ...playerCardStyle, borderColor: "transparent", display: "grid", alignContent: "start", gap: 2.5, minHeight: "100vh", p: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip label={quiz.settings.mode === "training" ? "Luyện tập" : "Kiểm tra"} size="small" sx={{ bgcolor: tk.color.primarySofter, color: tk.color.text }} />
          {subject ? <Chip label={subject} size="small" variant="outlined" /> : null}
        </Box>
        <Typography component="h1" sx={{ color: tk.color.text }} variant="h5">{quiz.title}</Typography>
        <IntroFactGrid facts={facts} />
        <IntroRules rules={rules} />
        <IntroStartButton label={restoredDraft ? "Tiếp tục làm bài" : "Bắt đầu làm bài"} onClick={onStart} />
      </Box>
    </Box>
  );
}

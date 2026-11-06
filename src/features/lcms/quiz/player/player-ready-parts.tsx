import { AnswerKeyCard } from "@/components/quiz/player-shell-parts";
import { PlayerOfflineBanner } from "@/components/quiz/player-status";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useState } from "react";

import { QuestionNavigator, type QuestionCell } from "@/components/quiz/question-navigator";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { playerViewportClass } from "@/components/quiz/player-shell-runtime/player-shell-styles";
import type { Question, Quiz } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";
import type { ComponentProps, CSSProperties } from "react";

type RendererProps = ComponentProps<typeof QuestionRenderer>;

type QuestionBodyProps = {
  online: boolean;
  question: Question;
  value: RendererProps["value"];
  onChange: RendererProps["onChange"];
  submitted: boolean;
  result: RendererProps["result"];
  submitError: string | null;
};

export function PlayerQuestionBody({ online, question: readyQuestion, value, onChange, submitted, result, submitError }: QuestionBodyProps) {
  return (
    <>
      {online ? null : <PlayerOfflineBanner />}

      <QuestionRenderer
        key={readyQuestion.id}
        question={readyQuestion}
        value={value}
        onChange={onChange}
        submitted={submitted}
        reviewMode={submitted}
        result={result}
      />

      {submitted && readyQuestion.kind === "hotspot" ? <AnswerKeyCard question={readyQuestion} /> : null}

      {submitError ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
          {submitError}
        </div>
      ) : null}

    </>
  );
}

type SidebarProps = {
  answeredQuestionIds: string[];
  bookmarkedQuestionIds: string[];
  currentIndex: number;
  quiz: Quiz;
  query: string;
  questions: Question[];
  started: boolean;
  style: CSSProperties;
  onIntroClick: () => void;
  onJumpToQuestion: (index: number) => void;
  onQueryChange: (value: string) => void;
};

export function PlayerSidebar(props: SidebarProps) {
  const [filter, setFilter] = useState<"all" | "unanswered" | "flagged">("all");
  const answered = new Set(props.answeredQuestionIds);
  const flagged = new Set(props.bookmarkedQuestionIds);
  const query = props.query.trim().toLowerCase();
  const cells: QuestionCell[] = props.questions.map((question, index) => {
    const isFlagged = flagged.has(question.id);
    const matchesFilter = filter === "all" || (filter === "unanswered" ? !answered.has(question.id) : isFlagged);
    const matchesQuery = !query || `${index + 1}. ${question.title}`.toLowerCase().includes(query);
    return {
      index,
      state: props.started && index === props.currentIndex ? "current" : answered.has(question.id) ? "done" : "todo",
      flagged: isFlagged,
      hidden: !(matchesFilter && matchesQuery),
    };
  });

  return (
    <Box
      component="aside"
      className={playerViewportClass}
      style={props.style}
      sx={{ bgcolor: "common.white", border: 1, borderColor: "divider", borderRadius: `${tk.radius.card}px`, display: "flex", flexDirection: "column", gap: 1, minHeight: 380, minWidth: 0, overflow: "auto", p: 1.5 }}
    >
      {props.started ? null : (
        <Button type="button" variant="outlined" onClick={props.onIntroClick} sx={{ justifyContent: "flex-start" }}>
          Trang giới thiệu{props.quiz.subtitle ? ` · ${props.quiz.subtitle}` : ""}
        </Button>
      )}
      <TextField
        fullWidth
        size="small"
        type="search"
        value={props.query}
        onChange={(event) => props.onQueryChange(event.target.value)}
        placeholder="Tìm kiếm"
        slotProps={{ htmlInput: { "aria-label": "Tìm kiếm câu hỏi" } }}
      />
      <ToggleButtonGroup exclusive fullWidth size="small" aria-label="Lọc câu hỏi" value={filter} onChange={(_event, next: typeof filter | null) => next && setFilter(next)}>
        <ToggleButton value="all">Tất cả</ToggleButton>
        <ToggleButton value="unanswered">Chưa làm</ToggleButton>
        <ToggleButton value="flagged">Đã đánh dấu</ToggleButton>
      </ToggleButtonGroup>
      <QuestionNavigator cells={cells} legend="auto" onSelect={props.onJumpToQuestion} surface="web" />
    </Box>
  );
}

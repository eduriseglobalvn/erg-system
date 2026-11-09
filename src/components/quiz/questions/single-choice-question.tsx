import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import { ChoiceOption, choiceReviewTag } from "@/components/quiz/questions/choice-option";
import { flushAnswerRegionSx, QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { Question } from "@/domain/quiz/types";

export function SingleChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const selectedId = value.choiceId;
  const choices = question.choices ?? [];

  return (
    <QuestionChoiceLayout question={question}>
      {/* A true/false statement shows two big Đúng / Sai buttons side by side. */}
      <Box role="group" aria-label="Các đáp án" sx={choiceGridSx(question, question.kind === "true_false")}>
        {choices.map((choice, index) => {
          const selected = selectedId === choice.id;
          return (
            <ChoiceOption
              key={choice.id}
              disabled={submitted}
              image={choice.image}
              letter={String.fromCharCode(65 + index)}
              mode="single"
              onClick={() => {
                onChange({ choiceId: choice.id });
              }}
              reviewTag={choiceReviewTag(reviewMode, selected, choice.correct)}
              selected={selected}
              shortcutKey={index < 9 ? String(index + 1) : undefined}
            >
              {choice.label}
            </ChoiceOption>
          );
        })}
      </Box>
    </QuestionChoiceLayout>
  );
}

/** Options stack on phones and sit two per row on wide screens (one column next to a question image). */
export function choiceGridSx(question: Question, twoColumnsOnPhone = false) {
  const wide = question.contentImage ? "1fr" : "repeat(2, minmax(0, 1fr))";
  return {
    display: "grid",
    gap: { xs: 1, md: 1.5 },
    gridTemplateColumns: { xs: twoColumnsOnPhone ? "repeat(2, minmax(0, 1fr))" : "1fr", md: wide },
  } as const;
}

export function QuestionChoiceLayout({
  children,
  question,
}: {
  children: ReactNode;
  question: Question;
}) {
  return (
    <Box className="quiz-answer-region" sx={{ ...flushAnswerRegionSx, alignItems: { lg: question.contentImage ? "flex-start" : undefined }, display: "grid", gap: 2.5, gridTemplateColumns: { lg: question.contentImage ? "minmax(0,0.95fr) minmax(360px,0.75fr)" : "1fr" } }}>
      {children}
      {question.contentImage ? <Box sx={{ position: { lg: "sticky" }, top: { lg: 0 } }}><QuestionContentImage question={question} /></Box> : null}
    </Box>
  );
}

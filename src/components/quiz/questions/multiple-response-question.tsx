import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import { ChoiceOption } from "@/components/quiz/questions/choice-option";
import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { Question } from "@/domain/quiz/types";

export function MultipleResponseQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const selectedIds = new Set(value.choiceIds ?? []);
  const choices = question.choices ?? [];

  return (
    <QuestionChoiceLayout question={question}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 2.5 } }}>
        {choices.map((choice) => {
          const selected = selectedIds.has(choice.id);
          const showCorrect = reviewMode && choice.correct;
          const showWrong = reviewMode && selected && !choice.correct;
          return (
            <ChoiceOption
              key={choice.id}
              disabled={submitted}
              image={choice.image}
              mode="multiple"
              onClick={() => {
                const next = new Set(value.choiceIds ?? []);
                if (next.has(choice.id)) next.delete(choice.id);
                else next.add(choice.id);
                onChange({ choiceIds: [...next] });
              }}
              reviewMode={reviewMode}
              selected={selected}
              showCorrect={showCorrect}
              showWrong={showWrong}
            >
              {choice.label}
            </ChoiceOption>
          );
        })}
      </Box>
    </QuestionChoiceLayout>
  );
}

function QuestionChoiceLayout({
  children,
  question,
}: {
  children: ReactNode;
  question: Question;
}) {
  return (
    <Box className="quiz-answer-region quiz-choice-region" sx={{ alignItems: { lg: question.contentImage ? "flex-start" : undefined }, display: "grid", gap: 2.5, gridTemplateColumns: { lg: question.contentImage ? "minmax(0,0.95fr) minmax(360px,0.75fr)" : "1fr" } }}>
      {children}
      {question.contentImage ? <Box sx={{ position: { lg: "sticky" }, top: { lg: 0 } }}><QuestionContentImage question={question} /></Box> : null}
    </Box>
  );
}

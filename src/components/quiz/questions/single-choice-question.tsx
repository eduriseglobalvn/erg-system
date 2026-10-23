import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import type { ReactNode } from "react";

import { ChoiceOption, EditableChoiceOption } from "@/components/quiz/questions/choice-option";
import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { Choice, Question } from "@/lib/types";

export function SingleChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const selectedId = value.choiceId;
  const choices = question.choices ?? [];

  function emitChoices(nextChoices: Choice[]) {
    onQuestionChange?.({ ...question, choices: nextChoices });
  }

  function updateChoice(choiceId: string, patch: Partial<Choice>) {
    emitChoices(choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)));
  }

  function toggleCorrect(choiceId: string) {
    emitChoices(choices.map((choice) => ({ ...choice, correct: choice.id === choiceId })));
  }

  function removeChoice(choiceId: string) {
    emitChoices(choices.filter((choice) => choice.id !== choiceId));
  }

  function addChoice() {
    emitChoices([
      ...choices,
      {
        id: createChoiceId("choice"),
        label: `Option ${choices.length + 1}`,
        correct: choices.length === 0,
      },
    ]);
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionChoiceLayout question={question}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 2.5 } }}>
          {choices.map((choice) => (
            <EditableChoiceOption
              key={choice.id}
              correct={choice.correct}
              label={choice.label}
              mode="single"
              onCorrectToggle={() => toggleCorrect(choice.id)}
              onLabelChange={(label) => updateChoice(choice.id, { label })}
              onRemove={choices.length > 2 ? () => removeChoice(choice.id) : undefined}
            />
          ))}
          <Button
            className="quiz-runtime-edit-add"
            variant="outlined"
            onClick={addChoice}
            sx={{ alignSelf: "flex-start", bgcolor: "common.white", borderColor: "rgba(0,0,136,0.14)", borderRadius: 1.5, color: "#000088", fontSize: 14, fontWeight: 800, minHeight: 40, px: 2.5, "&:hover": { bgcolor: "#eef3ff", borderColor: "rgba(0,0,136,0.22)" } }}
          >
            Add option
          </Button>
        </Box>
      </QuestionChoiceLayout>
    );
  }

  return (
    <QuestionChoiceLayout question={question}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, sm: 2.5 } }}>
        {choices.map((choice) => {
          const selected = selectedId === choice.id;
          const showCorrect = reviewMode && choice.correct;
          const showWrong = reviewMode && selected && !choice.correct;
          return (
            <ChoiceOption
              key={choice.id}
              disabled={submitted}
              mode="single"
              onClick={() => {
                onChange({ choiceId: choice.id });
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

function createChoiceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

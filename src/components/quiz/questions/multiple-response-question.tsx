import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import type { ReactNode } from "react";

import { ChoiceOption, EditableChoiceOption } from "@/components/quiz/questions/choice-option";
import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { Choice, Question } from "@/lib/types";

export function MultipleResponseQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const selectedIds = new Set(value.choiceIds ?? []);
  const choices = question.choices ?? [];

  function emitChoices(nextChoices: Choice[]) {
    onQuestionChange?.({ ...question, choices: nextChoices });
  }

  function updateChoice(choiceId: string, patch: Partial<Choice>) {
    emitChoices(choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)));
  }

  function toggleCorrect(choiceId: string) {
    emitChoices(
      choices.map((choice) => (choice.id === choiceId ? { ...choice, correct: !choice.correct } : choice)),
    );
  }

  function removeChoice(choiceId: string) {
    emitChoices(choices.filter((choice) => choice.id !== choiceId));
  }

  function addChoice() {
    emitChoices([
      ...choices,
      {
        id: createChoiceId("choice"),
        label: `Phương án ${choices.length + 1}`,
        correct: false,
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
              mode="multiple"
              onCorrectToggle={() => toggleCorrect(choice.id)}
              onLabelChange={(label) => updateChoice(choice.id, { label })}
              onRemove={choices.length > 2 ? () => removeChoice(choice.id) : undefined}
            />
          ))}
          <Button
            className="quiz-runtime-edit-add"
            variant="outlined"
            onClick={addChoice}
            startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{
              alignSelf: "flex-start",
              bgcolor: "rgba(15, 108, 189, 0.05)",
              borderColor: "#0F6CBD",
              borderStyle: "dashed",
              borderWidth: "1.5px",
              borderRadius: "10px",
              color: "#0F6CBD",
              fontSize: 13.5,
              fontWeight: 750,
              minHeight: 42,
              px: 2.5,
              py: 0.75,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "all 140ms ease",
              "&:hover": {
                bgcolor: "rgba(15, 108, 189, 0.12)",
                borderColor: "#0B5CAB",
                boxShadow: "0 4px 14px rgba(15, 108, 189, 0.14)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Thêm phương án
          </Button>
        </Box>
      </QuestionChoiceLayout>
    );
  }

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

function createChoiceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

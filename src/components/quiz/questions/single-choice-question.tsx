import { ChoiceOption, EditableChoiceOption } from "@/components/quiz/questions/choice-option";
import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import type { Choice, Question } from "@/lib/types";
import type { ReactNode } from "react";

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
        <div className="flex flex-col gap-4 sm:gap-5">
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
          <button
            type="button"
            className="quiz-runtime-edit-add inline-flex min-h-10 w-fit items-center rounded-xl border border-[rgba(0,0,136,0.14)] bg-white px-5 text-sm font-extrabold text-[#000088] shadow-sm transition hover:bg-[#eef3ff]"
            onClick={addChoice}
          >
            Add option
          </button>
        </div>
      </QuestionChoiceLayout>
    );
  }

  return (
    <QuestionChoiceLayout question={question}>
      <div className="flex flex-col gap-4 sm:gap-5">
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
      </div>
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
    <div className={`quiz-answer-region quiz-choice-region grid gap-5 ${question.contentImage ? "lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)] lg:items-start" : ""}`}>
      {children}
      {question.contentImage ? <QuestionContentImage question={question} className="lg:sticky lg:top-0" /> : null}
    </div>
  );
}

function createChoiceId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

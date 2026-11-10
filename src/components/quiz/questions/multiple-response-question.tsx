import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import Box from "@mui/material/Box";

import { ChoiceOption, choiceReviewTag } from "@/components/quiz/questions/choice-option";
import { choiceGridSx, QuestionChoiceLayout } from "@/components/quiz/questions/single-choice-question";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {reviewMode ? null : (
          <Box sx={{ typography: "caption", alignItems: "center", color: "text.secondary", display: "flex", gap: 0.5 }}>
            <ChecklistRoundedIcon aria-hidden sx={{ fontSize: ergEnterpriseTokens.size.iconSm }} />
            {`Có thể chọn nhiều đáp án · đã chọn ${selectedIds.size}`}
          </Box>
        )}
        <Box role="group" aria-label="Các đáp án" sx={choiceGridSx(question)}>
          {choices.map((choice, index) => {
            const selected = selectedIds.has(choice.id);
            return (
              <ChoiceOption
                key={choice.id}
                disabled={submitted}
                image={choice.image}
                letter={String.fromCharCode(65 + index)}
                mode="multiple"
                onClick={() => {
                  const next = new Set(value.choiceIds ?? []);
                  if (next.has(choice.id)) next.delete(choice.id);
                  else next.add(choice.id);
                  onChange({ choiceIds: [...next] });
                }}
                reviewTag={choiceReviewTag(reviewMode, selected, choice.correct, true)}
                selected={selected}
                shortcutKey={index < 9 ? String(index + 1) : undefined}
              >
                {choice.label}
              </ChoiceOption>
            );
          })}
        </Box>
      </Box>
    </QuestionChoiceLayout>
  );
}

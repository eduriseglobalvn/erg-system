import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorChoice } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function ChoiceEditorTable({
  choices,
  controlType,
  onChange,
}: {
  choices: QuizEditorChoice[];
  controlType: "checkbox" | "radio";
  onChange: (choices: QuizEditorChoice[]) => void;
}) {
  const { t } = useI18n();

  function updateChoice(choiceId: string, patch: Partial<QuizEditorChoice>) {
    onChange(
      choices.map((choice) => (choice.id === choiceId ? { ...choice, ...patch } : choice)),
    );
  }

  function toggleCorrect(choiceId: string) {
    if (controlType === "radio") {
      onChange(choices.map((choice) => ({ ...choice, correct: choice.id === choiceId })));
      return;
    }

    onChange(
      choices.map((choice) =>
        choice.id === choiceId ? { ...choice, correct: !choice.correct } : choice,
      ),
    );
  }

  function removeChoice(choiceId: string) {
    onChange(choices.filter((choice) => choice.id !== choiceId));
  }

  function addChoice() {
    const nextIndex = choices.length + 1;
    onChange([
      ...choices,
      {
        id: createClientId("choice"),
        label: `${t("common.option")} ${nextIndex}`,
        correct: false,
      },
    ]);
  }

  return (
    <div className="classic-editor__choice-table is-manager">
      <div className="classic-editor__choice-header">
        <div>{t("common.correct")}</div>
        <div>{t("common.option")}</div>
        <div />
      </div>

      {choices.map((choice, index) => (
        <div key={choice.id} className="classic-editor__choice-row">
          <div className="classic-editor__choice-marker">
            <span className="classic-editor__choice-index">{String.fromCharCode(65 + index)}</span>
            <input
              type={controlType}
              checked={choice.correct}
              onChange={() => toggleCorrect(choice.id)}
            />
          </div>
          <div className="classic-editor__choice-value">
            <input
              type="text"
              value={choice.label}
              onChange={(event) => updateChoice(choice.id, { label: event.target.value })}
              className="classic-editor__table-input"
            />
          </div>
          <button
            type="button"
            className="classic-editor__remove-btn"
            onClick={() => removeChoice(choice.id)}
            aria-label={t("common.remove")}
          >
            <DeleteOutlineOutlinedIcon className="h-4 w-4" fontSize="inherit" />
          </button>
        </div>
      ))}

      <button type="button" className="classic-editor__choice-add-button" onClick={addChoice}>
        <AddIcon className="h-4 w-4" fontSize="inherit" />
        <span>{t("quiz.typeToAddChoice")}</span>
      </button>
    </div>
  );
}

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

import { Plus as AddIcon } from "@/components/mui-icon-shim";
import { Trash2 as DeleteOutlineOutlinedIcon } from "@/components/mui-icon-shim";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function InstructionDescriptionPanel({
  slide,
  onChange,
}: {
  slide: QuizEditorSlide;
  onChange: (items: string[]) => void;
}) {
  const { t } = useI18n();
  const items = slide.instructions ?? [];

  function updateItem(index: number, value: string) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  function addItem() {
    onChange([...items, `${t("common.question")} ${items.length + 1}`]);
  }

  return (
    <div className="classic-editor__instruction-panel is-manager">
      <div className="classic-editor__instruction-panel-header">
        <p>{t("common.description")}</p>
        <button type="button" className="classic-editor__ghost-action" onClick={addItem}>
          <AddIcon className="h-4 w-4" size="1em" />
          <span>Add step</span>
        </button>
      </div>
      <div className="classic-editor__instruction-edit-list">
        {items.map((item, index) => (
          <div key={`${slide.id}-instruction-${index}`} className="classic-editor__instruction-edit-row">
            <span className="classic-editor__instruction-step">{index + 1}</span>
            <textarea
              value={item}
              onChange={(event) => updateItem(index, event.target.value)}
              className="classic-editor__textarea classic-editor__textarea--manager"
              rows={2}
            />
            <button
              type="button"
              className="classic-editor__remove-btn"
              onClick={() => removeItem(index)}
              aria-label={t("common.remove")}
            >
              <DeleteOutlineOutlinedIcon className="h-4 w-4" size="1em" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

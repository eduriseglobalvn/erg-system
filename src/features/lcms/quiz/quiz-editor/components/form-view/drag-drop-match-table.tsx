import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorDragDropItem } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function DragDropMatchTable({
  items,
  onChange,
}: {
  items: QuizEditorDragDropItem[];
  onChange: (items: QuizEditorDragDropItem[]) => void;
}) {
  const { t } = useI18n();

  function updateItem(itemId: string, patch: Partial<QuizEditorDragDropItem>) {
    onChange(items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  function removeItem(itemId: string) {
    onChange(items.filter((item) => item.id !== itemId));
  }

  function addItem() {
    const nextIndex = items.length + 1;
    onChange([
      ...items,
      {
        id: createClientId("drag-item"),
        label: `${t("common.dragItem")} ${nextIndex}`,
        emoji: "●",
        target: `${t("common.dropTarget")} ${nextIndex}`,
      },
    ]);
  }

  return (
    <div className="classic-editor__match-table is-manager">
      <div className="classic-editor__match-header">
        <div>{t("common.dragItem")}</div>
        <div>{t("common.dropTarget")}</div>
        <div />
      </div>
      {items.map((item) => (
        <div key={item.id} className="classic-editor__match-row">
          <div className="classic-editor__match-drag">
            <input
              type="text"
              value={item.emoji}
              onChange={(event) => updateItem(item.id, { emoji: event.target.value })}
              className="classic-editor__emoji-input"
            />
            <input
              type="text"
              value={item.label}
              onChange={(event) => updateItem(item.id, { label: event.target.value })}
              className="classic-editor__table-input"
            />
          </div>
          <div className="classic-editor__match-target">
            <span className="classic-editor__target-box" />
            <input
              type="text"
              value={item.target}
              onChange={(event) => updateItem(item.id, { target: event.target.value })}
              className="classic-editor__table-input"
            />
          </div>
          <button
            type="button"
            className="classic-editor__remove-btn"
            onClick={() => removeItem(item.id)}
            aria-label={t("common.remove")}
          >
            <DeleteOutlineOutlinedIcon className="h-4 w-4" fontSize="inherit" />
          </button>
        </div>
      ))}
      <button type="button" className="classic-editor__choice-add-button" onClick={addItem}>
        <AddIcon className="h-4 w-4" fontSize="inherit" />
        <span>{t("common.dragItem")}</span>
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

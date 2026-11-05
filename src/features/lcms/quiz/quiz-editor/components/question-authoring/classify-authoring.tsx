import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";

import type { DragDropItem, DropTarget, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ClassifyColumn } from "./classify-column";
import { newRowId, usePendingFocus } from "./sortable-rows";

const HINT = "Gõ mục vào đúng cột của nó; kéo mục sang cột khác để đổi nhóm.";

/** Teacher view of classification (spec §7 Phân loại): each group is a column holding the items that belong in it. */
export function ClassifyAuthoring({ question, onUpdate }: {
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const groups = question.dropTargets ?? [];
  const items = question.dragDropItems ?? [];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { rootRef, focusLater } = usePendingFocus();
  const setGroups = (change: (list: DropTarget[]) => DropTarget[]) => onUpdate((latest) => ({ ...latest, dropTargets: change(latest.dropTargets ?? []) }));
  const setItems = (change: (list: DragDropItem[]) => DragDropItem[]) => onUpdate((latest) => ({ ...latest, dragDropItems: change(latest.dragDropItems ?? []) }));
  const patchItem = (id: string, change: (item: DragDropItem) => DragDropItem) => setItems((list) => list.map((item) => (item.id === id ? change(item) : item)));

  const appendItem = (groupId: string) => {
    const id = newRowId("item");
    focusLater(`[data-input-id="${id}"]`);
    setItems((list) => [...list, { id, label: "", correctTargetId: groupId }]);
  };

  const appendGroup = () => {
    const id = newRowId("group");
    focusLater(`[data-input-id="${id}"]`);
    setGroups((list) => [...list, { id, label: "" }]);
  };

  const deleteGroup = (index: number) => {
    const neighbour = groups[index + 1] ?? groups[index - 1];
    if (neighbour) focusLater(`[data-input-id="${neighbour.id}"]`);
    setGroups((list) => list.filter((group) => group.id !== groups[index].id));
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    const column = items.filter((i) => i.correctTargetId === item?.correctTargetId);
    const at = column.findIndex((i) => i.id === id);
    focusLater(`[data-input-id="${(column[at + 1] ?? column[at - 1])?.id ?? item?.correctTargetId}"]`);
    setItems((list) => list.filter((i) => i.id !== id));
  };

  /** Alt+arrow on the grip: the item moves to the previous or next column, and the grip keeps focus there. */
  const shiftItem = (id: string, delta: -1 | 1) => {
    focusLater(`[data-handle-id="${id}"]`);
    onUpdate((latest) => {
      const list = latest.dropTargets ?? [];
      return {
        ...latest,
        dragDropItems: (latest.dragDropItems ?? []).map((item) => {
          const target = item.id === id ? list[list.findIndex((group) => group.id === item.correctTargetId) + delta] : undefined;
          return target ? { ...item, correctTargetId: target.id } : item;
        }),
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const item = items.find((i) => i.id === active.id);
    if (over && item && item.correctTargetId !== over.id) patchItem(item.id, (latest) => ({ ...latest, correctTargetId: String(over.id) }));
  };

  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>{HINT}</Box>
      <DndContext onDragEnd={onDragEnd} sensors={sensors}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1.25 }}>
          {groups.map((group, index) => (
            <ClassifyColumn
              group={group}
              items={items.filter((item) => item.correctTargetId === group.id)}
              key={group.id}
              n={index + 1}
              onAppend={() => appendItem(group.id)}
              onDelete={() => deleteGroup(index)}
              onDeleteItem={deleteItem}
              onPatchItem={patchItem}
              onRename={(label) => setGroups((list) => list.map((g) => (g.id === group.id ? { ...g, label } : g)))}
              onShiftItem={shiftItem}
            />
          ))}
          <ButtonBase
            onClick={appendGroup}
            sx={{
              minHeight: 120, gap: 0.5, typography: "body2", fontWeight: "fontWeightMedium", color: "primary.main",
              border: "1.5px dashed", borderColor: tokens.color.border, borderRadius: `${tokens.radius.card}px`,
            }}
          >
            <AddIcon fontSize="small" />
            Thêm nhóm
          </ButtonBase>
        </Box>
      </DndContext>
    </Box>
  );
}

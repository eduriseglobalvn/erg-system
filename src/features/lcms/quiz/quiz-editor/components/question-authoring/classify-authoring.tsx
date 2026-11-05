import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useRef } from "react";

import type { DragDropItem, DropTarget, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ClassifyColumn } from "./classify-column";
import { newRowId, usePendingFocus } from "./sortable-rows";

const HINT = "Gõ mục vào đúng cột của nó; kéo mục sang cột khác để đổi nhóm.";
const ADD_GROUP = "[data-add-group]";

/** Teacher view of classification (spec §7 Phân loại): each group is a column holding the items that belong in it. */
export function ClassifyAuthoring({ question, onUpdate }: {
  question: Question;
  /** Applies a change to the latest question, so edits made in quick succession never overwrite each other. */
  onUpdate: (change: (latest: Question) => Question) => void;
}) {
  const groups = question.dropTargets ?? [];
  const items = question.dragDropItems ?? [];
  const groupIds = new Set(groups.map((group) => group.id));
  // Old data can point an item at a group that is gone; "" is the "Chưa thuộc nhóm" column.
  const columnOf = (item: DragDropItem) => (groupIds.has(item.correctTargetId) ? item.correctTargetId : "");
  const unassigned = items.filter((item) => !columnOf(item));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { rootRef, focusLater } = usePendingFocus();
  const setGroups = (change: (list: DropTarget[]) => DropTarget[]) => onUpdate((latest) => ({ ...latest, dropTargets: change(latest.dropTargets ?? []) }));
  const setItems = (change: (list: DragDropItem[]) => DragDropItem[]) => onUpdate((latest) => ({ ...latest, dragDropItems: change(latest.dragDropItems ?? []) }));
  const patchItem = (id: string, change: (item: DragDropItem) => DragDropItem) => setItems((list) => list.map((item) => (item.id === id ? change(item) : item)));

  // The grip remounts in its new column; focus it once the move has rendered, however late the parent applies it.
  const movedGrip = useRef<{ id: string; to: string } | null>(null);
  useEffect(() => {
    const moved = movedGrip.current;
    if (!moved || !items.some((item) => item.id === moved.id && item.correctTargetId === moved.to)) return;
    movedGrip.current = null;
    rootRef.current?.querySelector<HTMLElement>(`[data-handle-id="${moved.id}"]`)?.focus();
  });

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
    focusLater(neighbour ? `[data-input-id="${neighbour.id}"]` : ADD_GROUP);
    setGroups((list) => list.filter((group) => group.id !== groups[index].id));
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const column = items.filter((i) => columnOf(i) === columnOf(item));
    const at = column.indexOf(item);
    const neighbour = column[at + 1] ?? column[at - 1];
    const fallback = columnOf(item) || groups[0]?.id;
    focusLater(neighbour ? `[data-input-id="${neighbour.id}"]` : fallback ? `[data-input-id="${fallback}"]` : ADD_GROUP);
    setItems((list) => list.filter((i) => i.id !== id));
  };

  /** Alt+arrow on the grip: one column left or right; "Chưa thuộc nhóm" sits before the first group. Stays put at the edges. */
  const shiftItem = (id: string, delta: -1 | 1) => {
    const item = items.find((i) => i.id === id);
    const to = item && groups[groups.findIndex((group) => group.id === item.correctTargetId) + delta];
    if (!to) return;
    movedGrip.current = { id, to: to.id };
    patchItem(id, (latest) => ({ ...latest, correctTargetId: to.id }));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const item = items.find((i) => i.id === active.id);
    if (over && item && item.correctTargetId !== over.id) patchItem(item.id, (latest) => ({ ...latest, correctTargetId: String(over.id) }));
  };

  const itemHandlers = { onDeleteItem: deleteItem, onPatchItem: patchItem, onShiftItem: shiftItem };
  return (
    <Box ref={rootRef} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ typography: "caption", color: "text.secondary" }}>{HINT}</Box>
      <DndContext onDragEnd={onDragEnd} sensors={sensors}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1.25 }}>
          {unassigned.length > 0 && <ClassifyColumn items={unassigned} n={0} {...itemHandlers} />}
          {groups.map((group, index) => (
            <ClassifyColumn
              group={group}
              items={items.filter((item) => item.correctTargetId === group.id)}
              key={group.id}
              n={index + 1}
              onAppend={() => appendItem(group.id)}
              onDelete={() => deleteGroup(index)}
              onRename={(label) => setGroups((list) => list.map((g) => (g.id === group.id ? { ...g, label } : g)))}
              {...itemHandlers}
            />
          ))}
          <ButtonBase
            data-add-group
            onClick={appendGroup}
            sx={{
              minHeight: 120, gap: 0.5, typography: "body2", fontWeight: "fontWeightMedium", color: "primary.main",
              border: "1.5px dashed", borderColor: tokens.color.border, borderRadius: `${tokens.radius.card}px`,
              "&.Mui-focusVisible": { borderColor: "primary.main", boxShadow: tokens.shadow.focus },
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

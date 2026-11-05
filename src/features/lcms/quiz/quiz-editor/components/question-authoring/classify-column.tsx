import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import type { DragDropItem, DropTarget } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { AnswerImage, type ImageChange } from "./answer-image";

type ItemHandlers = {
  onPatchItem: (id: string, change: (item: DragDropItem) => DragDropItem) => void;
  onDeleteItem: (id: string) => void;
  onShiftItem: (id: string, delta: -1 | 1) => void;
};

/** One group: its name, the items that belong in it, and "Thêm mục". The whole column is the drop target. */
export function ClassifyColumn({ group, n, items, onRename, onDelete, onAppend, ...handlers }: ItemHandlers & {
  group: DropTarget;
  /** 1-based column number. */
  n: number;
  /** The items whose correct group is this one, in array order. */
  items: DragDropItem[];
  onRename: (label: string) => void;
  onDelete: () => void;
  onAppend: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const holdsItems = items.length > 0;
  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex", flexDirection: "column", gap: 1, p: 1.25, minHeight: 120, minWidth: 0,
        border: "1.5px dashed", borderColor: isOver ? "primary.main" : tokens.color.border, borderRadius: `${tokens.radius.card}px`,
        bgcolor: isOver ? tokens.color.primarySofter : "transparent",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <InputBase
          fullWidth
          inputProps={{ "aria-label": `Tên nhóm ${n}`, "data-input-id": group.id }}
          onChange={(e) => onRename(e.target.value)}
          placeholder={`Nhóm ${n}`}
          sx={{ typography: "body2", fontWeight: "fontWeightBold" }}
          value={group.label}
        />
        <IconButton
          aria-label={`Xoá nhóm ${n}`}
          disabled={holdsItems}
          onClick={onDelete}
          size="small"
          title={holdsItems ? "Chuyển hoặc xoá các mục trước" : undefined}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {items.map((item, index) => (
        <ClassifyItemRow
          item={item}
          key={item.id}
          m={index + 1}
          n={n}
          onEnter={index === items.length - 1 ? onAppend : undefined}
          {...handlers}
        />
      ))}
      <Box>
        <Button onClick={onAppend} size="small" startIcon={<AddIcon />} variant="text">Thêm mục</Button>
      </Box>
    </Box>
  );
}

function ClassifyItemRow({ item, m, n, onEnter, onPatchItem, onDeleteItem, onShiftItem }: ItemHandlers & {
  item: DragDropItem;
  m: number;
  n: number;
  /** Set on the column's last item only: Enter there adds the next item. */
  onEnter?: () => void;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, isDragging } = useDraggable({ id: item.id });
  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      sx={{
        display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 0.5, p: 0.5, opacity: isDragging ? 0.6 : 1,
        bgcolor: "background.paper", border: "1px solid", borderColor: tokens.color.border, borderRadius: `${tokens.radius.sm}px`,
      }}
    >
      <IconButton
        aria-label={`Kéo mục ${m} sang nhóm khác, Alt+mũi tên trái/phải để chuyển`}
        data-handle-id={item.id}
        ref={setActivatorNodeRef}
        size="small"
        sx={{ cursor: "grab" }}
        {...attributes}
        {...listeners}
        onKeyDown={(e) => {
          if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
          e.preventDefault();
          onShiftItem(item.id, e.key === "ArrowLeft" ? -1 : 1);
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <InputBase
        fullWidth
        inputProps={{ "aria-label": `Mục ${m} nhóm ${n}`, "data-input-id": item.id }}
        onChange={(e) => { const label = e.target.value; onPatchItem(item.id, (latest) => ({ ...latest, label })); }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          if (onEnter && !e.repeat && item.label.trim()) onEnter();
        }}
        placeholder={`Mục ${m}`}
        sx={{ typography: "body2" }}
        value={item.label}
      />
      <AnswerImage
        image={item.image}
        name={`mục ${m} nhóm ${n}`}
        onChange={(change: ImageChange) => onPatchItem(item.id, (latest) => ({ ...latest, image: change(latest.image) }))}
      />
      <IconButton aria-label={`Xoá mục ${m} nhóm ${n}`} onClick={() => onDeleteItem(item.id)} size="small">
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

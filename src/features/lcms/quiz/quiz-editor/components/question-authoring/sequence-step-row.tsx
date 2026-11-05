import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRef } from "react";

import type { SequenceItem } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** One grid row: the fixed number (the correct position) on the left, the draggable step card on the right. */
export function SequenceStepRow(props: {
  item: SequenceItem;
  index: number;
  canDelete: boolean;
  autoFocus: boolean;
  onPatch: (patch: Partial<SequenceItem>) => void;
  onEnter: () => void;
  onDelete: () => void;
  onPickImage: (file: File) => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const { item, index } = props;
  const n = index + 1;
  const fileRef = useRef<HTMLInputElement>(null);
  const { setNodeRef: setDragRef, setActivatorNodeRef, attributes, listeners, transform, isDragging } = useDraggable({ id: item.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: item.id });

  return (
    <Box
      ref={setDropRef}
      sx={{
        display: "grid", gridTemplateColumns: "32px 1fr", alignItems: "start", gap: 1, p: 0.5, borderRadius: `${tokens.radius.card}px`,
        border: "1.5px dashed", borderColor: isOver ? "primary.main" : "transparent", bgcolor: isOver ? "primary.light" : "transparent",
      }}
    >
      <Box component="span" sx={{ typography: "body1", fontWeight: "fontWeightMedium", color: "text.secondary", pt: "10px", textAlign: "right" }}>{n}.</Box>
      <Box
        ref={setDragRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        sx={{
          display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 1, alignItems: "start", p: "6px 10px", opacity: isDragging ? 0.6 : 1, bgcolor: "background.paper",
          border: "1.5px solid", borderColor: tokens.color.border, borderRadius: `${tokens.radius.card}px`,
        }}
      >
        <IconButton
          aria-label={`Kéo để sắp xếp bước ${n}`}
          ref={setActivatorNodeRef}
          size="small"
          sx={{ cursor: "grab" }}
          {...attributes}
          {...listeners}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); props.onMove(e.key === "ArrowUp" ? -1 : 1); return; }
            listeners?.onKeyDown?.(e);
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
        <Box sx={{ minWidth: 0, pt: "4px" }}>
          <InputBase
            autoFocus={props.autoFocus}
            fullWidth
            inputProps={{ "aria-label": `Nội dung bước ${n}` }}
            onChange={(e) => props.onPatch({ label: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); if (!e.repeat) props.onEnter(); } }}
            placeholder={`Bước ${n}`}
            sx={{ typography: "body1" }}
            value={item.label}
          />
          {item.image && (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 1 }}>
              <Box alt={item.image.alt ?? ""} component="img" src={item.image.url} sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: tokens.color.border }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <InputBase
                  fullWidth
                  inputProps={{ "aria-label": `Mô tả ảnh bước ${n}` }}
                  onChange={(e) => props.onPatch({ image: { ...item.image!, alt: e.target.value } })}
                  placeholder="Mô tả ảnh"
                  sx={{ typography: "body2", borderBottom: "1px solid", borderColor: tokens.color.border }}
                  value={item.image.alt ?? ""}
                />
                <Button onClick={() => fileRef.current?.click()} size="small" variant="text">Đổi ảnh</Button>
                <Button color="error" onClick={() => props.onPatch({ image: undefined })} size="small" variant="text">Xoá ảnh</Button>
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!item.image && (
            <IconButton aria-label={`Thêm ảnh bước ${n}`} onClick={() => fileRef.current?.click()} size="small">
              <AddPhotoAlternateOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton aria-label={`Xoá bước ${n}`} disabled={!props.canDelete} onClick={props.onDelete} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <input
          accept="image/png,image/jpeg,image/gif,image/webp"
          aria-label={`Ảnh bước ${n}`}
          hidden
          onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) props.onPickImage(file); }}
          ref={fileRef}
          type="file"
        />
      </Box>
    </Box>
  );
}

import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useRef } from "react";

import type { Choice } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ChoiceMarker, choiceTileSx } from "./choice-tile";

export function ChoiceRow(props: {
  choice: Choice;
  index: number;
  canDelete: boolean;
  autoFocus: boolean;
  onPatch: (patch: Partial<Choice>) => void;
  onToggleCorrect: () => void;
  onEnter: () => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
  onPickImage: (file: File) => void;
}) {
  const { choice, index, canDelete } = props;
  const letter = String.fromCharCode(65 + (index % 26));
  const fileRef = useRef<HTMLInputElement>(null);
  const { setNodeRef: setDragRef, setActivatorNodeRef, attributes, listeners, transform, isDragging } = useDraggable({ id: choice.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: choice.id });
  const setRef = useCallback((node: HTMLElement | null) => { setDragRef(node); setDropRef(node); }, [setDragRef, setDropRef]);
  const ok = choice.correct;
  const n = index + 1;

  return (
    <Box
      ref={setRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      sx={{
        display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 1.5, alignItems: "start", p: "12px 14px", ...choiceTileSx(ok, isOver),
        opacity: isDragging ? 0.6 : 1,
        "&:hover .reveal, &:focus-within .reveal": { opacity: 1 },
      }}
    >
      <ChoiceMarker letter={letter} ok={ok} onClick={props.onToggleCorrect} />
      <Box sx={{ minWidth: 0 }}>
        <InputBase
          autoFocus={props.autoFocus}
          fullWidth
          inputProps={{ "aria-label": `Nội dung phương án ${n}`, "data-input-id": choice.id }}
          onChange={(e) => props.onPatch({ label: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); if (!e.repeat && choice.label.trim()) props.onEnter(); } }}
          placeholder={`Phương án ${n}`}
          sx={{ typography: "body1", fontWeight: "fontWeightMedium" }}
          value={choice.label}
        />
        {choice.image && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mt: 1 }}>
            <Box alt={choice.image.alt ?? ""} component="img" src={choice.image.url} sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: tokens.color.border }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <InputBase
                fullWidth
                inputProps={{ "aria-label": "Mô tả ảnh" }}
                onChange={(e) => props.onPatch({ image: { ...choice.image!, alt: e.target.value } })}
                placeholder="Mô tả ảnh"
                sx={{ typography: "body2", borderBottom: "1px solid", borderColor: tokens.color.border }}
                value={choice.image.alt ?? ""}
              />
              <Button onClick={() => fileRef.current?.click()} size="small" variant="text">Đổi ảnh</Button>
              <Button color="error" onClick={() => props.onPatch({ image: undefined })} size="small" variant="text">Xoá ảnh</Button>
            </Box>
          </Box>
        )}
      </Box>
      <Box className="reveal" sx={{ display: "flex", alignItems: "center", opacity: 0, transition: `opacity ${tokens.motion.duration.fast}ms`, "@media (hover: none)": { opacity: 1 } }}>
        <IconButton
          aria-label={`Kéo để sắp xếp phương án ${n}, Alt+mũi tên để di chuyển`}
          data-handle-id={choice.id}
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
        {!choice.image && (
          <IconButton aria-label={`Thêm ảnh phương án ${n}`} onClick={() => fileRef.current?.click()} size="small">
            <AddPhotoAlternateOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton aria-label={`Xoá phương án ${n}`} disabled={!canDelete} onClick={props.onDelete} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <input
        accept="image/png,image/jpeg,image/gif,image/webp"
        aria-label={`Ảnh phương án ${n}`}
        hidden
        onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) props.onPickImage(file); }}
        ref={fileRef}
        type="file"
      />
    </Box>
  );
}

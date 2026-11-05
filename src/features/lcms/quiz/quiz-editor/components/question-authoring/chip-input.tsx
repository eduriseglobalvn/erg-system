import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import { useState } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

export type ChipItem = {
  key: string;
  label: string;
  tone: "correct" | "plain";
  shape?: "pill" | "word";
  pressed?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
};

const chipSx = ({ tone, shape }: ChipItem) => ({
  height: 28,
  ...(tone === "correct"
    ? { bgcolor: tokens.statusTint.success.bg, color: "success.main" }
    : { bgcolor: "background.paper", border: "1px solid", borderColor: tokens.color.border }),
  ...(shape === "word"
    ? { borderRadius: "8px", boxShadow: `0 1px 0 ${tokens.color.border}` }
    : { borderRadius: `${tokens.radius.chip}px` }),
});

export function ChipInput({ items, onAdd, inputLabel, placeholder }: {
  items: ChipItem[];
  onAdd: (text: string) => void;
  inputLabel: string;
  placeholder: string;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const next = text.trim();
    if (!next || items.some((item) => item.label.trim() === next)) return;
    onAdd(next);
    setText("");
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
      {items.map((item) => (
        <Chip
          aria-pressed={item.onToggle ? Boolean(item.pressed) : undefined}
          deleteIcon={item.onRemove ? <CloseIcon aria-label={`Xoá “${item.label}”`} /> : undefined}
          icon={item.onToggle && item.pressed ? <CheckIcon /> : undefined}
          key={item.key}
          label={item.label}
          onClick={item.onToggle}
          onDelete={item.onRemove}
          sx={chipSx(item)}
        />
      ))}
      <Box sx={{ display: "flex", alignItems: "center", height: 28, px: 1.25, border: "1px dashed", borderColor: tokens.color.borderStrong, borderRadius: `${tokens.radius.chip}px` }}>
        <InputBase
          inputProps={{ "aria-label": inputLabel }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
            e.preventDefault();
            add();
          }}
          placeholder={placeholder}
          sx={{ typography: "body2" }}
          value={text}
        />
      </Box>
    </Box>
  );
}

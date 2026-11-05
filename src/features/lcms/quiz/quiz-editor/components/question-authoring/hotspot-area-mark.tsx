import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { KeyboardEvent } from "react";

import type { HotspotArea } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

const pct = (value: number) => `${value * 100}%`;

type MarkProps = {
  area: HotspotArea;
  n: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onClearSelection: () => void;
};

/** One area drawn over the hotspot image: green solid when correct, red dashed when a distractor. */
export function HotspotAreaMark({ area, n, selected, onSelect, onRemove, onClearSelection }: MarkProps) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") onClearSelection();
    else if (selected && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      onRemove();
    }
  };
  return (
    <ButtonBase
      aria-label={`Vùng ${n} · ${area.correct ? "Đúng" : "Nhiễu"}`}
      aria-pressed={selected}
      data-area-id={area.id}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      sx={{
        position: "absolute", left: pct(area.x), top: pct(area.y), width: pct(area.width), height: pct(area.height),
        // Square corners: the grader counts the whole rectangle.
        borderRadius: area.shape === "ellipse" ? "50%" : 0, cursor: "pointer",
        border: area.correct ? "2px solid" : "2px dashed",
        borderColor: area.correct ? "success.main" : "error.main",
        bgcolor: area.correct ? tokens.color.successSoft : tokens.color.dangerSoft,
        ...(selected ? { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } : null),
      }}
    >
      {area.correct ? <Typography color="success.main" variant="caption">✓</Typography> : null}
    </ButtonBase>
  );
}

type ToolbarProps = {
  area: HotspotArea;
  n: number;
  onCorrectChange: (correct: boolean) => void;
  onRemove: () => void;
};

/** Sits under the selected area, or above it near the bottom edge of the image. */
export function HotspotAreaToolbar({ area, n, onCorrectChange, onRemove }: ToolbarProps) {
  const above = area.y + area.height > 0.85;
  return (
    <Box
      aria-label={`Vùng ${n}`}
      role="toolbar"
      sx={{
        position: "absolute", left: pct(area.x), zIndex: 1, cursor: "default", display: "flex", alignItems: "center", gap: 0.5,
        ...(above ? { top: `calc(${pct(area.y)} - 4px)`, transform: "translateY(-100%)" } : { top: `calc(${pct(area.y + area.height)} + 4px)` }),
        bgcolor: "background.paper", boxShadow: tokens.shadow.float, borderRadius: `${tokens.radius.control}px`, p: 0.375,
      }}
    >
      <ToggleButtonGroup
        aria-label="Loại vùng"
        exclusive
        onChange={(_, value: string | null) => { if (value) onCorrectChange(value === "correct"); }}
        size="small"
        value={area.correct ? "correct" : "distractor"}
      >
        <ToggleButton value="correct">Đúng</ToggleButton>
        <ToggleButton value="distractor">Nhiễu</ToggleButton>
      </ToggleButtonGroup>
      <IconButton aria-label="Xoá vùng" onClick={onRemove} size="small">
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

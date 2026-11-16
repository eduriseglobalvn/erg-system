import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import type { CellState, GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleCellSx, scheduleTokens } from "../shared/schedule-cell-sx";
import { teacherTone } from "../shared/teacher-tone";

type Props = {
  active: boolean;
  cellId: string;
  holiday?: string;
  /** Tiet chua co gio (5, 10) hoac ngay le: khong xep duoc. */
  off: boolean;
  onActivate: (key: string) => void;
  onOpen: (key: string, element: HTMLElement) => void;
  row?: GridRow;
  state?: CellState;
  /** Ten khong khop khi dan tu Excel. */
  unknownName?: string;
};

const { color, type } = ergEnterpriseTokens;

/** O luoi theo board AdminCreate: nen theo giao vien, hang 1 = lop + phong, hang 2 = giao vien (+ TG), o trung = nen do. */
export const ScheduleCell = memo(function ScheduleCell({ active, cellId, holiday, off, onActivate, onOpen, row, state, unknownName }: Props) {
  const drag = useDraggable({ disabled: off || !row, id: cellId });
  const drop = useDroppable({ disabled: off, id: cellId });
  const clash = state === "clash";
  const travel = state === "travel";
  const tone = teacherTone(row?.teacherId);
  const assistant = row?.assistantName ? `+ TG ${row.assistantName}` : "";
  const fill = off
    ? scheduleCellSx("off")
    : clash ? scheduleCellSx("clash")
      : travel ? scheduleCellSx("travel")
        : row ? { backgroundColor: row.teacherId ? tone.background : scheduleTokens.surface, color: tone.text }
          : { backgroundColor: scheduleTokens.surface, "&:hover": { backgroundColor: "action.hover" } };
  const label = [row?.className, row?.roomName ?? row?.newRoomName, [row?.teacherName, assistant].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const teacherColor = clash || travel ? scheduleTokens.clash.text : tone.text;

  return (
    <div
      aria-label={off ? undefined : row ? label : "Ô trống"}
      aria-selected={active}
      data-cell={cellId}
      onClick={(event) => { onActivate(cellId); if (!off) onOpen(cellId, event.currentTarget); }}
      ref={(node) => { drag.setNodeRef(node); drop.setNodeRef(node); }}
      {...(off ? {} : { ...drag.attributes, ...drag.listeners })}
      tabIndex={active ? 0 : -1}
      role="gridcell"
      style={{ minWidth: 0, opacity: drag.isDragging ? 0.4 : 1 }}
    >
      <Typography
        component="div"
        sx={[
          { borderLeft: `1px solid ${color.divider}`, cursor: off ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", gap: "2px", height: "100%", justifyContent: "center", minWidth: 0, px: 1, py: "5px", typography: "caption" },
          fill,
          active && ((theme: Theme) => ({ backgroundColor: scheduleTokens.surface, boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}` })),
          drop.isOver && !off && ((theme: Theme) => ({ outline: `2px dashed ${theme.palette.primary.main}` })),
          unknownName && { boxShadow: `inset 0 0 0 1.5px ${scheduleTokens.clash.edge}` },
        ] as never}
        title={off && !holiday ? "Tiết này chưa có giờ" : undefined}
      >
        {off ? <span>{holiday ?? ""}</span> : unknownName ? <span>{unknownName}</span> : row ? (
          <>
            <Box sx={{ display: "flex", gap: 0.5, justifyContent: "space-between" }}>
              <Box component="strong" sx={{ color: color.text, ...type.smallStrong }}>{clash || travel ? "⚠ " : ""}{row.className}</Box>
              <Box component="span" sx={{ color: clash ? scheduleTokens.clash.text : color.textMuted, ...type.micro }}>{row.roomName ?? row.newRoomName ?? ""}</Box>
            </Box>
            <Box sx={{ color: teacherColor, ...(clash ? type.label : type.noteMedium) }}>
              {row.teacherName ?? ""}{row.teacherName && assistant ? " " : ""}<Box component="span" sx={{ color: color.textMuted, fontWeight: type.note.fontWeight }}>{assistant}</Box>
            </Box>
          </>
        ) : null}
      </Typography>
    </div>
  );
});

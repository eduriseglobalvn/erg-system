import { memo } from "react";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { useDraggable, useDroppable } from "@dnd-kit/core";

import type { CellState, GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { scheduleCellSx, scheduleTokens } from "../shared/schedule-cell-sx";

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

export const ScheduleCell = memo(function ScheduleCell({ active, cellId, holiday, off, onActivate, onOpen, row, state, unknownName }: Props) {
  const drag = useDraggable({ disabled: off || !row, id: cellId });
  const drop = useDroppable({ disabled: off, id: cellId });
  const kind = off ? "off" : state === "clash" ? "clash" : state === "travel" ? "travel" : row ? "draft" : null;
  const clashMark = state === "clash" || state === "travel" ? "⚠ " : "";
  const teacher = row?.teacherName ? `${row.teacherName}${row.assistantName ? ` + TG ${row.assistantName}` : ""}` : row?.assistantName ? `TG ${row.assistantName}` : "";

  return (
    <div
      aria-label={off ? undefined : row ? [row.className, row.roomName ?? row.newRoomName, teacher].filter(Boolean).join(", ") : "Ô trống"}
      aria-selected={active}
      data-cell={cellId}
      onClick={(event) => { onActivate(cellId); if (!off) onOpen(cellId, event.currentTarget); }}
      ref={(node) => { drag.setNodeRef(node); drop.setNodeRef(node); }}
      {...(off ? {} : { ...drag.attributes, ...drag.listeners })}
      tabIndex={active ? 0 : -1}
      role="gridcell"
      style={{ opacity: drag.isDragging ? 0.4 : 1 }}
    >
      <Typography
        component="div"
        sx={[
          { borderRadius: "6px", cursor: off ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", gap: 0.25, height: "100%", justifyContent: "center", minHeight: 64, p: 0.75, typography: "caption" },
          kind ? scheduleCellSx(kind) : { backgroundColor: scheduleTokens.surface, "&:hover": { backgroundColor: "action.hover" } },
          active && ((theme: Theme) => ({ boxShadow: `0 0 0 2px ${theme.palette.primary.main}` })),
          drop.isOver && !off && ((theme: Theme) => ({ outline: `2px dashed ${theme.palette.primary.main}` })),
          unknownName && { boxShadow: `inset 0 0 0 1.5px ${scheduleTokens.clash.edge}` },
        ] as never}
        title={off && !holiday ? "Tiết này chưa có giờ" : undefined}
      >
        {off ? <span>{holiday ?? "trống giờ"}</span> : unknownName ? <span>{unknownName}</span> : row ? (
          <>
            <strong>{clashMark}{row.className}</strong>
            <span>{row.roomName ?? row.newRoomName ?? ""}</span>
            <span>{teacher}</span>
          </>
        ) : null}
      </Typography>
    </div>
  );
});

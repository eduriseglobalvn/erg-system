import { type PointerEvent as ReactPointerEvent, type ReactNode, useId, useRef } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

/** Pulled this far (px), or flicked this fast (px/ms), the sheet closes; otherwise it springs back. */
const DISMISS_DISTANCE = 96;
const DISMISS_VELOCITY = 0.6;

export function MobileBottomSheet({
  children,
  description,
  header,
  open,
  title,
  onOpenChange,
}: {
  children: ReactNode;
  description?: ReactNode;
  /** Replaces the title block (the title still names the dialog for assistive tech). */
  header?: ReactNode;
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const paperRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ startY: number; startAt: number; offset: number } | null>(null);

  function onDragStart(event: ReactPointerEvent<HTMLElement>) {
    if ((event.target as Element).closest("button")) return;
    drag.current = { startY: event.clientY, startAt: event.timeStamp, offset: 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (paperRef.current) paperRef.current.style.transition = "none";
  }
  function onDragMove(event: ReactPointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || !paperRef.current) return;
    current.offset = Math.max(0, event.clientY - current.startY);
    paperRef.current.style.transform = `translateY(${current.offset}px)`;
  }
  function onDragEnd(event: ReactPointerEvent<HTMLElement>) {
    const current = drag.current;
    drag.current = null;
    const paper = paperRef.current;
    if (!current || !paper) return;
    const velocity = current.offset / Math.max(1, event.timeStamp - current.startAt);
    if (current.offset > DISMISS_DISTANCE || (current.offset > 24 && velocity > DISMISS_VELOCITY)) {
      paper.style.transition = "";
      onOpenChange(false);
      return;
    }
    paper.style.transition = "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)";
    paper.style.transform = "";
  }
  const dragZone = { onPointerCancel: onDragEnd, onPointerDown: onDragStart, onPointerMove: onDragMove, onPointerUp: onDragEnd };

  return (
    <Drawer
      anchor="bottom"
      onClose={() => onOpenChange(false)}
      open={open}
      slotProps={{
        backdrop: { sx: { backdropFilter: "blur(2px)", bgcolor: "rgba(15,23,42,0.45)" } },
        paper: {
          ref: paperRef,
          "aria-describedby": description && !header ? descriptionId : undefined,
          "aria-label": header ? title : undefined,
          "aria-labelledby": header ? undefined : titleId,
          role: "dialog",
          sx: {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px 24px 0 0",
            display: { xs: "flex", xl: "none" },
            // vh first: Safari 15 (iPhone 7) has no dvh.
            maxHeight: "88vh",
            "@supports (height: 1dvh)": { maxHeight: "88dvh" },
            overflow: "hidden",
            pb: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          },
        },
      }}
    >
      {/* Handle + title row are the drag zone; touch-action none stops the browser scrolling instead. */}
      <Box {...dragZone} sx={{ cursor: "grab", pb: 0.5, pt: 1.5, touchAction: "none" }}>
        <Box sx={{ bgcolor: "text.disabled", borderRadius: 4, height: 6, mx: "auto", opacity: 0.45, width: 48 }} />
      </Box>
      <Stack {...dragZone} direction="row" spacing={1.5} sx={{ alignItems: "flex-start", justifyContent: "space-between", minHeight: 64, px: 2, py: 1.5, touchAction: "none" }}>
        {header ?? (
          <Box sx={{ minWidth: 0 }}>
            <Typography id={titleId} noWrap variant="h4">{title}</Typography>
            {description ? <Typography color="text.secondary" component="div" id={descriptionId} sx={{ mt: 0.25 }} variant="caption">{description}</Typography> : null}
          </Box>
        )}
        <IconButton aria-label="Đóng" onClick={() => onOpenChange(false)} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      <Divider />
      <Box sx={{ bgcolor: "background.default", maxHeight: "calc(88vh - 82px)", overflowY: "auto", "@supports (height: 1dvh)": { maxHeight: "calc(88dvh - 82px)" }, px: 2, py: 1.5 }}>
        {children}
      </Box>
    </Drawer>
  );
}

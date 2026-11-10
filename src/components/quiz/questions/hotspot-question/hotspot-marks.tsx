import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import Box from "@mui/material/Box";
import { useRef } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/**
 * The learner's point: a filled pin whose tip sits on the picked spot. With `onMove` the pin can be dragged to a new
 * spot (mouse or finger); `onMove` gets the client position of the tip, so grabbing the pin's head does not jump it.
 */
export function HotspotMarker({ x, y, onMove }: { x: number; y: number; onMove?: (clientX: number, clientY: number) => void }) {
  const grab = useRef<{ dx: number; dy: number } | null>(null);
  const movable = Boolean(onMove);
  return (
    <Box
      component="span"
      data-testid="hotspot-marker"
      aria-hidden
      onPointerDown={movable ? (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        grab.current = { dx: rect.left + rect.width / 2 - event.clientX, dy: rect.bottom - event.clientY };
        event.currentTarget.setPointerCapture?.(event.pointerId);
      } : undefined}
      onPointerMove={movable ? (event) => {
        if (!grab.current) return;
        onMove?.(event.clientX + grab.current.dx, event.clientY + grab.current.dy);
      } : undefined}
      onPointerUp={movable ? () => { grab.current = null; } : undefined}
      onPointerCancel={movable ? () => { grab.current = null; } : undefined}
      // The pin sits on the image, whose click/tap places a point; a click on the pin itself must not move it.
      onClick={movable ? (event) => event.stopPropagation() : undefined}
      // Keeps the zoomed editor from panning while the pin is dragged.
      onTouchStart={movable ? (event) => event.stopPropagation() : undefined}
      sx={(theme) => ({
        color: `var(--quiz-accent, ${theme.palette.primary.main})`,
        display: "inline-flex",
        left: `${x * 100}%`,
        pointerEvents: movable ? "auto" : "none",
        position: "absolute",
        top: `${y * 100}%`,
        transform: "translate(-50%, -100%)",
        filter: `drop-shadow(0 1px 1px ${tokens.color.borderStrong})`,
        ...(movable ? { cursor: "grab", touchAction: "none", "&:active": { cursor: "grabbing" } } : null),
      })}
    >
      <LocationOnRoundedIcon aria-hidden fontSize="large" />
    </Box>
  );
}

export function HotspotReviewArea({
  area,
}: {
  area: {
    shape: "rect" | "ellipse" | "polygon";
    x: number;
    y: number;
    width: number;
    height: number;
  };
}) {
  return (
    <Box
      data-testid="hotspot-review-area"
      sx={{
        bgcolor: tokens.color.successSoft,
        border: "2px dashed",
        borderColor: "success.main",
        borderRadius: area.shape === "ellipse" ? `${tokens.radius.chip}px` : `${tokens.radius.sm}px`,
        height: `${area.height * 100}%`,
        left: `${area.x * 100}%`,
        pointerEvents: "none",
        position: "absolute",
        top: `${area.y * 100}%`,
        width: `${area.width * 100}%`,
      }}
    />
  );
}

import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import Box from "@mui/material/Box";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** The learner's point: a filled pin whose tip sits on the picked spot. */
export function HotspotMarker({ x, y }: { x: number; y: number }) {
  return (
    <Box
      component="span"
      data-testid="hotspot-marker"
      sx={(theme) => ({
        color: `var(--quiz-accent, ${theme.palette.primary.main})`,
        display: "inline-flex",
        left: `${x * 100}%`,
        pointerEvents: "none",
        position: "absolute",
        top: `${y * 100}%`,
        transform: "translate(-50%, -100%)",
        filter: `drop-shadow(0 1px 1px ${tokens.color.borderStrong})`,
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

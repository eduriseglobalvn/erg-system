import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type ErgChartTrendDirection = "down" | "flat" | "up";

export function ErgChartInsight({ direction = "flat", primary, secondary }: {
  direction?: ErgChartTrendDirection;
  primary: string;
  secondary?: string;
}) {
  const TrendIcon = direction === "up" ? TrendingUpRoundedIcon : direction === "down" ? TrendingDownRoundedIcon : TrendingFlatRoundedIcon;
  return <Box sx={{ minWidth: 0 }}>
    <Box sx={{ alignItems: "center", display: "flex", gap: 0.65 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{primary}</Typography>
      <TrendIcon aria-hidden sx={{ color: direction === "down" ? "error.main" : direction === "up" ? "success.main" : "text.secondary", fontSize: 17 }} />
    </Box>
    {secondary ? <Typography color="text.secondary" sx={{ display: "block", fontSize: 12.5, lineHeight: 1.45, mt: 0.25 }}>{secondary}</Typography> : null}
  </Box>;
}

export function ErgChartCard({ action, bodySx, children, description, footer, hideFooter = false, minHeight = 360, onOpen, rail, title }: {
  action?: ReactNode;
  bodySx?: object;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  hideFooter?: boolean;
  minHeight?: number;
  onOpen: () => void;
  rail?: ReactNode;
  title: string;
}) {
  return <Paper
    component="section"
    variant="outlined"
    sx={{
      bgcolor: "background.paper",
      borderColor: "divider",
      borderRadius: "12px",
      boxShadow: "none",
      display: "flex",
      flexDirection: "column",
      minHeight,
      overflow: "hidden",
    }}
  >
    <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, borderBottom: "1px solid", borderColor: "divider", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 2.5 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" sx={{ fontSize: 16, fontWeight: 750, letterSpacing: "-0.01em", lineHeight: 1.35 }}>{title}</Typography>
        {description ? <Typography color="text.secondary" sx={{ fontSize: 13, lineHeight: 1.45, mt: 0.35 }}>{description}</Typography> : null}
      </Box>
      {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
    </Box>
    {rail ? <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>{rail}</Box> : null}
    <Box sx={{ flex: 1, minHeight: 250, px: { xs: 1, sm: 3 }, pb: 0.5, pt: { xs: 2, sm: 3 }, ...bodySx }}>{children}</Box>
    {hideFooter ? null : <Box sx={{ alignItems: { xs: "stretch", sm: "center" }, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1, justifyContent: "space-between", minHeight: 64, px: { xs: 2, sm: 3 }, pb: 2.5, pt: 1.5 }}>
      {footer ?? <Box />}
      <Button endIcon={<ArrowForwardRoundedIcon />} onClick={onOpen} size="small" variant="text" sx={{ alignSelf: { xs: "flex-start", sm: "center" }, bgcolor: "transparent !important", color: "text.secondary", flexShrink: 0, minHeight: 32, px: 1, "&:hover": { bgcolor: "action.hover !important", color: "text.primary" } }}>Xem chi tiết</Button>
    </Box>}
  </Paper>;
}

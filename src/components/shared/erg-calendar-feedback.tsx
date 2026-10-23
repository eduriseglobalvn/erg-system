import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export function CalendarErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Box role="alert" sx={{ alignItems: "center", backgroundColor: "#FFF7ED", border: "1px solid rgba(255,171,0,0.28)", borderRadius: "12px", color: "#7A4100", display: "flex", gap: 1, justifyContent: "space-between", px: 1.35, py: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 750 }}>{message}</Typography>
      {onRetry ? <Button onClick={onRetry} sx={{ color: "#7A4100", fontSize: 12.5, fontWeight: 850, minHeight: 44, textTransform: "none" }}>Tải lại</Button> : null}
    </Box>
  );
}

export function CalendarLoadingOverlay() {
  return (
    <Box aria-live="polite" role="status" sx={{ bottom: 10, pointerEvents: "none", position: "fixed", right: 18, zIndex: 15 }}>
      <Box sx={{ backgroundColor: "rgba(28,37,46,0.82)", borderRadius: "999px", color: "#FFFFFF", fontSize: 12.5, fontWeight: 800, px: 1.45, py: 0.8 }}>
        Đang tải lịch...
      </Box>
    </Box>
  );
}

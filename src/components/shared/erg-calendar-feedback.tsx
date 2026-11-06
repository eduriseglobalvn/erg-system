import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import Typography from "@mui/material/Typography";

export function CalendarErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Box role="alert" sx={{ alignItems: "center", backgroundColor: "#FFF7ED", border: "1px solid rgba(255,171,0,0.28)", borderRadius: "12px", color: "#7A4100", display: "flex", gap: 1, justifyContent: "space-between", px: 1.35, py: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{message}</Typography>
      {onRetry ? <Button variant="contained" onClick={onRetry} sx={{ color: "#7A4100", fontSize: 12.5, fontWeight: 850, minHeight: 44, textTransform: "none" }}>Tải lại</Button> : null}
    </Box>
  );
}

/** Inline (in-flow) loading hint: never fixed over content, disappears with isLoading. */
export function CalendarLoadingOverlay() {
  return (
    <Box aria-label="Đang tải lịch" aria-live="polite" role="status">
      <ErgSkeleton height={6} />
    </Box>
  );
}

import TimerOffRoundedIcon from "@mui/icons-material/TimerOffRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type TimeUpOverlayPhase = "idle" | "submitting" | "waiting-network" | "failed";

const COPY: Record<Exclude<TimeUpOverlayPhase, "idle">, string> = {
  submitting: "Hết giờ, đang nộp bài…",
  "waiting-network": "Đã hết giờ — bài sẽ được nộp khi có mạng",
  failed: "Hết giờ nhưng chưa nộp được bài. Vui lòng thử lại.",
};

/** L06. Non-dismissible: no onClose, Escape disabled. */
export function TimeUpOverlay({ phase, onRetry }: { phase: TimeUpOverlayPhase; onRetry: () => void }) {
  if (phase === "idle") return null;
  return (
    <Dialog
      open
      aria-labelledby="time-up-title"
      role="alertdialog"
      slotProps={{
        backdrop: { sx: { bgcolor: alpha(tk.color.surface, 0.86) } },
        paper: { sx: { border: `1px solid ${tk.color.border}`, borderRadius: `${tk.radius.shell}px`, boxShadow: tk.shadow.float, m: 2, width: "calc(100% - 32px)", maxWidth: 420 } },
      }}
    >
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "grid", gap: 2, justifyItems: "center", textAlign: "center" }}>
          <Box aria-hidden sx={{ bgcolor: tk.statusTint.error.bg, borderRadius: "50%", color: tk.color.danger, display: "grid", height: 72, placeItems: "center", width: 72 }}>
            <TimerOffRoundedIcon fontSize="large" />
          </Box>
          <Box sx={{ display: "grid", gap: 0.5 }}>
            <Typography component="h1" id="time-up-title" sx={{ color: tk.color.text }} variant="h1">Hết giờ</Typography>
            <Typography aria-live="assertive" component="p" role="status" sx={{ color: tk.color.textSecondary }} variant="body2">{COPY[phase]}</Typography>
          </Box>
          {phase === "failed" ? <Button fullWidth size="large" sx={{ minHeight: 52 }} variant="contained" onClick={onRetry}>Thử nộp lại</Button> : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

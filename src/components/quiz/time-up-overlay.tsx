import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";

export type TimeUpOverlayPhase = "idle" | "submitting" | "waiting-network" | "failed";

const COPY: Record<Exclude<TimeUpOverlayPhase, "idle">, string> = {
  submitting: "Hết giờ, đang nộp bài…",
  "waiting-network": "Đã hết giờ — bài sẽ được nộp khi có mạng",
  failed: "Hết giờ nhưng chưa nộp được bài. Vui lòng thử lại.",
};

/** Non-dismissible: no onClose, Escape disabled. */
export function TimeUpOverlay({ phase, onRetry }: { phase: TimeUpOverlayPhase; onRetry: () => void }) {
  if (phase === "idle") return null;
  return (
    <Dialog open aria-label="Hết giờ" role="alertdialog">
      <DialogContent>
        <Box sx={{ display: "grid", gap: 2, justifyItems: "center", textAlign: "center" }}>
          <Typography role="status" aria-live="assertive" variant="h6" component="p">{COPY[phase]}</Typography>
          {phase === "failed" ? <Button variant="contained" onClick={onRetry}>Thử nộp lại</Button> : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

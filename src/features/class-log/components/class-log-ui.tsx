import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { classLogText } from "../domain/class-log-copy";

/** Status pill of a period: green once confirmed ("muộn" when it was after the day), blue while waiting. */
export function ConfirmPill({ confirmed, late }: { confirmed: boolean; late: boolean }) {
  const tone = confirmed ? t.statusTint.success : t.statusTint.info;
  return (
    <Box
      component="span"
      sx={{
        alignItems: "center", bgcolor: tone.bg, borderRadius: `${t.radius.chip}px`, color: tone.color, display: "inline-flex",
        ...t.type.label, height: 24, px: 1.25, whiteSpace: "nowrap",
      }}
    >
      {confirmed ? `${classLogText.confirmed}${late ? " · muộn" : ""}` : classLogText.pending}
    </Box>
  );
}

/** "Chậm N tiết so với PPCT" line under the lesson title. */
export function LagNote({ text }: { text: string }) {
  return <Typography sx={{ color: t.statusTint.warning.color, fontSize: t.type.label.fontSize }}>{text}</Typography>;
}

/** The table header cell look of the boards: grey caps-free label on the muted fill. */
export const headCellSx = { bgcolor: t.color.surfaceMuted, color: t.color.textMuted, ...t.type.label, py: 1.25, px: 1.5 } as const;
export const bodyCellSx = { fontSize: t.type.small.fontSize, height: 44, py: 0, px: 1.5, borderBottom: `1px solid ${t.color.divider}` } as const;

type PanelStateProps = { isPending: boolean; isError: boolean; onRetry: () => void; children: ReactNode };

/** Loading / error wrapper shared by the three tabs: skeleton inside the shell, never a page spinner. */
export function PanelState({ isPending, isError, onRetry, children }: PanelStateProps) {
  if (isPending) return <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={6} /></Box>;
  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <ErgErrorState action={<ErgButton onClick={onRetry} variant="outlined">{classLogText.retry}</ErgButton>} description={classLogText.loadError} title={classLogText.title} />
      </Box>
    );
  }
  return <>{children}</>;
}

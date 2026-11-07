import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { PunchCard } from "./punch-card";
import type { CheckRow } from "./punch-checks";

const ICON = {
  ok: <CheckCircleIcon color="success" fontSize="small" />,
  pending: <HourglassEmptyIcon color="warning" fontSize="small" />,
  fail: <ErrorIcon color="error" fontSize="small" />,
} as const;

export function PunchChecksList({ rows }: { rows: CheckRow[] }) {
  return (
    <PunchCard component="ul" sx={{ display: "grid", gap: 1.5, listStyle: "none", m: 0 }}>
      {rows.map((row) => (
        <Box component="li" data-state={row.state} key={row.id} sx={{ alignItems: "flex-start", display: "flex", gap: 1.5 }}>
          {ICON[row.state]}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{row.title}</Typography>
            <Typography color="text.secondary" variant="body2">{row.detail}</Typography>
          </Box>
        </Box>
      ))}
    </PunchCard>
  );
}

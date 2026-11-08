import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { CardRow, PunchCard } from "./punch-card";
import type { CheckRow } from "./punch-checks";

const ICON = {
  ok: <CheckCircleIcon color="success" titleAccess="Đạt" />,
  pending: <HourglassTopIcon color="primary" titleAccess="Đang chờ" />,
  fail: <ErrorIcon color="error" titleAccess="Lỗi" />,
} as const;

export function PunchChecksList({ rows }: { rows: CheckRow[] }) {
  return (
    <PunchCard aria-live="polite" component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {rows.map((row) => (
        <CardRow component="li" data-state={row.state} key={row.id} sx={{ minHeight: 54 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
            {ICON[row.state]}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2">{row.title}</Typography>
              <Typography color="text.secondary" variant="caption">{row.detail}</Typography>
            </Box>
          </Box>
        </CardRow>
      ))}
    </PunchCard>
  );
}

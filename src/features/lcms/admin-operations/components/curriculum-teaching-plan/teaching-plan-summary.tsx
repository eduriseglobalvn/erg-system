import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

import type { EditableCurriculumRow } from "./types";

export function TeachingPlanSummary({
  rows,
  totalSessions,
}: {
  rows: EditableCurriculumRow[];
  totalSessions: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 1.5,
        px: 2,
        py: 1,
        borderRadius: 1.5,
        bgcolor: "#F4F7FB",
        border: "1px solid #D9E2EF",
      }}
    >
      {rows.some((r) => r.isNew) ? (
        <Chip
          size="small"
          label={`${rows.filter((r) => r.isNew).length} tiết mới chưa lưu`}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
          }}
        />
      ) : null}
      <Typography sx={{ fontSize: 13, color: "#52606D" }}>
        Số bài: <strong style={{ color: "#172033" }}>{rows.length}</strong> bài
      </Typography>
      <Box sx={{ width: 1, height: 16, bgcolor: "#D9E2EF" }} />
      <Typography sx={{ fontSize: 13, color: "#52606D" }}>
        Tổng thời lượng: <strong style={{ color: "#0F6CBD" }}>{totalSessions} tiết</strong>
      </Typography>
    </Box>
  );
}

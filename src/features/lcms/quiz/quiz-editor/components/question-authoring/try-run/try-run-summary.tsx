import { useState } from "react";
import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import type { TryRunSummary } from "./try-run-model";

type Filter = "all" | "right" | "wrong";
const cardSx = { border: 1, borderColor: "divider", borderRadius: "20px", p: 3 } as const;
const R = 70;
const CIRC = 2 * Math.PI * R;

export function TryRunSummaryView({ summary, onRestart }: { summary: TryRunSummary; onRestart: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const graded = summary.rows.filter((r) => r.graded);
  const count = {
    all: summary.rows.length,
    right: graded.filter((r) => r.correct).length,
    wrong: graded.filter((r) => !r.correct).length,
  };
  const rows = summary.rows.filter((r) => filter === "all" || (r.graded && r.correct === (filter === "right")));

  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 2.5 }}>
      <Box sx={{ ...cardSx, flex: "0 1 400px", textAlign: "center" }}>
        <Box aria-hidden component="svg" height={168} viewBox="0 0 168 168" width={168}>
          <Box component="circle" cx={84} cy={84} r={R} sx={{ fill: "none", stroke: "divider", strokeWidth: 14 }} />
          <Box
            component="circle"
            cx={84}
            cy={84}
            r={R}
            strokeDasharray={`${(CIRC * summary.percent) / 100} ${CIRC}`}
            sx={{ fill: "none", stroke: (t) => t.palette.success.main, strokeLinecap: "round", strokeWidth: 14 }}
            transform="rotate(-90 84 84)"
          />
        </Box>
        <Typography sx={{ fontWeight: "fontWeightBold" }} variant="h4">{`${summary.correct}/${summary.total}`}</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{`${summary.percent}%`}</Typography>
        <ErgButton fullWidth onClick={onRestart} variant="contained">
          Làm lại
        </ErgButton>
      </Box>
      <Box sx={{ ...cardSx, flex: "1 1 360px", minWidth: 0 }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 1.5 }}>
          <Typography sx={{ fontWeight: "fontWeightBold" }}>Xem lại từng câu</Typography>
          <ToggleButtonGroup aria-label="Lọc câu" exclusive onChange={(_, v: Filter | null) => v && setFilter(v)} size="small" value={filter}>
            <ToggleButton value="all">{`Tất cả · ${count.all}`}</ToggleButton>
            <ToggleButton value="right">{`Đúng · ${count.right}`}</ToggleButton>
            <ToggleButton value="wrong">{`Sai · ${count.wrong}`}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, mb: 1.5 }}>
          {graded.map((g) => (
            <Box key={g.number} sx={{ bgcolor: g.correct ? "success.main" : "error.main", borderRadius: 1, flex: 1, height: 8 }} />
          ))}
        </Box>
        {rows.map((row) => (
          <Box key={row.number} sx={{ borderColor: "divider", borderTop: 1, py: 1.5 }}>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "space-between" }}>
              <Typography noWrap sx={{ minWidth: 0 }}>{`${row.number}. ${row.title}`}</Typography>
              <Typography color={!row.graded ? "text.secondary" : row.correct ? "success.main" : "error.main"} sx={{ flexShrink: 0 }}>
                {!row.graded ? "Không chấm tự động" : row.correct ? "Đúng" : "Sai"}
              </Typography>
            </Box>
            {row.graded && !row.correct && row.correctAnswer ? (
              <Typography color="error" variant="caption">{`Đáp án đúng: ${row.correctAnswer}`}</Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

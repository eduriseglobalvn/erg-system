import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { useMemo, useState } from "react";

import {
  buildTrainingMonitorRows,
  type TrainingMonitorScope,
} from "@/features/lcms/school-management/components/training/training-monitoring-scope";
import type { ClassTrainingSummary } from "@/features/lcms/school-management/types/training-monitoring-types";

const scopeOptions: Array<{ label: string; value: TrainingMonitorScope }> = [
  { label: "Theo trường", value: "school" },
  { label: "Theo khối", value: "grade" },
  { label: "Theo lớp", value: "class" },
  { label: "Theo giáo viên", value: "teacher" },
];

const statusMeta = {
  critical: { color: "error" as const, label: "Cần xử lý" },
  good: { color: "success" as const, label: "Tốt" },
  watch: { color: "warning" as const, label: "Theo dõi" },
};

export function TrainingMonitoringTable({ schoolName, summaries }: { schoolName: string; summaries: ClassTrainingSummary[] }) {
  const [scope, setScope] = useState<TrainingMonitorScope>("class");
  const rows = useMemo(() => buildTrainingMonitorRows(summaries, scope, schoolName), [schoolName, scope, summaries]);

  return <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
    <ToggleButtonGroup
      aria-label="Phạm vi bảng giám sát"
      exclusive
      onChange={(_, value: TrainingMonitorScope | null) => { if (value) setScope(value); }}
      size="small"
      value={scope}
      sx={{ display: "flex", gap: 0.75, overflowX: "auto", p: 1.5, "& .MuiToggleButton-root": { border: "1px solid", borderColor: "divider", borderRadius: "8px !important", flexShrink: 0, fontWeight: 750, px: 1.75, textTransform: "none" } }}
    >
      {scopeOptions.map((option) => <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>)}
    </ToggleButtonGroup>
    <TableContainer sx={{ maxHeight: 560 }}>
      <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
        <TableHead><TableRow>
          <TableCell>Phạm vi</TableCell>
          <TableCell align="right">Lớp</TableCell>
          <TableCell align="right">Học sinh</TableCell>
          <TableCell align="right">Sức khỏe</TableCell>
          <TableCell align="right">Năng lực</TableCell>
          <TableCell align="right">Tham gia</TableCell>
          <TableCell align="right">Giảng dạy</TableCell>
          <TableCell align="right">Can thiệp</TableCell>
          <TableCell align="right">Cần theo dõi</TableCell>
          <TableCell>Trạng thái</TableCell>
        </TableRow></TableHead>
        <TableBody>{rows.map((row) => {
          const meta = statusMeta[row.status];
          return <TableRow hover key={row.id}>
            <TableCell sx={{ fontWeight: 850 }}>{row.name}</TableCell>
            <TableCell align="right">{row.classCount}</TableCell>
            <TableCell align="right">{row.studentCount}</TableCell>
            <ScoreCell value={row.classHealth} />
            <ScoreCell value={row.studentMastery} />
            <ScoreCell value={row.learningEngagement} />
            <ScoreCell value={row.teachingDelivery} />
            <ScoreCell value={row.interventionEffectiveness} />
            <TableCell align="right" sx={{ color: row.riskStudentCount ? "error.main" : "text.primary", fontWeight: 800 }}>{row.riskStudentCount}</TableCell>
            <TableCell><Chip color={meta.color} label={meta.label} size="small" variant="outlined" /></TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>
    </TableContainer>
  </Paper>;
}

function ScoreCell({ value }: { value: number }) {
  return <TableCell align="right" sx={{ color: value < 65 ? "error.main" : value < 80 ? "warning.main" : "text.primary", fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{value}</TableCell>;
}

import { memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

interface ReportsPanelProps {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
}

export function ReportsPanel({ selectedClass, selectedSchoolName }: ReportsPanelProps) {
  return (
    <Box component="section" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>
      <Metric detail="Phạm vi đang xem" label="Trường" value={selectedSchoolName} />
      <Metric detail={`${selectedClass?.studentCount ?? 0} học sinh`} label="Lớp" value={selectedClass?.className ?? "-"} />
      <Metric detail="Trung bình bài đang mở" label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} />
      <Metric detail="Học sinh cần theo sát" label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} />
    </Box>
  );
}

const Metric = memo(function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <Paper component="article" sx={{ border: "1px solid", borderColor: "divider", p: 2.5 }}>
      <Typography color="text.secondary" variant="caption">{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 750, mt: 1.5 }}>{value}</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">{detail}</Typography>
    </Paper>
  );
});

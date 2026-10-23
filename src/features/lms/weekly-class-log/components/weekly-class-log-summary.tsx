import type { WeeklyClassLogSummary as WeeklyClassLogSummaryData } from "@/features/lms/weekly-class-log/types/weekly-class-log-types";
import { Box } from "@mui/material";

export function WeeklyClassLogSummary({ summary }: { summary: WeeklyClassLogSummaryData }) {
  const summaryRows = [
    { label: "Vắng", field: "absence" as const },
    { label: "Đi muộn", field: "late" as const },
    { label: "Vi phạm", field: "otherViolation" as const },
    { label: "Điểm cuối tuần", field: "finalScore" as const },
    { label: "Học tập", field: "learning" as const },
    { label: "Kỷ luật", field: "discipline" as const },
    { label: "Vệ sinh", field: "hygiene" as const },
    { label: "Điểm trừ", field: "deduction" as const },
    { label: "Điểm TB", field: "average" as const },
    { label: "Đạt tuần tốt", field: "goodWeek" as const },
  ];

  return (
    <Box sx={{ borderLeft: { xs: 0, md: "1px solid #e5e7eb" }, borderTop: { xs: "1px solid #e5e7eb", md: 0 }, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "auto", width: { xs: "100%", md: 280 } }}>
      <div style={{ padding: "12px 16px", textAlign: "center", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f3f4f6", fontWeight: 600, fontSize: 14 }}>Tổng kết tuần</div>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
        {summaryRows.map(({ label, field }) => (
          <div key={field} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dotted #e5e7eb" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{label}:</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{summary[field]}</span>
          </div>
        ))}
      </div>
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ padding: "8px 16px", textAlign: "center", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>Kiến nghị GVBM</div>
        <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{summary.subjectTeacherProposal || "Không có"}</div>
      </div>
      <div>
        <div style={{ padding: "8px 16px", textAlign: "center", fontWeight: 600, fontSize: 13, borderBottom: "1px solid #e5e7eb" }}>Ý kiến GVCN</div>
        <div style={{ padding: "12px 16px", fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>{summary.homeroomTeacherOpinion || "Không có"}</div>
      </div>
    </Box>
  );
}

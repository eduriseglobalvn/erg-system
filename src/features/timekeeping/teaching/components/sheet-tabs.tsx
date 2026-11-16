import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

type Props = { months: readonly string[]; onChange: (sheet: string) => void; value: string };

/** «Trang tính» bar at the foot of the card: «Total» + one tab per month, like the sheet tabs of the Excel file. 44 high, selected tab tinted with a 2px primary top edge. */
export function SheetTabs({ months, onChange, value }: Props) {
  return (
    <Box sx={{ alignItems: "stretch", bgcolor: t.color.surfaceMuted, borderTop: `1px solid ${t.color.border}`, display: "flex", gap: 2, minHeight: 44, px: 1.5, "@media print": { display: "none" } }}>
      <Tabs
        aria-label="Bảng công tiết dạy"
        onChange={(_, sheet: string) => onChange(sheet)}
        scrollButtons="auto"
        slotProps={{ indicator: { sx: { bottom: "auto", top: 0 } } }}
        sx={{ minHeight: 44, minWidth: 0 }}
        value={value}
        variant="scrollable"
      >
        {["total", ...months].map((sheet) => (
          <Tab
            key={sheet}
            label={sheet === "total" ? "Total" : `Tháng ${sheet.slice(5)}`}
            sx={{ ...t.type.small, color: t.color.textSecondary, fontWeight: "fontWeightRegular", minHeight: 44, minWidth: 0, px: 2, "&.Mui-selected": { bgcolor: t.color.primarySofter, color: t.statusTint.info.color, fontWeight: t.type.label.fontWeight } }}
            value={sheet}
          />
        ))}
      </Tabs>
      {value === "total" ? <Box component="span" sx={{ ...t.type.note, alignItems: "center", color: "text.secondary", display: { xs: "none", md: "flex" }, ml: "auto" }}>Total = chi tiết từng tiết · mỗi tháng = bảng thống kê để giáo viên xác nhận</Box> : null}
    </Box>
  );
}

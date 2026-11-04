import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";

export function EmployeeDetailTabs({ onChange, tab }: { onChange: (tab: number) => void; tab: number }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Tabs
        value={tab}
        onChange={(_, value) => onChange(value)}
        variant="fullWidth"
        sx={{
          bgcolor: "rgba(0, 0, 0, 0.04)",
          borderRadius: "12px",
          minHeight: "unset",
          p: "4px",
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTab-root": {
            borderRadius: "8px",
            color: appleDesign.colors.textSecondary,
            fontSize: "0.85rem",
            fontWeight: 600,
            minHeight: 34,
            px: 1.5,
            py: 0.75,
            textTransform: "none",
            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            "&.Mui-selected": {
              bgcolor: "#FFFFFF",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              color: appleDesign.colors.blue,
            },
          },
        }}
      >
        <Tab label="Thông tin" />
        <Tab label="Quyền & scope" />
        <Tab label="Sessions" />
        <Tab label="Security log" />
      </Tabs>
    </Box>
  );
}

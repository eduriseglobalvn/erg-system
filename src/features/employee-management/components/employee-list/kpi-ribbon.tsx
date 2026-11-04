import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import Box from "@mui/material/Box";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { MetricCard } from "@/features/employee-management/components/employee-list/metric-card";

export function EmployeeKpiRibbon({
  activeCount,
  riskCount,
  totalCount,
}: {
  activeCount: number;
  riskCount: number;
  totalCount: number;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.75,
        gridTemplateColumns: { md: "repeat(3, 1fr)", sm: "repeat(2, 1fr)", xs: "1fr" },
        mb: 3,
      }}
    >
      <MetricCard
        icon={<PeopleAltRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.blue }} />}
        label="Tổng số nhân sự"
        value={`${totalCount} tài khoản`}
        subtext="Đã đăng ký trong hệ thống"
      />
      <MetricCard
        icon={<VerifiedUserRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.greenText }} />}
        label="Đang hoạt động"
        value={`${activeCount} nhân sự`}
        subtext="Trạng thái Active và sẵn sàng"
      />
      <MetricCard
        icon={<SecurityRoundedIcon fontSize="small" sx={{ color: riskCount ? appleDesign.colors.amberText : appleDesign.colors.textTertiary }} />}
        label="Cảnh báo an ninh"
        value={riskCount ? `${riskCount} rủi ro` : "An toàn tuyệt đối"}
        subtext={riskCount ? "Cần rà soát phiên truy cập" : "Không phát hiện mối đe dọa"}
        tone={riskCount ? "warning" : "neutral"}
      />
    </Box>
  );
}

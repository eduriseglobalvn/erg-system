import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import Box from "@mui/material/Box";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import { AppleFieldCard } from "@/features/employee-management/components/employee-detail/apple-field-card";
import type { EmployeeAccount, EmployeeProfile } from "@/features/employee-management/components/employee-detail/types";

export function EmployeeInfoTab({ account, profile }: { account: EmployeeAccount; profile: EmployeeProfile }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { sm: "1fr 1fr", xs: "1fr" },
      }}
    >
      <AppleFieldCard
        icon={<BadgeRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.blue }} />}
        label="Mã nhân viên"
        value={profile?.employeeCode}
      />
      <AppleFieldCard
        icon={<MailOutlineRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.blue }} />}
        label="Email"
        value={account?.email}
      />
      <AppleFieldCard
        icon={<PhoneIphoneRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.greenText }} />}
        label="Điện thoại"
        value={account?.phone}
      />
      <AppleFieldCard
        icon={<BusinessRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.purpleText }} />}
        label="Phòng ban"
        value={profile?.departmentId}
      />
      <AppleFieldCard
        icon={<WorkOutlineRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.purpleText }} />}
        label="Chức danh"
        value={profile?.jobTitle}
      />
      <AppleFieldCard
        icon={<TimelineRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.amberText }} />}
        label="Kinh nghiệm"
        value={profile?.experienceYears == null ? undefined : `${profile.experienceYears} năm`}
      />
      <AppleFieldCard
        icon={<LocationOnOutlinedIcon fontSize="small" sx={{ color: appleDesign.colors.blue }} />}
        label="Nơi làm việc"
        value={profile?.workLocation}
      />
      <AppleFieldCard
        icon={<SupervisorAccountOutlinedIcon fontSize="small" sx={{ color: appleDesign.colors.textSecondary }} />}
        label="Quản lý trực tiếp"
        value={profile?.managerId}
      />
    </Box>
  );
}

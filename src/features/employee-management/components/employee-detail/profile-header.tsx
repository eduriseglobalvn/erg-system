import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  AppleAvatar,
  appleDesign,
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeAccount, EmployeeProfile } from "@/features/employee-management/components/employee-detail/types";

export function EmployeeProfileHeader({ account, profile }: { account: EmployeeAccount; profile: EmployeeProfile }) {
  return (
    <Box
      sx={{
        alignItems: { sm: "center", xs: "flex-start" },
        bgcolor: appleDesign.colors.surfaceSubtle,
        border: `1px solid ${appleDesign.colors.border}`,
        borderRadius: "18px",
        display: "flex",
        flexDirection: { sm: "row", xs: "column" },
        gap: 2.25,
        mb: 2.5,
        p: 2.25,
      }}
    >
      <AppleAvatar name={String(account?.fullName ?? "ERG")} size={64} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 0.5 }}>
          <Typography
            variant="h6"
            sx={{
              color: appleDesign.colors.textPrimary,
              fontWeight: 750,
              letterSpacing: "-0.02em",
            }}
          >
            {String(account?.fullName)}
          </Typography>
          <AppleStatusBadge
            label={String(account?.status)}
            tone={account?.status === "ACTIVE" ? "success" : "warning"}
          />
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: appleDesign.colors.textSecondary,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          <span>{account?.email}</span>
          {profile?.employeeCode ? <span>• Mã: {profile.employeeCode}</span> : null}
        </Typography>
        {profile?.jobTitle || profile?.departmentId ? (
          <Typography variant="caption" sx={{ color: appleDesign.colors.textTertiary, mt: 0.25 }}>
            {[profile.jobTitle, profile.departmentId].filter(Boolean).join(" · ")}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

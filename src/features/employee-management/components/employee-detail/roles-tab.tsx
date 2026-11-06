import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  appleDesign,
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";
import { AppleFieldCard } from "@/features/employee-management/components/employee-detail/apple-field-card";
import type { EmployeeAccount, EmployeeProfile } from "@/features/employee-management/components/employee-detail/types";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeRolesTab({
  account,
  profile,
  tenantId,
}: {
  account: EmployeeAccount;
  profile: EmployeeProfile;
  tenantId: string;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.75 }}>
      <AppleFieldCard
        icon={<BusinessRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.purpleText }} />}
        label="Tổ chức / Tenant"
        value={profile?.tenantId || tenantId}
      />

      <Typography
        sx={{
          color: appleDesign.colors.textSecondary,
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          mt: 1,
          textTransform: "uppercase",
        }}
      >
        Danh sách nhóm quyền đã cấp ({account?.roles?.length ?? 0})
      </Typography>

      {account?.roles?.length ? (
        account.roles.map((role) => {
          const meta = getRoleMeta(role);
          return (
            <Box
              key={role}
              sx={{
                bgcolor: "#FFFFFF",
                border: `1px solid ${appleDesign.colors.border}`,
                borderRadius: "14px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                p: 2,
              }}
            >
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                <AppleStatusBadge label={meta.category} tone={meta.badgeTone} />
                <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 600 }}>
                  {meta.label}
                </Typography>
                <Typography
                  sx={{
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderRadius: "4px",
                    color: appleDesign.colors.textSecondary,
                    fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    px: 0.65,
                    py: 0.15,
                  }}
                >
                  {role}
                </Typography>
              </Box>

              <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.78rem", lineHeight: 1.45, mb: 1.25 }}>
                {meta.description}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                {meta.keyPermissions.map((perm) => (
                  <Box
                    key={perm}
                    sx={{
                      alignItems: "center",
                      bgcolor: "rgba(0, 0, 0, 0.03)",
                      border: `1px solid ${appleDesign.colors.borderSubtle}`,
                      borderRadius: "6px",
                      color: appleDesign.colors.textPrimary,
                      display: "inline-flex",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      gap: 0.5,
                      px: 0.85,
                      py: 0.3,
                    }}
                  >
                    <Box sx={{ bgcolor: appleDesign.colors.green, borderRadius: "50%", height: 5, width: 5 }} />
                    {perm}
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })
      ) : (
        <Box
          sx={{
            bgcolor: "rgba(0, 0, 0, 0.02)",
            border: `1px dashed ${appleDesign.colors.border}`,
            borderRadius: "12px",
            p: 2,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.825rem", fontStyle: "italic" }}>
            Chưa có nhóm quyền nào được cấp cho nhân sự này.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          alignItems: "flex-start",
          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.04),
          border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
          borderRadius: "12px",
          display: "flex",
          gap: 1.25,
          mt: 1,
          p: 1.75,
        }}
      >
        <SecurityRoundedIcon sx={{ color: appleDesign.colors.blue, fontSize: 20, mt: 0.2 }} />
        <Box>
          <Typography sx={{ color: appleDesign.colors.blue, fontSize: "0.8rem", fontWeight: 600 }}>
            Kiểm soát quyền & Quản trị Scope
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: appleDesign.colors.textSecondary,
              display: "block",
              lineHeight: 1.45,
              mt: 0.25,
            }}
          >
            Quyền hạn scoped được áp dụng theo authz version. Mọi thao tác gán hoặc hủy quyền đều được kiểm toán tự động.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

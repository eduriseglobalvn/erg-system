import { formatDateTimeVi } from "@/lib/format-date";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgTable } from "@/components/erg-mui/erg-table";
import {
  AppleAvatar,
  appleDesign,
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function EmployeeTable({
  employees,
  onOpenMenu,
  onSelect,
}: {
  employees: EmployeeItem[];
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => void;
  onSelect: (userId: string) => void;
}) {
  return (
    <ErgTable aria-label="Danh sách nhân sự">
      <TableHead>
        <TableRow
          sx={{
            bgcolor: "#FBFBFD",
            "& th": {
              borderBottom: `1px solid ${appleDesign.colors.border}`,
              color: appleDesign.colors.textTertiary,
              fontSize: "0.725rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              py: 1.5,
              textTransform: "uppercase",
            },
          }}
        >
          <TableCell>Nhân sự</TableCell>
          <TableCell>Phòng ban & chức danh</TableCell>
          <TableCell>Nhóm quyền & scope</TableCell>
          <TableCell>Trạng thái & rủi ro</TableCell>
          <TableCell>Thiết bị</TableCell>
          <TableCell>Lần đăng nhập cuối</TableCell>
          <TableCell align="right">Thao tác</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => {
          const activeDevices = employee.activeDeviceCount ?? 0;
          const hasMobile = employee.activePlatforms?.includes("WEB_MOBILE");
          const hasDesktop = employee.activePlatforms?.includes("WEB_DESKTOP");

          return (
            <TableRow
              hover
              key={employee.id}
              onClick={() => onSelect(employee.id)}
              sx={{
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.03)} !important`,
                },
                "& td": {
                  borderColor: appleDesign.colors.border,
                  py: 1.75,
                },
              }}
            >
              {/* Nhân sự: Avatar + Full Name + Code + Email */}
              <TableCell>
                <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                  <AppleAvatar name={employee.fullName} size={38} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: appleDesign.colors.textPrimary,
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {employee.fullName}
                    </Typography>
                    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.25 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.04)",
                          borderRadius: "4px",
                          color: appleDesign.colors.textSecondary,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          px: 0.6,
                          py: 0.1,
                        }}
                      >
                        {employee.employeeCode || employee.id}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: appleDesign.colors.textSecondary,
                          display: "inline-block",
                        }}
                      >
                        {employee.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </TableCell>

              {/* Phòng ban & chức danh */}
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    color: appleDesign.colors.textPrimary,
                    fontWeight: 600,
                  }}
                >
                  {employee.jobTitle || "Chưa có chức danh"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    display: "block",
                    mt: 0.25,
                  }}
                >
                  {employee.departmentId || "Chưa có phòng ban"}
                </Typography>
              </TableCell>

              {/* Nhóm quyền & scope */}
              <TableCell>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6, mb: 0.35 }}>
                  {employee.roles.length ? (
                    employee.roles.map((role) => {
                      const meta = getRoleMeta(role);
                      return (
                        <Box key={role} sx={{ alignItems: "center", display: "inline-flex", flexWrap: "wrap", gap: 0.75 }}>
                          <AppleStatusBadge label={meta.label} tone={meta.badgeTone} />
                          <Typography
                            variant="caption"
                            sx={{
                              bgcolor: "rgba(0, 0, 0, 0.04)",
                              borderRadius: "4px",
                              color: appleDesign.colors.textSecondary,
                              fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              px: 0.6,
                              py: 0.15,
                            }}
                          >
                            {role}
                          </Typography>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" sx={{ color: appleDesign.colors.textTertiary, fontStyle: "italic" }}>
                      Chưa gán
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    display: "block",
                  }}
                >
                  {employee.scopes?.join(", ") || "Chưa giới hạn scope"}
                </Typography>
              </TableCell>

              {/* Trạng thái & rủi ro */}
              <TableCell>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <AppleStatusBadge
                    label={employee.status}
                    tone={employee.status === "ACTIVE" ? "success" : "warning"}
                  />
                  {employee.riskCode ? (
                    <AppleStatusBadge
                      label={employee.riskCode}
                      tone="warning"
                    />
                  ) : null}
                </Box>
              </TableCell>

              {/* Thiết bị */}
              <TableCell>
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
                  {hasMobile && <PhoneIphoneRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 16 }} />}
                  {hasDesktop && <ComputerRoundedIcon sx={{ color: appleDesign.colors.textTertiary, fontSize: 16 }} />}
                  <Typography
                    variant="body2"
                    sx={{
                      color: appleDesign.colors.textPrimary,
                      fontWeight: 600,
                    }}
                  >
                    {activeDevices} thiết bị
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    display: "block",
                    mt: 0.25,
                  }}
                >
                  {employee.activePlatforms?.join(" · ") || "Không có phiên active"}
                </Typography>
              </TableCell>

              {/* Lần đăng nhập cuối */}
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    color: employee.last_login_at
                      ? appleDesign.colors.textPrimary
                      : appleDesign.colors.textTertiary,
                    fontSize: "0.825rem",
                    fontStyle: employee.last_login_at ? "normal" : "italic",
                  }}
                >
                  {employee.last_login_at
                    ? formatDateTimeVi(employee.last_login_at)
                    : "Chưa đăng nhập"}
                </Typography>
              </TableCell>

              {/* Thao tác */}
              <TableCell align="right">
                <IconButton
                  aria-label={`Thao tác cho ${employee.fullName}`}
                  onClick={(event) => onOpenMenu(event, employee)}
                  size="small"
                  sx={{
                    borderRadius: "8px",
                    color: appleDesign.colors.textSecondary,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.05)",
                      color: appleDesign.colors.textPrimary,
                    },
                  }}
                >
                  <MoreVertRoundedIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </ErgTable>
  );
}

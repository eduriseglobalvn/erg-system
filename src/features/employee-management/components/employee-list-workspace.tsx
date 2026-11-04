import { formatDateTimeVi } from "@/lib/format-date";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { ErgContentBand, ErgPageSurface } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import {
  AppleAvatar,
  appleDesign,
  appleInputSx,
  AppleStatusBadge,
} from "@/features/employee-management/components/apple-ui-tokens";
import { CreateEmployeeWizard } from "@/features/employee-management/components/create-employee-wizard";
import { EmployeeDetailDrawer } from "@/features/employee-management/components/employee-detail-drawer";
import {
  useEmployeeCommands,
  useEmployeeRoleOptions,
  useEmployees,
} from "@/features/employee-management/hooks/use-employee-management";
import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";

export function EmployeeListWorkspace({ tenantId }: { tenantId: string }) {
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionEmployee, setActionEmployee] = useState<EmployeeItem>();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");

  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuerySearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useEmployees(tenantId, {
    limit: 25,
    page: 1,
    search: querySearch || undefined,
  });

  const employees = query.data?.users ?? [];

  const openMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setActionEmployee(employee);
  };

  const closeMenu = () => setMenuAnchor(null);

  const openRoleDialog = () => {
    setRoleName("");
    setRoleDialogOpen(true);
    closeMenu();
  };

  const assignRole = async () => {
    if (!actionEmployee || !roleName) return;
    await commands.roles.mutateAsync({
      roles: [...new Set([...actionEmployee.roles, roleName])],
      userId: actionEmployee.id,
    });
    setRoleDialogOpen(false);
  };

  // Quick statistics calculation
  const totalCount = query.data?.meta.total ?? employees.length;
  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const riskCount = employees.filter((e) => Boolean(e.riskCode)).length;

  return (
    <ErgContentBand sx={{ bgcolor: "#F5F5F7", py: { md: 4, xs: 2.5 } }}>
      {/* Apple-styled Page Header */}
      <Box
        sx={{
          alignItems: { sm: "center", xs: "flex-start" },
          display: "flex",
          flexDirection: { sm: "row", xs: "column" },
          gap: 2,
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Box
            sx={{
              alignItems: "center",
              display: "inline-flex",
              gap: 0.6,
              mb: 0.5,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: appleDesign.colors.blue,
                fontSize: "0.725rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              Quản lý
            </Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{
              color: appleDesign.colors.textPrimary,
              fontWeight: 750,
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Tài khoản nhân sự
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: appleDesign.colors.textSecondary,
              lineHeight: 1.5,
              maxWidth: 720,
              mt: 0.5,
            }}
          >
            Quản lý hồ sơ, nhóm quyền, scope, trạng thái, credential, rủi ro và session trong một workspace.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{
            bgcolor: appleDesign.colors.blue,
            borderRadius: "12px",
            boxShadow: appleDesign.shadows.button,
            flexShrink: 0,
            fontSize: "0.875rem",
            fontWeight: 650,
            px: 2.5,
            py: 1.1,
            textTransform: "none",
            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              bgcolor: appleDesign.colors.blueHover,
              boxShadow: appleDesign.shadows.buttonHover,
              transform: "translateY(-1px)",
            },
          }}
        >
          Tạo tài khoản
        </Button>
      </Box>

      {/* Apple KPI Ribbon Cards */}
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

      {/* Main Table Shell (Apple macOS Inset Container) */}
      <ErgPageSurface
        flush
        sx={{
          bgcolor: "#FFFFFF",
          border: `1px solid ${appleDesign.colors.border}`,
          borderRadius: "18px",
          boxShadow: appleDesign.shadows.card,
          overflow: "hidden",
        }}
      >
        <ErgDataTableShell
          toolbar={
            <Box
              sx={{
                alignItems: { sm: "center", xs: "flex-start" },
                borderBottom: `1px solid ${appleDesign.colors.border}`,
                display: "flex",
                flexDirection: { sm: "row", xs: "column" },
                gap: 2,
                justifyContent: "space-between",
                p: { md: 2.5, xs: 2 },
              }}
            >
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: appleDesign.colors.textPrimary,
                    fontWeight: 750,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Danh sách nhân sự
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: appleDesign.colors.textSecondary,
                    display: "block",
                    fontWeight: 500,
                  }}
                >
                  {query.data ? `${query.data.meta.total} tài khoản` : "Đang tải dữ liệu"}
                </Typography>
              </Box>

              {/* Apple Safari/Spotlight Search Input */}
              <TextField
                size="small"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên, mã nhân viên, email, điện thoại..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: appleDesign.colors.textTertiary }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: "rgba(0, 0, 0, 0.03)",
                      borderRadius: "11px",
                      fontSize: "0.85rem",
                      minWidth: { md: 320, sm: 260, xs: "100%" },
                      transition: "all 0.15s ease",
                      "& fieldset": {
                        borderColor: appleDesign.colors.border,
                      },
                      "&:hover fieldset": {
                        borderColor: appleDesign.colors.borderMedium,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: appleDesign.colors.blue,
                        boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.15)",
                      },
                    },
                  },
                }}
              />
            </Box>
          }
        >
          {query.isPending ? (
            <Box sx={{ p: 3 }}>
              <ErgLoadingSkeleton rows={7} />
            </Box>
          ) : null}

          {query.isError ? (
            <Box sx={{ p: 3 }}>
              <ErgErrorState
                title="Không tải được nhân sự"
                description={
                  query.error instanceof Error
                    ? query.error.message
                    : "Không tải được danh sách nhân sự từ hệ thống."
                }
              />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && !employees.length ? (
            <Box sx={{ p: 4 }}>
              <ErgEmptyState title="Chưa có nhân sự phù hợp" />
            </Box>
          ) : null}

          {!query.isPending && !query.isError && employees.length ? (
            <ErgTable aria-label="Danh sách nhân sự">
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "#FBFBFD",
                    "& th": {
                      borderBottom: `1px solid ${appleDesign.colors.border}`,
                      color: appleDesign.colors.textTertiary,
                      fontSize: "0.725rem",
                      fontWeight: 650,
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
                      onClick={() => setSelectedUserId(employee.id)}
                      sx={{
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          bgcolor: "rgba(0, 113, 227, 0.03) !important",
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
                                fontWeight: 700,
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
                          onClick={(event) => openMenu(event, employee)}
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
          ) : null}
        </ErgDataTableShell>
      </ErgPageSurface>

      {/* Apple-styled Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        slotProps={{
          paper: {
            sx: {
              backdropFilter: "blur(20px)",
              bgcolor: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${appleDesign.colors.border}`,
              borderRadius: "14px",
              boxShadow: appleDesign.shadows.popover,
              minWidth: 180,
              p: 0.5,
              "& .MuiMenuItem-root": {
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                my: 0.25,
                px: 1.5,
                py: 0.75,
                transition: "all 0.12s ease",
                "&:hover": {
                  bgcolor: "rgba(0, 113, 227, 0.08)",
                  color: appleDesign.colors.blue,
                },
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (actionEmployee) setSelectedUserId(actionEmployee.id);
            closeMenu();
          }}
        >
          Xem hồ sơ
        </MenuItem>
        <MenuItem onClick={openRoleDialog}>Gán nhóm quyền</MenuItem>
        <MenuItem
          onClick={() => {
            if (actionEmployee) {
              void commands.status.mutateAsync({
                status: actionEmployee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                userId: actionEmployee.id,
              });
            }
            closeMenu();
          }}
        >
          {actionEmployee?.status === "ACTIVE" ? "Deactive tài khoản" : "Active tài khoản"}
        </MenuItem>
      </Menu>

      {/* Role Assignment Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => setRoleDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              boxShadow: appleDesign.shadows.sheet,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 750, letterSpacing: "-0.01em" }}>
          Gán nhóm quyền nhân sự
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: appleDesign.colors.textSecondary, mb: 2.5 }}>
            Nhóm quyền mới sẽ được cấp thêm cho nhân sự. Thay đổi có hiệu lực ngay lập tức và được lưu vết trong nhật ký kiểm toán.
          </DialogContentText>
          <TextField
            select
            fullWidth
            label="Nhóm quyền"
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return (
                      <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.875rem" }}>
                        Chọn nhóm quyền...
                      </Typography>
                    );
                  }
                  const meta = getRoleMeta(String(selected));
                  return (
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                      <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 700 }}>
                        {meta.label}
                      </Typography>
                      <Typography
                        sx={{
                          bgcolor: "rgba(0, 0, 0, 0.05)",
                          borderRadius: "4px",
                          color: appleDesign.colors.textSecondary,
                          fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          px: 0.6,
                          py: 0.1,
                        }}
                      >
                        {String(selected)}
                      </Typography>
                    </Box>
                  );
                },
              },
            }}
            sx={appleInputSx}
          >
            {(rolesQuery.data ?? []).map((role) => {
              const meta = getRoleMeta(role.name);
              return (
                <MenuItem
                  key={role.id}
                  value={role.name}
                  sx={{
                    alignItems: "flex-start",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.3,
                    mx: 0.5,
                    my: 0.35,
                    py: 1,
                    "&.Mui-selected": {
                      bgcolor: "rgba(0, 113, 227, 0.08) !important",
                    },
                  }}
                >
                  <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
                    <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.85rem", fontWeight: 700 }}>
                      {meta.label}
                    </Typography>
                    <Typography
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.05)",
                        borderRadius: "4px",
                        color: appleDesign.colors.textSecondary,
                        fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        ml: "auto",
                        px: 0.5,
                        py: 0.1,
                      }}
                    >
                      {role.name}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      color: appleDesign.colors.textSecondary,
                      fontSize: "0.74rem",
                      lineHeight: 1.35,
                      whiteSpace: "normal",
                    }}
                  >
                    {meta.description}
                  </Typography>
                </MenuItem>
              );
            })}
          </TextField>

          {roleName ? (() => {
            const meta = getRoleMeta(roleName);
            return (
              <Box
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                  border: `1px solid ${appleDesign.colors.border}`,
                  borderRadius: "14px",
                  mt: 2,
                  p: 2,
                }}
              >
                <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 1 }}>
                  <AppleStatusBadge label={meta.category} tone={meta.badgeTone} />
                  <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 750 }}>
                    {meta.label}
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
                        bgcolor: "#FFFFFF",
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
          })() : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="text"
            onClick={() => setRoleDialogOpen(false)}
            sx={{
              bgcolor: "transparent !important",
              borderRadius: "10px",
              color: `${appleDesign.colors.textSecondary} !important`,
              fontWeight: 650,
              px: 2,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05) !important" },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => void assignRole()}
            disabled={!roleName || commands.roles.isPending}
            sx={{
              bgcolor: `${appleDesign.colors.blue} !important`,
              borderRadius: "10px",
              boxShadow: appleDesign.shadows.button,
              color: "#FFFFFF !important",
              fontWeight: 650,
              px: 2.5,
              textTransform: "none",
              "&:hover": {
                bgcolor: `${appleDesign.colors.blueHover} !important`,
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(0, 0, 0, 0.12) !important",
                color: "rgba(0, 0, 0, 0.35) !important",
              },
            }}
          >
            Xác nhận gán quyền
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <EmployeeDetailDrawer
        key={selectedUserId ?? "none"}
        tenantId={tenantId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(undefined)}
      />

      {/* Create Employee Wizard */}
      <CreateEmployeeWizard
        tenantId={tenantId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </ErgContentBand>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  subtext: string;
  tone?: "neutral" | "warning";
  value: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${
          tone === "warning" ? "rgba(255, 149, 0, 0.3)" : appleDesign.colors.border
        }`,
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        p: 2.25,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textTertiary,
            fontWeight: 650,
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(0, 0, 0, 0.03)",
            borderRadius: "8px",
            display: "flex",
            height: 28,
            justifyContent: "center",
            width: 28,
          }}
        >
          {icon}
        </Box>
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: tone === "warning" ? appleDesign.colors.amberText : appleDesign.colors.textPrimary,
          fontWeight: 750,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary }}>
        {subtext}
      </Typography>
    </Box>
  );
}

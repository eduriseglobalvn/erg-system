import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import SupervisorAccountOutlinedIcon from "@mui/icons-material/SupervisorAccountOutlined";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { type ReactNode, useEffect, useState } from "react";

import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import {
  AppleAvatar,
  appleDesign,
  appleInputSx,
  AppleStatusBadge,
  DeviceIcon,
  parseDeviceString,
} from "@/features/employee-management/components/apple-ui-tokens";
import { EmployeeSecurityTimeline } from "@/features/employee-management/components/employee-security-timeline";
import { useEmployeeCommands, useEmployeeDetail } from "@/features/employee-management/hooks/use-employee-management";
import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";

type ConfirmAction = "STATUS" | "RESET" | null;

export function EmployeeDetailDrawer({
  tenantId,
  userId,
  onClose,
}: {
  onClose: () => void;
  tenantId: string;
  userId?: string;
}) {
  const query = useEmployeeDetail(tenantId, userId);
  const commands = useEmployeeCommands(tenantId);
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<string>();
  const [temporaryCredential, setTemporaryCredential] = useState<string>();
  const [form, setForm] = useState({
    departmentId: "",
    employeeCode: "",
    employmentType: "",
    experienceSummary: "",
    experienceYears: "",
    fullName: "",
    jobTitle: "",
    managerId: "",
    phone: "",
    workLocation: "",
  });

  const employee = query.data;
  const account = employee?.account.user;
  const profile = employee?.profile;

  useEffect(() => {
    if (!employee) return;
    setForm({
      departmentId: profile?.departmentId ?? "",
      employeeCode: profile?.employeeCode ?? "",
      employmentType: profile?.employmentType ?? "",
      experienceSummary: profile?.experienceSummary ?? "",
      experienceYears: profile?.experienceYears == null ? "" : String(profile.experienceYears),
      fullName: String(account?.fullName ?? ""),
      jobTitle: profile?.jobTitle ?? "",
      managerId: profile?.managerId ?? "",
      phone: String(account?.phone ?? ""),
      workLocation: profile?.workLocation ?? "",
    });
  }, [account, employee, profile]);

  const set = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const save = async () => {
    if (!userId) return;
    await commands.update.mutateAsync({
      payload: {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        profile: {
          departmentId: form.departmentId.trim() || undefined,
          employeeCode: form.employeeCode.trim(),
          employmentType: form.employmentType.trim() || undefined,
          experienceSummary: form.experienceSummary.trim() || undefined,
          experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
          jobTitle: form.jobTitle.trim() || undefined,
          managerId: form.managerId.trim() || undefined,
          workLocation: form.workLocation.trim() || undefined,
        },
      },
      userId,
    });
    setEditing(false);
  };

  const confirm = async () => {
    if (!userId || !account) return;
    if (confirmAction === "STATUS") {
      await commands.status.mutateAsync({
        status: account.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        userId,
      });
    }
    if (confirmAction === "RESET") {
      const result = await commands.resetCredential.mutateAsync({
        delivery: "ONE_TIME_PASSWORD",
        userId,
      });
      if (result.oneTimePassword) setTemporaryCredential(result.oneTimePassword);
    }
    setConfirmAction(null);
  };

  const revokeSession = async () => {
    if (!userId || !sessionToRevoke) return;
    await commands.revokeSession.mutateAsync({ sessionId: sessionToRevoke, userId });
    setSessionToRevoke(undefined);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={Boolean(userId)}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: "#FFFFFF",
              borderLeft: `1px solid ${appleDesign.colors.border}`,
              borderRadius: { sm: "24px 0 0 24px", xs: 0 },
              boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.08)",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              width: { md: 680, sm: 580, xs: "100%" },
            },
          },
        }}
      >
        {/* Top bar with back/close */}
        <Box
          sx={{
            alignItems: "center",
            borderBottom: `1px solid ${appleDesign.colors.border}`,
            display: "flex",
            justifyContent: "space-between",
            px: 3,
            py: 1.75,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: appleDesign.colors.textTertiary,
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              Hồ sơ nhân sự
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: appleDesign.colors.textPrimary,
                fontWeight: 750,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              {String(account?.fullName ?? "Chi tiết nhân sự")}
            </Typography>
          </Box>
          <IconButton
            aria-label="Đóng hồ sơ nhân sự"
            onClick={onClose}
            size="small"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.04)",
              color: appleDesign.colors.textSecondary,
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
                color: appleDesign.colors.textPrimary,
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Content scroll area */}
        <Box sx={{ flex: 1, overflowY: "auto", p: { md: 3, xs: 2 } }}>
          {query.isPending ? <ErgLoadingSkeleton rows={7} /> : null}
          {query.isError ? (
            <ErgErrorState
              title="Không tải được nhân sự"
              description="Tài khoản không tồn tại trong tenant hiện tại hoặc bạn không có quyền."
            />
          ) : null}

          {employee && userId ? (
            <>
              {/* Profile Card Header */}
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

              {/* Action Buttons Bar */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditRoundedIcon fontSize="small" />}
                  onClick={() => setEditing(true)}
                  sx={{
                    borderColor: appleDesign.colors.borderMedium,
                    borderRadius: "10px",
                    color: appleDesign.colors.textPrimary,
                    fontSize: "0.825rem",
                    fontWeight: 650,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      borderColor: appleDesign.colors.borderHover,
                    },
                  }}
                >
                  Chỉnh sửa hồ sơ
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={account?.status === "ACTIVE" ? <BlockRoundedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}
                  onClick={() => setConfirmAction("STATUS")}
                  sx={{
                    borderColor: appleDesign.colors.borderMedium,
                    borderRadius: "10px",
                    color: account?.status === "ACTIVE" ? appleDesign.colors.textSecondary : appleDesign.colors.greenText,
                    fontSize: "0.825rem",
                    fontWeight: 650,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.04)",
                      borderColor: appleDesign.colors.borderHover,
                    },
                  }}
                >
                  {account?.status === "ACTIVE" ? "Deactive" : "Active"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LockResetRoundedIcon fontSize="small" />}
                  onClick={() => setConfirmAction("RESET")}
                  sx={{
                    borderColor: "rgba(255, 149, 0, 0.3)",
                    borderRadius: "10px",
                    color: appleDesign.colors.amberText,
                    fontSize: "0.825rem",
                    fontWeight: 650,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: appleDesign.colors.amberSoft,
                      borderColor: appleDesign.colors.amber,
                    },
                  }}
                >
                  Reset credential
                </Button>
              </Box>

              {/* Temporary Credential Callout */}
              {temporaryCredential ? (
                <Box
                  sx={{
                    bgcolor: "rgba(255, 149, 0, 0.08)",
                    border: `1px solid rgba(255, 149, 0, 0.3)`,
                    borderRadius: "14px",
                    mb: 2.5,
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: appleDesign.colors.amberText,
                      display: "block",
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    Temporary credential — chỉ hiển thị lần này
                  </Typography>
                  <Typography
                    sx={{
                      color: appleDesign.colors.textPrimary,
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {temporaryCredential}
                  </Typography>
                </Box>
              ) : null}

              {/* Apple Segmented Control Tabs */}
              <Box sx={{ mb: 2.5 }}>
                <Tabs
                  value={tab}
                  onChange={(_, value) => setTab(value)}
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

              {/* Tab 0: Information Cards */}
              {tab === 0 ? (
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
              ) : null}

              {/* Tab 1: Roles & Scope */}
              {tab === 1 ? (
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
                      fontWeight: 700,
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
                            <Typography sx={{ color: appleDesign.colors.textPrimary, fontSize: "0.875rem", fontWeight: 750 }}>
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
                      bgcolor: "rgba(0, 113, 227, 0.04)",
                      border: "1px solid rgba(0, 113, 227, 0.15)",
                      borderRadius: "12px",
                      display: "flex",
                      gap: 1.25,
                      mt: 1,
                      p: 1.75,
                    }}
                  >
                    <SecurityRoundedIcon sx={{ color: appleDesign.colors.blue, fontSize: 20, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ color: appleDesign.colors.blue, fontSize: "0.8rem", fontWeight: 700 }}>
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
              ) : null}

              {/* Tab 2: Sessions */}
              {tab === 2 ? (
                <Box sx={{ display: "grid", gap: 1.5 }}>
                  {employee.account.sessions.length ? (
                    employee.account.sessions.map((session) => {
                      const parsed = parseDeviceString(
                        session.deviceName || session.deviceId,
                        session.deviceType
                      );
                      const isRevoked = Boolean(session.revoked);

                      return (
                        <Box
                          key={session.sessionId}
                          sx={{
                            bgcolor: isRevoked ? "rgba(0, 0, 0, 0.02)" : "#FFFFFF",
                            border: `1px solid ${
                              isRevoked ? "rgba(0, 0, 0, 0.04)" : appleDesign.colors.border
                            }`,
                            borderRadius: "14px",
                            boxShadow: isRevoked ? "none" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.25,
                            opacity: isRevoked ? 0.6 : 1,
                            p: 2,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: isRevoked ? "inherit" : appleDesign.colors.borderMedium,
                              boxShadow: isRevoked ? "none" : "0 4px 14px rgba(0, 0, 0, 0.04)",
                            },
                          }}
                        >
                          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5 }}>
                            <Box
                              sx={{
                                alignItems: "center",
                                bgcolor: "rgba(0, 0, 0, 0.04)",
                                borderRadius: "10px",
                                display: "flex",
                                height: 38,
                                justifyContent: "center",
                                width: 38,
                              }}
                            >
                              <DeviceIcon size="small" type={parsed.icon} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: appleDesign.colors.textPrimary,
                                  fontWeight: 750,
                                  letterSpacing: "-0.01em",
                                }}
                              >
                                {parsed.title || "Thiết bị không xác định"}
                              </Typography>
                              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.35 }}>
                                <Typography
                                  variant="caption"
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
                                  {session.ipAddress}
                                </Typography>
                                <Typography variant="caption" sx={{ color: appleDesign.colors.textTertiary }}>
                                  ·
                                </Typography>
                                <Typography variant="caption" sx={{ color: appleDesign.colors.textSecondary, fontWeight: 550 }}>
                                  {session.portal}
                                </Typography>
                              </Box>
                            </Box>

                            {!isRevoked ? (
                              <Button
                                size="small"
                                onClick={() => setSessionToRevoke(session.sessionId)}
                                sx={{
                                  bgcolor: "rgba(255, 59, 48, 0.08)",
                                  border: "1px solid rgba(255, 59, 48, 0.16)",
                                  borderRadius: "9999px",
                                  color: appleDesign.colors.redText,
                                  fontSize: "0.78rem",
                                  fontWeight: 650,
                                  px: 1.5,
                                  py: 0.45,
                                  textTransform: "none",
                                  whiteSpace: "nowrap",
                                  transition: "all 0.15s ease",
                                  "&:hover": {
                                    bgcolor: "rgba(255, 59, 48, 0.16)",
                                    borderColor: "rgba(255, 59, 48, 0.3)",
                                  },
                                }}
                              >
                                Thu hồi phiên
                              </Button>
                            ) : (
                              <AppleStatusBadge label="Đã thu hồi" tone="neutral" />
                            )}
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      Không có session.
                    </Typography>
                  )}
                </Box>
              ) : null}

              {/* Tab 3: Security Log */}
              {tab === 3 ? (
                <EmployeeSecurityTimeline tenantId={tenantId} userId={userId} />
              ) : null}
            </>
          ) : null}
        </Box>
      </Drawer>

      {/* Apple-style Edit Dialog */}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              boxShadow: appleDesign.shadows.sheet,
              overflow: "hidden",
              p: 0,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            alignItems: "center",
            borderBottom: `1px solid ${appleDesign.colors.border}`,
            display: "flex",
            fontWeight: 750,
            justifyContent: "space-between",
            letterSpacing: "-0.02em",
            px: { sm: 3, xs: 2.5 },
            py: 2,
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: appleDesign.colors.blue,
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              Cập nhật thông tin
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: appleDesign.colors.textPrimary,
                fontWeight: 750,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              Chỉnh sửa hồ sơ nhân sự
            </Typography>
          </Box>
          <IconButton
            aria-label="Đóng chỉnh sửa hồ sơ"
            onClick={() => setEditing(false)}
            size="small"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.04)",
              color: appleDesign.colors.textSecondary,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
                color: appleDesign.colors.textPrimary,
              },
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { sm: 3, xs: 2.5 }, py: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr", xs: "1fr" },
              pt: 0.5,
            }}
          >
            <TextField
              label="Họ và tên"
              value={form.fullName}
              onChange={(event) => set("fullName", event.target.value)}
              placeholder="Nhập họ và tên..."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Điện thoại"
              value={form.phone}
              onChange={(event) => set("phone", event.target.value)}
              placeholder="Ví dụ: 0901234567"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Mã nhân viên"
              value={form.employeeCode}
              onChange={(event) => set("employeeCode", event.target.value)}
              placeholder="Ví dụ: NV-001"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Phòng ban"
              value={form.departmentId}
              onChange={(event) => set("departmentId", event.target.value)}
              placeholder="Ví dụ: Đào tạo, Học thuật..."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Chức danh"
              value={form.jobTitle}
              onChange={(event) => set("jobTitle", event.target.value)}
              placeholder="Ví dụ: Giảng viên chuyên trách..."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Loại hợp đồng"
              value={form.employmentType}
              onChange={(event) => set("employmentType", event.target.value)}
              placeholder="FULL_TIME, PART_TIME..."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Nơi làm việc"
              value={form.workLocation}
              onChange={(event) => set("workLocation", event.target.value)}
              placeholder="Ví dụ: Cơ sở 1 - Hà Nội"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Quản lý trực tiếp"
              value={form.managerId}
              onChange={(event) => set("managerId", event.target.value)}
              placeholder="ID hoặc mã quản lý..."
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <TextField
              label="Số năm kinh nghiệm"
              type="number"
              value={form.experienceYears}
              onChange={(event) => set("experienceYears", event.target.value)}
              placeholder="0"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={appleInputSx}
            />
            <Box sx={{ display: { sm: "block", xs: "none" } }} />
            <TextField
              label="Tóm tắt kinh nghiệm"
              value={form.experienceSummary}
              onChange={(event) => set("experienceSummary", event.target.value)}
              placeholder="Tóm tắt quá trình làm việc, chứng chỉ, chuyên môn..."
              multiline
              minRows={2.5}
              sx={[{ gridColumn: { sm: "1 / -1" } }, appleInputSx]}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${appleDesign.colors.border}`,
            px: { sm: 3, xs: 2.5 },
            py: 2,
          }}
        >
          <Button
            variant="text"
            onClick={() => setEditing(false)}
            sx={{
              borderRadius: "10px",
              color: `${appleDesign.colors.textSecondary} !important`,
              fontWeight: 650,
              px: 2.5,
              textTransform: "none",
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04) !important",
                color: `${appleDesign.colors.textPrimary} !important`,
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => void save()}
            disabled={commands.update.isPending || !form.fullName.trim() || !form.employeeCode.trim()}
            sx={{
              bgcolor: `${appleDesign.colors.blue} !important`,
              borderRadius: "10px",
              boxShadow: appleDesign.shadows.button,
              color: "#FFFFFF !important",
              fontWeight: 650,
              px: 3,
              textTransform: "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: `${appleDesign.colors.blueHover} !important`,
                boxShadow: appleDesign.shadows.buttonHover,
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(0, 0, 0, 0.12) !important",
                boxShadow: "none",
                color: "rgba(0, 0, 0, 0.35) !important",
              },
            }}
          >
            Lưu hồ sơ
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
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
          {confirmAction === "RESET" ? "Reset credential an toàn" : "Xác nhận đổi trạng thái"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: appleDesign.colors.textSecondary }}>
            {confirmAction === "RESET"
              ? "Hệ thống sẽ tạo temporary credential một lần, thu hồi session cũ và bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp."
              : "Thay đổi trạng thái có thể thu hồi toàn bộ session của nhân sự."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="text"
            onClick={() => setConfirmAction(null)}
            sx={{
              bgcolor: "transparent !important",
              borderRadius: "10px",
              color: `${appleDesign.colors.textSecondary} !important`,
              fontWeight: 650,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05) !important" },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirm()}
            sx={{
              bgcolor: `${appleDesign.colors.amber} !important`,
              borderRadius: "10px",
              color: "#FFFFFF !important",
              fontWeight: 650,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#D97706 !important",
              },
            }}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Session Dialog */}
      <Dialog
        open={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(undefined)}
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
          Thu hồi session
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: appleDesign.colors.textSecondary }}>
            Thiết bị sẽ bị đăng xuất ở request tiếp theo. Hành động được ghi audit.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="text"
            onClick={() => setSessionToRevoke(undefined)}
            sx={{
              bgcolor: "transparent !important",
              borderRadius: "10px",
              color: `${appleDesign.colors.textSecondary} !important`,
              fontWeight: 650,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05) !important" },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={() => void revokeSession()}
            sx={{
              bgcolor: `${appleDesign.colors.red} !important`,
              borderRadius: "10px",
              color: "#FFFFFF !important",
              fontWeight: 650,
              textTransform: "none",
              "&:hover": {
                bgcolor: "#DC2626 !important",
              },
            }}
          >
            Thu hồi phiên
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function AppleFieldCard({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: unknown;
}) {
  const displayValue = String(value || "");
  const isPlaceholder = !value;

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${appleDesign.colors.border}`,
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        p: 1.75,
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: appleDesign.colors.borderMedium,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
        },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, mb: 0.25 }}>
        {icon && (
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
        )}
        <Typography
          variant="caption"
          sx={{
            color: appleDesign.colors.textTertiary,
            fontSize: "0.72rem",
            fontWeight: 650,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: isPlaceholder
            ? appleDesign.colors.textTertiary
            : appleDesign.colors.textPrimary,
          fontSize: "0.875rem",
          fontWeight: isPlaceholder ? 500 : 700,
          pl: icon ? 4.5 : 0,
          wordBreak: "break-word",
        }}
      >
        {isPlaceholder ? "Chưa cập nhật" : displayValue}
      </Typography>
    </Box>
  );
}

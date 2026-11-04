import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgErrorState, ErgLoadingSkeleton } from "@/components/erg-mui/erg-feedback";
import { appleDesign } from "@/features/employee-management/components/apple-ui-tokens";
import {
  EmployeeSecurityTimeline,
} from "@/features/employee-management/components/employee-security-timeline";
import {
  useEmployeeCommands,
  useEmployeeDetail,
} from "@/features/employee-management/hooks/use-employee-management";
import { EmployeeActionBar } from "@/features/employee-management/components/employee-detail/action-bar";
import { EmployeeDetailTabs } from "@/features/employee-management/components/employee-detail/detail-tabs";
import { EmployeeEditDialog } from "@/features/employee-management/components/employee-detail/edit-dialog";
import { EmployeeInfoTab } from "@/features/employee-management/components/employee-detail/info-tab";
import { EmployeeProfileHeader } from "@/features/employee-management/components/employee-detail/profile-header";
import { EmployeeRolesTab } from "@/features/employee-management/components/employee-detail/roles-tab";
import { EmployeeSessionsTab } from "@/features/employee-management/components/employee-detail/sessions-tab";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

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
    // A background refetch must not overwrite what the user is typing.
    if (!employee || editing) return;
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
  }, [account, editing, employee, profile]);

  const set = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));

  const save = async () => {
    if (!userId) return;
    try {
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
    } catch {
      return; // keep the form open so edits are not lost; the global handler already toasted the error
    }
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
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              Hồ sơ nhân sự
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: appleDesign.colors.textPrimary,
                fontWeight: 600,
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
              <EmployeeProfileHeader account={account} profile={profile} />

              {/* Action Buttons Bar */}
              <EmployeeActionBar
                account={account}
                onEdit={() => setEditing(true)}
                onResetCredential={() => setConfirmAction("RESET")}
                onToggleStatus={() => setConfirmAction("STATUS")}
              />

              {/* Temporary Credential Callout */}
              {temporaryCredential ? (
                <Box
                  sx={{
                    bgcolor: alpha(ergEnterpriseTokens.color.warning, 0.08),
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
                      fontWeight: 600,
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
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {temporaryCredential}
                  </Typography>
                </Box>
              ) : null}

              {/* Apple Segmented Control Tabs */}
              <EmployeeDetailTabs tab={tab} onChange={setTab} />

              {/* Tab 0: Information Cards */}
              {tab === 0 ? <EmployeeInfoTab account={account} profile={profile} /> : null}

              {/* Tab 1: Roles & Scope */}
              {tab === 1 ? <EmployeeRolesTab account={account} profile={profile} tenantId={tenantId} /> : null}

              {/* Tab 2: Sessions */}
              {tab === 2 ? (
                <EmployeeSessionsTab sessions={employee.account.sessions} onRevoke={setSessionToRevoke} />
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
      <EmployeeEditDialog
        form={form}
        onChange={set}
        onClose={() => setEditing(false)}
        onSave={save}
        open={editing}
        saving={commands.update.isPending}
      />

      <ErgConfirmDialog
        confirmLabel="Xác nhận"
        description={
          confirmAction === "RESET"
            ? "Hệ thống sẽ tạo temporary credential một lần, thu hồi session cũ và bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp."
            : "Thay đổi trạng thái có thể thu hồi toàn bộ session của nhân sự."
        }
        destructive
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirm()}
        open={Boolean(confirmAction)}
        title={confirmAction === "RESET" ? "Reset credential an toàn" : "Xác nhận đổi trạng thái"}
      />

      <ErgConfirmDialog
        confirmLabel="Thu hồi phiên"
        description="Thiết bị sẽ bị đăng xuất ở request tiếp theo. Hành động được ghi audit."
        destructive
        onCancel={() => setSessionToRevoke(undefined)}
        onConfirm={() => void revokeSession()}
        open={Boolean(sessionToRevoke)}
        title="Thu hồi session"
      />
    </>
  );
}

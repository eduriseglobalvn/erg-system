import { useEffect, useMemo, useState } from "react";
import HistoryIcon from "@mui/icons-material/History";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui";
import {
  changeMyPassword,
  requestRecoveryEmailChallenge,
  updateMyTeacherProfile,
  verifyRecoveryEmailChallenge,
  type RecoveryEmailChallenge,
} from "@/platform/auth/api/account-security-api";
import { saveCurrentAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

type AccountDialog = "phone" | "recovery" | "password" | null;

const capabilities = [
  ["Lớp học", "lms.class.read"],
  ["Bài tập", "lms.assignment.read"],
  ["Bảng điểm", "lms.grade.read"],
  ["Điểm danh", "lms.attendance.read"],
  ["Tài nguyên", "lms.resource.read"],
  ["Báo cáo", "lms.report.read"],
] as const;

export function LmsAccountPage({ onLoginLogs, onSignedOut }: { onLoginLogs: () => void; onSignedOut: () => void }) {
  const auth = useAuthSession("lms");
  const [account, setAccount] = useState(auth.account);
  const [dialog, setDialog] = useState<AccountDialog>(null);
  const [phone, setPhone] = useState(auth.account?.phone ?? "");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [challenge, setChallenge] = useState<RecoveryEmailChallenge | null>(null);
  const [otp, setOtp] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setAccount(auth.account);
    setPhone(auth.account?.phone ?? "");
  }, [
    auth.account?.email,
    auth.account?.fullName,
    auth.account?.id,
    auth.account?.lifecycle?.recoveryEmailMasked,
    auth.account?.lifecycle?.recoveryEmailVerified,
    auth.account?.phone,
    auth.account?.status,
  ]);

  const effectiveCapabilities = useMemo(
    () => capabilities.filter(([, permission]) => evaluatePermission({
      permission,
      grantedPermissions: auth.session?.permissions,
      deniedPermissions: auth.session?.deniedPermissions,
    })),
    [auth.session?.deniedPermissions, auth.session?.permissions],
  );

  if (!account) return null;

  function closeDialog() {
    if (busy) return;
    setDialog(null);
    setError("");
    setChallenge(null);
    setOtp("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể cập nhật tài khoản.");
    } finally {
      setBusy(false);
    }
  }

  function savePhone() {
    if (!account) return;
    if (!phone.trim()) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    void run(async () => {
      const updated = await updateMyTeacherProfile({ fullName: account.fullName, phone: phone.trim() });
      saveCurrentAccount(updated);
      setAccount(updated);
      setNotice("Đã cập nhật số điện thoại.");
      setDialog(null);
    });
  }

  function requestRecovery() {
    if (!account) return;
    const normalized = recoveryEmail.trim().toLowerCase();
    if (normalized === account.email.trim().toLowerCase()) {
      setError("Email khôi phục phải khác email đăng nhập.");
      return;
    }
    void run(async () => {
      setChallenge(await requestRecoveryEmailChallenge(normalized));
      setNotice("Mã xác minh đã được gửi.");
    });
  }

  function verifyRecovery() {
    if (!account || !challenge) return;
    const currentAccount = account;
    void run(async () => {
      const result = await verifyRecoveryEmailChallenge({ challengeId: challenge.challengeId, otp });
      if (result.lifecycle) {
        const updated = { ...currentAccount, lifecycle: result.lifecycle, isProfileCompleted: result.lifecycle.isProfileCompleted };
        saveCurrentAccount(updated);
        setAccount(updated);
      }
      setNotice("Email khôi phục đã được xác minh.");
      setDialog(null);
    });
  }

  function savePassword() {
    if (!account) return;
    const currentAccount = account;
    if (newPassword.length < 12) {
      setError("Mật khẩu mới cần ít nhất 12 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu chưa khớp.");
      return;
    }
    void run(async () => {
      const result = await changeMyPassword({ currentPassword, newPassword });
      if (result.lifecycle) {
        const updated = { ...currentAccount, lifecycle: result.lifecycle, isProfileCompleted: result.lifecycle.isProfileCompleted };
        saveCurrentAccount(updated);
        setAccount(updated);
      }
      setNotice("Mật khẩu đã được cập nhật. Các phiên khác đã bị thu hồi theo chính sách máy chủ.");
      setDialog(null);
    });
  }

  function signOut() {
    auth.actions.signOut();
    onSignedOut();
  }

  return (
    <Box component="section" sx={{ bgcolor: "background.default", minHeight: "100%", p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} sx={{ mx: "auto", maxWidth: 1120 }}>
        {error && !dialog ? <Alert severity="error">{error}</Alert> : null}
        {notice ? <Alert severity="success" aria-live="polite">{notice}</Alert> : null}
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Avatar src={account.avatarUrl} sx={{ bgcolor: "primary.main", height: 52, width: 52 }}>{initials(account.fullName)}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography component="h1" sx={{ fontWeight: 750 }} variant="h6">{account.fullName}</Typography>
                <Chip color={account.status === "ACTIVE" ? "success" : "warning"} label={account.status ?? "UNKNOWN"} size="small" />
              </Stack>
              <Typography color="text.secondary" variant="body2">{account.email}</Typography>
            </Box>
            <Button startIcon={<HistoryIcon />} variant="outlined" onClick={onLoginLogs}>Lịch sử đăng nhập</Button>
            <Button color="error" startIcon={<LogoutIcon />} variant="contained" onClick={signOut}>Đăng xuất</Button>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(320px, .7fr)" } }}>
          <Paper variant="outlined">
            <SectionTitle title="Thông tin tài khoản" description="Thông tin định danh và khôi phục được lưu trên máy chủ ERG." />
            <Stack divider={<Divider flexItem />}>
              <AccountRow label="Email đăng nhập" value={account.email} />
              <AccountRow
                label="Số điện thoại"
                value={account.phone || "Chưa cập nhật"}
                actionLabel="Cập nhật số điện thoại"
                onAction={() => { setPhone(account.phone ?? ""); setDialog("phone"); }}
              />
              <AccountRow
                label="Email khôi phục"
                value={account.lifecycle?.recoveryEmailMasked ?? "Chưa thiết lập"}
                detail={account.lifecycle?.recoveryEmailVerified ? "Đã xác minh" : "Chưa xác minh"}
                actionLabel="Cập nhật email khôi phục"
                onAction={() => setDialog("recovery")}
              />
            </Stack>
          </Paper>
          <Paper variant="outlined">
            <SectionTitle title="Bảo mật" description="Quản lý mật khẩu và phiên đăng nhập của chính bạn." />
            <Stack spacing={2} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <LockIcon color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 650 }} variant="body2">Mật khẩu</Typography>
                  <Typography color="text.secondary" variant="caption">Đổi mật khẩu sẽ thu hồi các phiên khác theo backend.</Typography>
                </Box>
              </Stack>
              <Button fullWidth variant="outlined" onClick={() => setDialog("password")}>Đổi mật khẩu</Button>
            </Stack>
          </Paper>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography component="h2" sx={{ fontWeight: 700 }} variant="subtitle1">Quyền truy cập LMS</Typography>
          <Typography color="text.secondary" variant="body2">Khả năng hiệu lực từ session; deny luôn thắng allow.</Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}>
            {effectiveCapabilities.length ? effectiveCapabilities.map(([label]) => <Chip color="info" key={label} label={label} variant="outlined" />) : (
              <Alert severity="warning">Session chưa có capability LMS hiệu lực.</Alert>
            )}
          </Stack>
        </Paper>
      </Stack>

      <Dialog fullWidth maxWidth="sm" open={Boolean(dialog)} onClose={closeDialog}>
        <DialogTitle>{dialogTitle(dialog)}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {dialog === "phone" ? <ErgTextField autoFocus label="Số điện thoại" value={phone} onChange={(event) => setPhone(event.target.value)} /> : null}
            {dialog === "recovery" ? (
              <>
                <ErgTextField autoFocus label="Email khôi phục" type="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} />
                {challenge ? <ErgTextField label="Mã xác minh" value={otp} onChange={(event) => setOtp(event.target.value)} /> : null}
              </>
            ) : null}
            {dialog === "password" ? (
              <>
                <ErgTextField autoFocus label="Mật khẩu hiện tại" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                <ErgTextField label="Mật khẩu mới" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                <ErgTextField label="Xác nhận mật khẩu mới" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={closeDialog}>Hủy</Button>
          {dialog === "phone" ? <Button disabled={busy} variant="contained" onClick={savePhone}>Lưu số điện thoại</Button> : null}
          {dialog === "recovery" ? <Button disabled={busy} variant="contained" onClick={challenge ? verifyRecovery : requestRecovery}>{challenge ? "Xác minh" : "Gửi mã xác minh"}</Button> : null}
          {dialog === "password" ? <Button disabled={busy} variant="contained" onClick={savePassword}>Lưu mật khẩu mới</Button> : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SectionTitle({ description, title }: { description: string; title: string }) {
  return <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2.5 }}><Typography sx={{ fontWeight: 700 }}>{title}</Typography><Typography color="text.secondary" variant="body2">{description}</Typography></Box>;
}

function AccountRow({ actionLabel, detail, label, onAction, value }: { actionLabel?: string; detail?: string; label: string; onAction?: () => void; value: string }) {
  return <Stack direction="row" spacing={2} sx={{ alignItems: "center", p: 2.5 }}><Box sx={{ flex: 1 }}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography sx={{ fontWeight: 650 }} variant="body2">{value}</Typography>{detail ? <Typography color="text.secondary" variant="caption">{detail}</Typography> : null}</Box>{actionLabel ? <Button size="small" onClick={onAction}>{actionLabel}</Button> : null}</Stack>;
}

function dialogTitle(dialog: AccountDialog) {
  if (dialog === "phone") return "Cập nhật số điện thoại";
  if (dialog === "recovery") return "Cập nhật email khôi phục";
  if (dialog === "password") return "Đổi mật khẩu";
  return "Tài khoản";
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]?.toUpperCase()).join("");
}

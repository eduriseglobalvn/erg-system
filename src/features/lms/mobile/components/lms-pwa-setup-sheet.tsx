import type { ComponentType, ReactNode } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";
import { MobileBottomSheet } from "./mobile-bottom-sheet";

type InstallPromptState = {
  canInstall: boolean; installed: boolean; isIos: boolean; isManualInstall: boolean;
  platform: "android" | "ios" | "desktop" | "unknown";
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

type NotificationSetupState = {
  busy: boolean;
  enableNotifications: () => Promise<"granted" | "denied" | "default" | "failed" | "unconfigured" | "unsupported">;
  error: string | null;
  state: "unsupported" | "blocked" | "default" | "enabled" | "unconfigured";
};

type MuiIcon = ComponentType<SvgIconProps>;

export function LmsPwaSetupSheet({ installPrompt, notifications, open, onOpenChange, workspace = "TEACHER" }: {
  installPrompt: InstallPromptState; notifications: NotificationSetupState; open: boolean; onOpenChange: (open: boolean) => void;
  workspace?: "TEACHER" | "STUDENT";
}) {
  const installReady = installPrompt.canInstall && !installPrompt.installed;
  const androidInstall = installPrompt.platform === "android";
  const manualInstall = installPrompt.isManualInstall;
  const workspaceLabel = workspace === "STUDENT" ? "Student Workspace" : "Teacher Workspace";

  return (
    <MobileBottomSheet description={`Mở nhanh ${workspaceLabel} như ứng dụng và nhận thông báo lớp học.`} onOpenChange={onOpenChange} open={open} title="Cài ERG Learning">
      <Stack spacing={1.5}>
        <SetupCard description={`${workspaceLabel} mở bằng cửa sổ riêng, có biểu tượng ERG và lối tắt đúng theo vai trò.`} icon={PhoneAndroidRoundedIcon} title="Thêm vào màn hình chính">
          {installPrompt.installed ? <StatusLine label="Đã cài trên thiết bị này." tone="success" /> : installReady ? (
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Button fullWidth onClick={() => void installPrompt.promptInstall()} startIcon={<DownloadRoundedIcon />} sx={{ minHeight: 48 }}>Thêm vào màn hình chính</Button>
              {androidInstall ? <><InstructionStep icon={DownloadRoundedIcon} text="Bấm nút trên để cài nhanh bằng Chrome." /><InstructionStep icon={MoreVertRoundedIcon} text="Nếu không hiện bảng cài đặt, mở menu ba chấm của Chrome." /><InstructionStep icon={PhoneAndroidRoundedIcon} text="Chọn Install app hoặc Add to Home screen." /></> : null}
            </Stack>
          ) : manualInstall ? (
            <Stack spacing={1} sx={{ mt: 2 }}><InstructionStep icon={IosShareRoundedIcon} text="Bấm nút Share của Safari." /><InstructionStep icon={DownloadRoundedIcon} text="Chọn Add to Home Screen." /><InstructionStep icon={CheckCircleRoundedIcon} text="Bấm Add để tạo biểu tượng ERG LMS." /></Stack>
          ) : androidInstall ? (
            <Stack spacing={1} sx={{ mt: 2 }}><InstructionStep icon={MoreVertRoundedIcon} text="Mở Chrome menu ba chấm ở góc trên." /><InstructionStep icon={DownloadRoundedIcon} text="Chọn Install app hoặc Add to Home screen." /><InstructionStep icon={CheckCircleRoundedIcon} text="Xác nhận Install để tạo biểu tượng ERG LMS." /></Stack>
          ) : <StatusLine label="Trình duyệt sẽ hiện nút cài khi PWA đủ điều kiện và chưa được cài." tone="warning" />}
        </SetupCard>

        <SetupCard description="Cho phép nhận thông báo lịch dạy, bài tập và đồng bộ ngay cả khi LMS không mở trên màn hình." icon={NotificationsActiveRoundedIcon} title="Thông báo nền">
          <NotificationStatus notifications={notifications} />
        </SetupCard>

        <Paper sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}><MoreVertRoundedIcon sx={{ color: "text.secondary", fontSize: 18, mt: 0.25 }} /><Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.7 }}>Trên Chrome Android, các lối tắt nằm trong menu khi nhấn giữ biểu tượng ERG. Trên iPhone, iOS chỉ cho thêm biểu tượng thủ công từ Safari.</Typography></Stack>
        </Paper>
      </Stack>
    </MobileBottomSheet>
  );
}

function SetupCard({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: MuiIcon; title: string }) {
  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ alignItems: "center", bgcolor: "primary.light", borderRadius: 1.75, color: "primary.dark", display: "flex", flexShrink: 0, height: 44, justifyContent: "center", width: 44 }}><Icon sx={{ fontSize: 21 }} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontSize: 14, fontWeight: 800 }}>{title}</Typography><Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.7, mt: 0.5 }}>{description}</Typography></Box>
      </Stack>
      {children}
    </Paper>
  );
}

function NotificationStatus({ notifications }: { notifications: NotificationSetupState }) {
  if (notifications.state === "enabled") return <StatusLine label="Đã bật thông báo trên thiết bị này." tone="success" />;
  if (notifications.state === "blocked") return <StatusLine label="Trình duyệt đang chặn thông báo. Hãy mở Settings của site để cấp quyền lại." tone="error" />;
  if (notifications.state === "unsupported") return <StatusLine label="Trình duyệt này chưa hỗ trợ Web Push cho PWA." tone="warning" />;
  if (notifications.state === "unconfigured") return <StatusLine label="Cần cấu hình VITE_WEB_PUSH_PUBLIC_KEY và backend push subscription." tone="warning" />;
  return <Box sx={{ mt: 2 }}><Button disabled={notifications.busy} fullWidth onClick={() => void notifications.enableNotifications()} startIcon={<NotificationsActiveRoundedIcon />} variant="outlined" sx={{ minHeight: 48 }}>{notifications.busy ? "Đang bật thông báo..." : "Bật thông báo"}</Button>{notifications.error ? <Typography color="error" sx={{ fontSize: 12, fontWeight: 600, mt: 1 }}>{notifications.error}</Typography> : null}</Box>;
}

function InstructionStep({ icon: Icon, text }: { icon: MuiIcon; text: string }) {
  return <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 1.5, minHeight: 44, px: 1.5 }}><Icon color="primary" sx={{ flexShrink: 0, fontSize: 18 }} /><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{text}</Typography></Stack>;
}

function StatusLine({ label, tone }: { label: string; tone: "success" | "warning" | "error" }) {
  return <Alert icon={tone === "success" ? <CheckCircleRoundedIcon /> : <ErrorOutlineRoundedIcon />} severity={tone} sx={{ fontSize: 12, fontWeight: 750, mt: 2 }}>{label}</Alert>;
}

import type { ComponentType, ReactNode } from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LaptopChromebookRoundedIcon from "@mui/icons-material/LaptopChromebookRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import OpenInBrowserRoundedIcon from "@mui/icons-material/OpenInBrowserRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";

import { MobileBottomSheet } from "./mobile-bottom-sheet";

type InstallPromptState = {
  canInstall: boolean;
  installed: boolean;
  isAndroid?: boolean;
  isDesktop?: boolean;
  isIos: boolean;
  isManualInstall: boolean;
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

export function LmsPwaSetupSheet({
  installPrompt,
  notifications,
  open,
  onOpenChange,
  workspace = "TEACHER",
}: {
  installPrompt: InstallPromptState;
  notifications: NotificationSetupState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: "TEACHER" | "STUDENT";
}) {
  const isStudent = workspace === "STUDENT";
  const appName = isStudent ? "ERG Learning" : "ERG Teacher";
  const workspaceLabel = isStudent ? "Student Workspace" : "Teacher Workspace";

  const isIos = installPrompt.isIos || installPrompt.platform === "ios";
  const isAndroid = installPrompt.platform === "android";
  const isDesktop = installPrompt.platform === "desktop";
  const installReady = installPrompt.canInstall && !installPrompt.installed;

  return (
    <MobileBottomSheet
      description={`Mở nhanh ${workspaceLabel} như ứng dụng độc lập và nhận thông báo học tập.`}
      onOpenChange={onOpenChange}
      open={open}
      title={`Cài đặt ${appName}`}
    >
      <Stack spacing={1.5}>
        {/* Device-tailored installation card */}
        {isIos ? (
          <SetupCard
            description={`Cài đặt ${appName} trên iPhone hoặc iPad qua Safari để mở ứng dụng toàn màn hình.`}
            icon={PhoneIphoneRoundedIcon}
            title="Thêm vào Màn hình chính iOS"
          >
            {installPrompt.installed ? (
              <StatusLine label={`Ứng dụng ${appName} đã được cài đặt trên thiết bị này.`} tone="success" />
            ) : (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <InstructionStep icon={OpenInBrowserRoundedIcon} text="Mở trang web bằng trình duyệt Safari." />
                <InstructionStep icon={IosShareRoundedIcon} text='Chạm vào biểu tượng Chia sẻ (Share) ở thanh dưới cùng Safari.' />
                <InstructionStep icon={DownloadRoundedIcon} text='Cuộn xuống và chọn "Thêm vào MH chính" (Add to Home Screen).' />
                <InstructionStep icon={CheckCircleRoundedIcon} text={`Chạm "Thêm" (Add) ở góc trên để tạo biểu tượng ${appName}.`} />
              </Stack>
            )}
          </SetupCard>
        ) : isAndroid ? (
          <SetupCard
            description={`Cài đặt ${appName} trên điện thoại Android để truy cập nhanh chóng và mượt mà.`}
            icon={PhoneAndroidRoundedIcon}
            title="Cài đặt trên Android"
          >
            {installPrompt.installed ? (
              <StatusLine label={`Ứng dụng ${appName} đã được cài đặt trên thiết bị này.`} tone="success" />
            ) : installReady ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  onClick={() => void installPrompt.promptInstall()}
                  startIcon={<DownloadRoundedIcon />}
                  sx={{ minHeight: 48 }}
                  variant="contained"
                >
                  Cài đặt ngay trên Android
                </Button>
                <InstructionStep icon={DownloadRoundedIcon} text="Chạm nút trên để xác nhận cài đặt nhanh qua Chrome." />
                <InstructionStep icon={MoreVertRoundedIcon} text="Nếu không thấy hộp thoại, mở menu ba chấm (⋮) ở góc trên Chrome." />
                <InstructionStep icon={PhoneAndroidRoundedIcon} text='Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính".' />
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <InstructionStep icon={MoreVertRoundedIcon} text="Mở menu ba chấm (⋮) ở góc trên trình duyệt Chrome." />
                <InstructionStep icon={DownloadRoundedIcon} text='Chọn "Cài đặt ứng dụng" (Install app) hoặc "Thêm vào MH chính".' />
                <InstructionStep icon={CheckCircleRoundedIcon} text={`Xác nhận để tạo biểu tượng ${appName} trên màn hình.`} />
              </Stack>
            )}
          </SetupCard>
        ) : (
          <SetupCard
            description={`Mở ${appName} trong cửa sổ riêng biệt như một phần mềm máy tính (Desktop App).`}
            icon={LaptopChromebookRoundedIcon}
            title="Cài đặt trên Máy tính"
          >
            {installPrompt.installed ? (
              <StatusLine label={`Ứng dụng ${appName} đã được cài đặt trên máy tính này.`} tone="success" />
            ) : installReady ? (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  onClick={() => void installPrompt.promptInstall()}
                  startIcon={<DownloadRoundedIcon />}
                  sx={{ minHeight: 48 }}
                  variant="contained"
                >
                  Cài đặt ứng dụng ngay
                </Button>
                <InstructionStep icon={DownloadRoundedIcon} text="Nhấn nút trên để cài đặt qua trình duyệt Chrome / Edge." />
                <InstructionStep icon={LaptopChromebookRoundedIcon} text="Hoặc bấm biểu tượng Cài đặt (⊕) trên thanh địa chỉ URL." />
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ mt: 2 }}>
                <InstructionStep icon={MoreVertRoundedIcon} text="Mở menu ba chấm (⋮) ở góc trên bên phải Chrome / Edge." />
                <InstructionStep icon={DownloadRoundedIcon} text='Chọn "Lưu và chia sẻ" > "Cài đặt trang web này thành ứng dụng".' />
                <InstructionStep icon={CheckCircleRoundedIcon} text={`Xác nhận Cài đặt để mở ${appName} trong cửa sổ riêng.`} />
              </Stack>
            )}
          </SetupCard>
        )}

        {/* Notifications card */}
        <SetupCard
          description={
            isStudent
              ? "Nhận thông báo khi giáo viên giao bài tập mới, có thông báo lớp học hoặc cập nhật kết quả thi."
              : "Cho phép nhận thông báo lịch dạy, bài tập và đồng bộ ngay cả khi LMS không mở trên màn hình."
          }
          icon={NotificationsActiveRoundedIcon}
          title="Thông báo học tập"
        >
          <NotificationStatus notifications={notifications} />
        </SetupCard>

        {/* Platform-specific footer tip */}
        <Paper sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
            <MoreVertRoundedIcon sx={{ color: "text.secondary", fontSize: 18, mt: 0.25 }} />
            <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.7 }}>
              {isIos
                ? "Lưu ý iOS: Safari là trình duyệt duy nhất trên iOS hỗ trợ thêm ứng dụng PWA vào Màn hình chính và nhận thông báo đẩy."
                : isAndroid
                  ? `Mẹo Android: Bạn có thể nhấn giữ biểu tượng ${appName} trên màn hình chính để mở nhanh các lối tắt bài tập và môn học.`
                  : isDesktop
                    ? `Mẹo máy tính: Sau khi cài đặt, bạn có thể ghim biểu tượng ${appName} vào Taskbar (Windows) hoặc Dock (macOS) để truy cập nhanh.`
                    : `Cài đặt ${appName} để nhận thông báo và làm bài tập ngay cả khi offline.`}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </MobileBottomSheet>
  );
}

function SetupCard({ children, description, icon: Icon, title }: { children: ReactNode; description: string; icon: MuiIcon; title: string }) {
  return (
    <Paper sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ alignItems: "center", bgcolor: "primary.light", borderRadius: 1.75, color: "primary.dark", display: "flex", flexShrink: 0, height: 44, justifyContent: "center", width: 44 }}>
          <Icon sx={{ fontSize: 21 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>{title}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.7, mt: 0.5 }}>
            {description}
          </Typography>
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}

function NotificationStatus({ notifications }: { notifications: NotificationSetupState }) {
  if (notifications.state === "enabled") return <StatusLine label="Đã bật thông báo trên thiết bị này." tone="success" />;
  if (notifications.state === "blocked") return <StatusLine label="Trình duyệt đang chặn thông báo. Hãy mở Cài đặt của trang để cấp quyền lại." tone="error" />;
  if (notifications.state === "unsupported") return <StatusLine label="Trình duyệt này chưa hỗ trợ Web Push cho PWA." tone="warning" />;
  if (notifications.state === "unconfigured") return <StatusLine label="Cần cấu hình VITE_WEB_PUSH_PUBLIC_KEY và backend push subscription." tone="warning" />;
  return (
    <Box sx={{ mt: 2 }}>
      <Button disabled={notifications.busy} fullWidth onClick={() => void notifications.enableNotifications()} startIcon={<NotificationsActiveRoundedIcon />} sx={{ minHeight: 48 }} variant="outlined">
        {notifications.busy ? "Đang bật thông báo..." : "Bật thông báo"}
      </Button>
      {notifications.error ? <Typography color="error" sx={{ fontSize: 12, fontWeight: 600, mt: 1 }}>{notifications.error}</Typography> : null}
    </Box>
  );
}

function InstructionStep({ icon: Icon, text }: { icon: MuiIcon; text: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 1.5, minHeight: 44, px: 1.5 }}>
      <Icon color="primary" sx={{ flexShrink: 0, fontSize: 18 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{text}</Typography>
    </Stack>
  );
}

function StatusLine({ label, tone }: { label: string; tone: "success" | "warning" | "error" }) {
  return (
    <Alert icon={tone === "success" ? <CheckCircleRoundedIcon /> : <ErrorOutlineRoundedIcon />} severity={tone} sx={{ fontSize: 12, fontWeight: 750, mt: 2 }}>
      {label}
    </Alert>
  );
}

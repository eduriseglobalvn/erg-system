import { useEffect, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { fetchWebPushConfig } from "@/features/notifications/api/notification-device-api";
import { usePwaNotifications } from "@/features/lms/mobile/hooks/use-pwa-notifications";
import { QUIZ_ACTIVE_ATTRIBUTE } from "@/features/notifications/push/push-floating-model";
import {
  readPushPromptRecord,
  shouldOfferPushPrompt,
  writePushPromptRecord,
} from "@/features/notifications/push/push-prompt-model";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type PushPortal = "lms" | "elearning";

const { color, radius, shadow } = ergEnterpriseTokens;
const countedAccounts = new Set<string>();

const pushSupported = () =>
  typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

/**
 * Mockup permission card. Renders only when the server reports push enabled (FCM, or Web Push with a VAPID key),
 * the browser can push (not iOS 15) and has not been asked yet; it never opens on page load.
 */
export function PushPermissionPrompt({ portal }: { portal?: PushPortal }) {
  const granted = Boolean(portal) && pushSupported() && Notification.permission === "granted";
  const askable = Boolean(portal) && pushSupported() && Notification.permission === "default";
  const config = useQuery({
    enabled: askable,
    queryFn: ({ signal }) => fetchWebPushConfig(portal, signal),
    queryKey: ["notifications", "web-push-config", portal],
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const data = config.data;
  if (granted && portal) return <PushDeviceKeeper key={portal} portal={portal} />;
  if (!askable || !portal || !data?.enabled || (data.provider !== "fcm" && !data.publicKey)) return null;
  return <PushPermissionCard key={portal} portal={portal} />;
}

/** Permission already granted: keeps this browser's device registered (heartbeat, re-subscribe) on every screen size. */
function PushDeviceKeeper({ portal }: { portal: PushPortal }) {
  usePwaNotifications(portal);
  return null;
}

function PushPermissionCard({ portal }: { portal: PushPortal }) {
  const notifications = usePwaNotifications(portal);
  const [accountId] = useState(() => getAuthScope(portal).accountId ?? "");
  const [open, setOpen] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (!accountId) return undefined;
    if (!countedAccounts.has(accountId)) {
      countedAccounts.add(accountId);
      const record = readPushPromptRecord(accountId);
      writePushPromptRecord(accountId, { ...record, visits: record.visits + 1 });
    }
    // Ask only after the user has done something on the page, never on load.
    const offer = () => {
      if (document.documentElement.hasAttribute(QUIZ_ACTIVE_ATTRIBUTE)) return;
      if (!shouldOfferPushPrompt(readPushPromptRecord(accountId), Date.now())) return;
      setOpen(true);
      stop();
    };
    const stop = () => {
      window.removeEventListener("pointerdown", offer);
      window.removeEventListener("keydown", offer);
    };
    window.addEventListener("pointerdown", offer);
    window.addEventListener("keydown", offer);
    return stop;
  }, [accountId]);

  const snooze = () => {
    const record = readPushPromptRecord(accountId);
    writePushPromptRecord(accountId, { ...record, snoozedAt: [...record.snoozedAt, Date.now()] });
    setOpen(false);
  };
  const enable = async () => {
    const outcome = await notifications.enableNotifications();
    // Firebase cannot push on this browser: keep the card with one explanation line instead of the button.
    if (outcome === "unsupported") setUnsupported(true);
    else setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={open}
      sx={{
        bottom: { xs: ergMobileDockAnchor(12), sm: "calc(env(safe-area-inset-bottom, 0px) + 24px)" },
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 24px), 420px)",
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Box
        aria-labelledby="erg-push-prompt-title"
        role="dialog"
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${radius.card}px`,
          boxShadow: shadow.float,
          display: "flex",
          gap: 1.5,
          p: 2,
          width: "100%",
        }}
      >
        <Box
          aria-hidden
          sx={{
            alignItems: "center",
            bgcolor: color.primarySofter,
            borderRadius: `${radius.control}px`,
            color: "primary.main",
            display: "flex",
            flexShrink: 0,
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <NotificationsActiveRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="erg-push-prompt-title" variant="subtitle2">
            Nhận thông báo từ ERG?
          </Typography>
          <Typography color="text.secondary" component="p" variant="caption">
            {portal === "elearning"
              ? "Em sẽ biết ngay khi có bài mới, sắp hết hạn nộp và khi có điểm. Tắt được bất cứ lúc nào trong mục Tôi."
              : "Nhận ngay thông báo mới và việc cần làm, kể cả khi không mở ERG. Tắt được bất cứ lúc nào trong trình duyệt."}
          </Typography>
          {unsupported ? (
            <Typography color="text.secondary" component="p" sx={{ mt: 1.5 }} variant="caption">
              Máy này chưa nhận được thông báo đẩy. Thông báo mới vẫn hiện ở biểu tượng chuông khi em mở ERG.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
              <ErgButton disabled={notifications.busy} onClick={() => void enable()} size="small" variant="outlined">
                Bật thông báo
              </ErgButton>
              <ErgButton onClick={snooze} size="small" variant="text">
                Để sau
              </ErgButton>
            </Box>
          )}
        </Box>
        <ErgIconButton label="Đóng" onClick={snooze} size="small" sx={{ alignSelf: "flex-start" }}>
          <CloseRoundedIcon fontSize="small" />
        </ErgIconButton>
      </Box>
    </Snackbar>
  );
}

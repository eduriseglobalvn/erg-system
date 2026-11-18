import { useEffect, useState, type ReactNode } from "react";
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
import { markDeniedHintSeen, pushServerReady, readDeniedHintSeen, shouldOfferPushPrompt } from "@/features/notifications/push/push-prompt-model";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type PushPortal = "lms" | "elearning";

const { color, radius, shadow } = ergEnterpriseTokens;
/** «Để sau» lasts for this app open only (a full reload asks again). */
const dismissedThisOpen = new Set<string>();

// iOS < 16.4, and iOS Safari outside an installed home-screen PWA, have no PushManager: nothing renders, nothing throws.
const pushSupported = () =>
  typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;

function useWebPushConfig(portal: PushPortal) {
  return useQuery({
    queryFn: ({ signal }) => fetchWebPushConfig(portal, signal),
    queryKey: ["notifications", "web-push-config", portal],
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  }).data;
}

/**
 * Push permission card. Signed in and the server can push: asks on every app open until this browser holds a
 * subscription; when permission is denied, shows a one-time hint on how to turn it back on.
 */
export function PushPermissionPrompt({ portal }: { portal?: PushPortal }) {
  if (!portal || !pushSupported()) return null;
  const accountId = getAuthScope(portal).accountId;
  if (!accountId) return null;
  if (Notification.permission === "denied") return <PushDeniedHint key={portal} accountId={accountId} portal={portal} />;
  return <PushPermissionCard key={portal} accountId={accountId} portal={portal} />;
}

function hasPushSubscription() {
  return navigator.serviceWorker.getRegistration().then((registration) => registration?.pushManager.getSubscription() ?? null);
}

function useQuizActive() {
  const read = () => document.documentElement.hasAttribute(QUIZ_ACTIVE_ATTRIBUTE);
  const [active, setActive] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setActive(read()));
    observer.observe(document.documentElement, { attributeFilter: [QUIZ_ACTIVE_ATTRIBUTE], attributes: true });
    return () => observer.disconnect();
  }, []);
  return active;
}

function PushPermissionCard({ accountId, portal }: { accountId: string; portal: PushPortal }) {
  // Also keeps an already-subscribed device registered (heartbeat, re-subscribe).
  const notifications = usePwaNotifications(portal);
  const config = useWebPushConfig(portal);
  const quizActive = useQuizActive();
  const dismissKey = `${portal}:${accountId}`;
  const [dismissed, setDismissed] = useState(() => dismissedThisOpen.has(dismissKey));
  const [subscriptionMissing, setSubscriptionMissing] = useState<boolean | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    let alive = true;
    hasPushSubscription().then(
      (subscription) => alive && setSubscriptionMissing(!subscription),
      () => alive && setSubscriptionMissing(false),
    );
    return () => {
      alive = false;
    };
  }, []);

  const offer = shouldOfferPushPrompt({
    dismissed,
    quizActive,
    serverReady: pushServerReady(config),
    state: notifications.state,
    subscriptionMissing,
  });

  const snooze = () => {
    dismissedThisOpen.add(dismissKey);
    setDismissed(true);
  };
  const enable = async () => {
    // Called from the button click: iOS only grants inside a user gesture.
    const outcome = await notifications.enableNotifications();
    if (outcome === "unsupported") setUnsupported(true);
    else if (outcome !== "granted") snooze();
  };

  return (
    <PushCard
      actions={
        unsupported ? (
          <Typography color="text.secondary" component="p" sx={{ mt: 1.5 }} variant="caption">
            Máy này chưa nhận được thông báo đẩy. Thông báo mới vẫn hiện ở biểu tượng chuông khi mở ERG.
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
        )
      }
      onClose={snooze}
      open={offer || (unsupported && !dismissed)}
      title="Nhận thông báo từ ERG?"
    >
      {portal === "elearning"
        ? "Em sẽ biết ngay khi có bài mới, sắp hết hạn nộp và khi có điểm. Tắt được bất cứ lúc nào trong mục Tôi."
        : "Nhận ngay thông báo mới và việc cần làm, kể cả khi không mở ERG. Tắt được bất cứ lúc nào trong trình duyệt."}
    </PushCard>
  );
}

function PushDeniedHint({ accountId, portal }: { accountId: string; portal: PushPortal }) {
  const config = useWebPushConfig(portal);
  const [seen] = useState(() => readDeniedHintSeen(accountId));
  const [open, setOpen] = useState(true);
  const show = !seen && open && pushServerReady(config);

  useEffect(() => {
    if (show) markDeniedHintSeen(accountId);
  }, [accountId, show]);

  return (
    <PushCard
      actions={
        <Box sx={{ display: "flex", mt: 1.5 }}>
          <ErgButton onClick={() => setOpen(false)} size="small" variant="text">
            Đã hiểu
          </ErgButton>
        </Box>
      }
      onClose={() => setOpen(false)}
      open={show}
      title="Thông báo đang bị chặn"
    >
      Muốn nhận lại: bấm biểu tượng ổ khóa cạnh địa chỉ trang → Thông báo → Cho phép. Trên iPhone: Cài đặt → Thông báo → ERG.
    </PushCard>
  );
}

function PushCard({ actions, children, onClose, open, title }: { actions: ReactNode; children: ReactNode; onClose: () => void; open: boolean; title: string }) {
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
            {title}
          </Typography>
          <Typography color="text.secondary" component="p" variant="caption">
            {children}
          </Typography>
          {actions}
        </Box>
        <ErgIconButton label="Đóng" onClick={onClose} size="small" sx={{ alignSelf: "flex-start" }}>
          <CloseRoundedIcon fontSize="small" />
        </ErgIconButton>
      </Box>
    </Snackbar>
  );
}

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Notifications from "@mui/icons-material/Notifications";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import CampaignIcon from "@mui/icons-material/Campaign";
import DnsIcon from "@mui/icons-material/Dns";
import EventNoteIcon from "@mui/icons-material/EventNote";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsIcon from "@mui/icons-material/Settings";
import TagIcon from "@mui/icons-material/Tag";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { alpha, type Theme } from "@mui/material/styles";

import { ErgButton, ErgIconButton, ErgStatusChip } from "@/components/erg-mui";
import {
  fetchNotificationDetail,
  fetchNotificationFeed,
  fetchUnreadNotificationCount,
  markNotificationRead,
  notificationQueryKeys,
  resolveNotificationQueryScope,
  type LmsNotificationType,
  type NotificationDetailItem,
  type NotificationFeedItem,
} from "@/features/notifications/api/notification-api";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const LMS_NOTIFICATION_PORTAL = "lms";

const primaryTint = (theme: Theme) => alpha(theme.palette.primary.main, 0.1);
const cardSx = { border: 1, borderColor: "divider", bgcolor: "background.paper", boxShadow: ergEnterpriseTokens.shadow.sm } as const;
const lineClamp2 = { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as const;

export function LmsNotificationListPage({
  onOpenDetail,
}: {
  onOpenDetail: (notificationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const notificationScope = resolveNotificationQueryScope(LMS_NOTIFICATION_PORTAL);
  const notificationsQuery = useQuery({
    queryKey: notificationQueryKeys.inbox(LMS_NOTIFICATION_PORTAL, tab, 0, 30, notificationScope),
    queryFn: ({ signal }) => fetchNotificationFeed({ portal: LMS_NOTIFICATION_PORTAL, status: tab, page: 0, size: 30 }, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(LMS_NOTIFICATION_PORTAL, notificationScope),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(LMS_NOTIFICATION_PORTAL, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId, LMS_NOTIFICATION_PORTAL),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL, notificationScope) });
    },
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const newNotifications = notifications.slice(0, 3);
  const previousNotifications = notifications.slice(3);
  const unreadTotal = unreadCountQuery.data?.unread ?? notifications.filter((notification) => notification.unread).length;

  function openNotification(notification: NotificationFeedItem) {
    if (notification.unread) {
      markReadMutation.mutate(notification.id);
    }
    onOpenDetail(notification.id);
  }

  if (isMobile) {
    return (
      <Box component="section" sx={{ minHeight: "100%", bgcolor: "background.default", px: 1.5, pb: 2, pt: 1.5, color: "text.primary" }}>
        <Box sx={{ ...cardSx, borderRadius: 3, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: "fontWeightBold", color: "primary.main" }}>Thông báo</Typography>
              <Typography variant="h6" component="h1" sx={{ mt: 0.5, fontWeight: "fontWeightBold" }}>Hộp thư LMS</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, fontWeight: "fontWeightMedium", color: "text.secondary" }}>{unreadTotal} thông báo chưa đọc</Typography>
            </Box>
            <ErgIconButton label="Cài đặt thông báo" sx={{ width: 44, height: 44, bgcolor: "background.default", color: "text.secondary" }}>
              <SettingsIcon fontSize="small" />
            </ErgIconButton>
          </Box>
          <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", borderRadius: 2, bgcolor: "background.default", p: 0.5 }}>
            <NotificationListTab active={tab === "all"} label="Tất cả" onClick={() => setTab("all")} />
            <NotificationListTab active={tab === "unread"} label="Chưa đọc" onClick={() => setTab("unread")} />
          </Box>
        </Box>

        <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
          {notificationsQuery.isLoading ? (
            <NotificationListState label="Đang tải thông báo..." />
          ) : notificationsQuery.isError ? (
            <NotificationListState label="Không tải được thông báo." />
          ) : notifications.length ? (
            notifications.map((notification) => (
              <ButtonBase
                key={notification.id}
                onClick={() => openNotification(notification)}
                sx={{ ...cardSx, display: "flex", minHeight: 92, width: "100%", alignItems: "flex-start", justifyContent: "flex-start", gap: 1.5, borderRadius: 2.75, p: 2, textAlign: "left" }}
              >
                <NotificationDetailIcon notification={notification} />
                <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" component="span" sx={{ ...lineClamp2, fontWeight: "fontWeightBold" }}>{notification.title}</Typography>
                  <Typography variant="body2" component="span" sx={{ ...lineClamp2, mt: 0.5, fontWeight: "fontWeightMedium", color: "text.secondary" }}>{notification.description}</Typography>
                  <Typography variant="caption" component="span" sx={{ mt: 1, display: "block", fontWeight: "fontWeightBold", color: "text.disabled" }}>{notification.timeLabel}</Typography>
                </Box>
                {notification.unread ? <Box component="span" sx={{ mt: 1, width: 12, height: 12, flexShrink: 0, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
              </ButtonBase>
            ))
          ) : (
            <NotificationListState label={tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."} />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ mx: "auto", display: "flex", minHeight: "100%", maxWidth: 780, flexDirection: "column", px: 2, py: 3 }}>
      <Box sx={{ ...cardSx, overflow: "hidden", borderRadius: 2 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, borderBottom: 1, borderColor: "divider", px: 2.5, py: 2.5 }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: "fontWeightBold" }}>Thông báo</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: "fontWeightMedium", color: "text.secondary" }}>{unreadTotal} thông báo chưa đọc</Typography>
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <NotificationPill active={tab === "all"} label="Tất cả" onClick={() => setTab("all")} />
              <NotificationPill active={tab === "unread"} label="Chưa đọc" onClick={() => setTab("unread")} />
            </Box>
          </Box>
          <ErgIconButton label="Cài đặt thông báo" sx={{ width: 36, height: 36, color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "text.primary" } }}>
            <SettingsIcon fontSize="small" />
          </ErgIconButton>
        </Box>

        <Box sx={{ px: 2.5, pb: 2.5, pt: 2 }}>
          {notificationsQuery.isLoading ? (
            <NotificationListState label="Đang tải thông báo..." />
          ) : notificationsQuery.isError ? (
            <NotificationListState label="Không tải được thông báo." />
          ) : notifications.length ? (
            <>
              <NotificationSection title="Mới" notifications={newNotifications} onOpenDetail={openNotification} />
              <NotificationSection title="Trước đó" notifications={previousNotifications} onOpenDetail={openNotification} />
            </>
          ) : (
            <NotificationListState label={tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."} />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function LmsNotificationDetailPage({
  notificationId,
  onBack,
}: {
  notificationId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const autoMarkedRef = useRef<string | null>(null);
  const notificationScope = resolveNotificationQueryScope(LMS_NOTIFICATION_PORTAL);
  const notificationQuery = useQuery({
    queryKey: notificationQueryKeys.detail(LMS_NOTIFICATION_PORTAL, notificationId, notificationScope),
    queryFn: ({ signal }) => fetchNotificationDetail(notificationId, LMS_NOTIFICATION_PORTAL, signal),
    enabled: Boolean(notificationId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    gcTime: QUERY_POLICIES.realtime.gcTime,
  });
  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationRead(id, LMS_NOTIFICATION_PORTAL),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL, notificationScope) });
    },
  });
  const notification = notificationQuery.data;

  useEffect(() => {
    if (!notification?.unread || autoMarkedRef.current === notification.id) return;
    autoMarkedRef.current = notification.id;
    markRead(notification.id);
  }, [markRead, notification?.id, notification?.unread]);

  if (notificationQuery.isLoading) {
    return (
      <Box component="section" sx={{ mx: "auto", display: "flex", minHeight: "100%", maxWidth: 768, flexDirection: "column", justifyContent: "center", px: 3, py: 6 }}>
        <Typography variant="body2" component="div" sx={{ ...cardSx, borderRadius: 1, p: 4, fontWeight: "fontWeightMedium", color: "text.secondary" }}>
          Đang tải thông báo...
        </Typography>
      </Box>
    );
  }

  if (!notification || notificationQuery.isError) {
    return <NotificationNotFound onBack={onBack} />;
  }

  if (isMobile) {
    return (
      <Box component="section" sx={{ minHeight: "100%", bgcolor: "background.default", px: 1.5, pb: 2, pt: 1.5, color: "text.primary" }}>
        <ErgButton
          variant="text"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={onBack}
          sx={{ mb: 1.5, height: 44, borderRadius: 2, bgcolor: "background.paper", px: 1.5, color: "text.secondary", boxShadow: ergEnterpriseTokens.shadow.xs }}
        >
          Quay lại
        </ErgButton>
        <Box component="article" sx={{ ...cardSx, borderRadius: 3, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotificationDetailIcon notification={notification} />
            <ErgStatusChip label={notificationLabel(notification.type)} tone={notificationTone(notification.type)} dot={false} />
            {notification.unread ? <ErgStatusChip label="Chưa đọc" tone="info" dot={false} /> : null}
          </Box>
          <Typography variant="h5" component="h1" sx={{ mt: 2.5, fontWeight: "fontWeightBold", lineHeight: 1.25 }}>{notification.title}</Typography>
          <Typography variant="body1" sx={{ mt: 2, fontWeight: "fontWeightMedium", lineHeight: 1.75, color: "text.secondary" }}>{notification.body || notification.description}</Typography>
          <Box sx={{ mt: 2.5, display: "grid", gap: 1.5 }}>
            <MetaItem icon={EventNoteIcon} label="Thời gian" value={notification.timeLabel} />
            <MetaItem icon={DnsIcon} label="Loại thông báo" value={notificationLabel(notification.type)} />
            <MetaItem icon={TagIcon} label="Mã thông báo" value={notification.id} />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="section" sx={{ mx: "auto", display: "flex", minHeight: "100%", maxWidth: 1152, flexDirection: "column", gap: 2, px: { xs: 2.5, lg: 4 }, py: 2.5 }}>
      <ErgButton variant="text" startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ width: "fit-content", px: 1, color: "text.secondary" }}>
        Danh sách thông báo
      </ErgButton>

      <Box component="article" sx={{ ...cardSx, overflow: "hidden", borderRadius: 1.5 }}>
        <Box sx={{ display: "grid", gap: 0, gridTemplateColumns: { lg: "minmax(0,1fr) 300px" } }}>
          <Box sx={{ px: { xs: 2.5, md: 3.5 }, py: { xs: 2.5, md: 3 } }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <NotificationDetailIcon notification={notification} />
              <ErgStatusChip label={notificationLabel(notification.type)} tone={notificationTone(notification.type)} dot={false} />
              {notification.unread ? <ErgStatusChip label="Chưa đọc" tone="success" dot={false} /> : null}
            </Box>

            <Typography variant="h5" component="h1" sx={{ mt: 2.5, maxWidth: 768, fontWeight: "fontWeightBold", lineHeight: 1.25 }}>{notification.title}</Typography>
            <Typography variant="body1" sx={{ mt: 2, maxWidth: 768, fontWeight: "fontWeightMedium", lineHeight: 1.75, color: "text.secondary" }}>{notification.description}</Typography>

            <Box sx={{ mt: 3, borderRadius: 1.5, border: 1, borderColor: "divider", bgcolor: "background.default", p: 2 }}>
              <Typography variant="body2" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "fontWeightBold" }}>
                <Notifications fontSize="small" />
                Nội dung xử lý
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, fontWeight: "fontWeightMedium", lineHeight: 1.75, color: "text.secondary" }}>
                {notification.body || "Thông báo này dùng để giáo viên nắm thay đổi mới nhất và mở đúng nghiệp vụ liên quan khi cần kiểm tra lại dữ liệu."}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ borderTop: { xs: 1, lg: 0 }, borderLeft: { lg: 1 }, borderColor: "divider", bgcolor: "background.default", p: 2.5 }}>
            <Typography variant="body2" component="h2" sx={{ fontWeight: "fontWeightBold", textTransform: "uppercase", color: "text.disabled" }}>Thông tin</Typography>
            <Box component="dl" sx={{ mt: 2, mb: 0, display: "grid", gap: 1.5 }}>
              <MetaItem icon={EventNoteIcon} label="Thời gian" value={notification.timeLabel} />
              <MetaItem icon={DnsIcon} label="Loại thông báo" value={notificationLabel(notification.type)} />
              <MetaItem icon={TagIcon} label="Mã thông báo" value={notification.id} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function NotificationNotFound({ onBack }: { onBack: () => void }) {
  return (
    <Box component="section" sx={{ mx: "auto", display: "flex", minHeight: "100%", maxWidth: 768, flexDirection: "column", justifyContent: "center", px: 3, py: 6 }}>
      <Box sx={{ ...cardSx, borderRadius: 1, p: 4 }}>
        <ErgStatusChip label="Không tìm thấy" tone="error" dot={false} />
        <Typography variant="h6" component="h1" sx={{ mt: 2, fontWeight: "fontWeightMedium" }}>Thông báo không tồn tại</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>Thông báo này có thể đã bị xóa hoặc đường dẫn không còn hợp lệ.</Typography>
        <ErgButton variant="contained" startIcon={<ArrowBackIcon />} sx={{ mt: 3 }} onClick={onBack}>
          Quay lại danh sách
        </ErgButton>
      </Box>
    </Box>
  );
}

function NotificationListTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={[
        { height: 40, borderRadius: 1.5, typography: "body2", fontWeight: "fontWeightBold", color: "text.secondary", transition: "all 0.15s ease" },
        active && { bgcolor: "background.paper", color: "primary.main", boxShadow: ergEnterpriseTokens.shadow.xs },
      ]}
    >
      {label}
    </ButtonBase>
  );
}

function NotificationPill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={[
        { borderRadius: 9999, px: 2, py: 1, typography: "body2", fontWeight: "fontWeightBold", transition: "all 0.15s ease" },
        active ? { bgcolor: primaryTint, color: "primary.main" } : { color: "text.secondary", "&:hover": { bgcolor: "action.hover" } },
      ]}
    >
      {label}
    </ButtonBase>
  );
}

function NotificationListState({ label }: { label: string }) {
  return (
    <Typography
      variant="body2"
      component="div"
      sx={{ borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "background.paper", px: 2, py: 4, textAlign: "center", fontWeight: "fontWeightMedium", color: "text.secondary" }}
    >
      {label}
    </Typography>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: typeof EventNoteIcon; label: string; value: string }) {
  return (
    <Box sx={{ borderRadius: 1.5, border: 1, borderColor: "divider", bgcolor: "background.paper", p: 1.5 }}>
      <Typography variant="caption" component="div" sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: "fontWeightBold", textTransform: "uppercase", color: "text.disabled" }}>
        <Icon fontSize="inherit" />
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ mt: 1, overflowWrap: "break-word", fontWeight: "fontWeightBold" }}>{value}</Typography>
    </Box>
  );
}

function NotificationSection({
  notifications,
  onOpenDetail,
  title,
}: {
  notifications: NotificationFeedItem[];
  onOpenDetail: (notification: NotificationFeedItem) => void;
  title: string;
}) {
  if (!notifications.length) return null;

  return (
    <Box component="section" sx={{ mt: 2.5, "&:first-of-type": { mt: 0 } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 0.5 }}>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: "fontWeightBold" }}>{title}</Typography>
      </Box>
      <Box sx={{ mt: 1.5, display: "grid", gap: 1.5 }}>
        {notifications.map((notification) => (
          <ButtonBase
            key={notification.id}
            onClick={() => onOpenDetail(notification)}
            sx={{
              display: "grid",
              width: "100%",
              gridTemplateColumns: "56px minmax(0,1fr) auto",
              alignItems: "flex-start",
              gap: 1.5,
              borderRadius: 2,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              px: 1.5,
              py: 2,
              textAlign: "left",
              boxShadow: ergEnterpriseTokens.shadow.xs,
              transition: "all 0.15s ease",
              "&:hover": { borderColor: "primary.main", bgcolor: "background.default", boxShadow: ergEnterpriseTokens.shadow.sm },
              "&:hover [data-more-icon]": { opacity: 1 },
            }}
          >
            <NotificationDetailIcon notification={notification} />
            <Box component="span" sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" component="span" sx={{ display: "block", fontWeight: "fontWeightMedium" }}>
                <Box component="span" sx={{ fontWeight: "fontWeightBold" }}>{notificationLabel(notification.type)}</Box> · {notification.title}
              </Typography>
              <Typography variant="body2" component="span" sx={{ mt: 0.5, display: "block", maxWidth: 470, color: "text.secondary" }}>{notification.description}</Typography>
              <Typography variant="caption" component="span" sx={{ mt: 0.5, display: "block", fontWeight: "fontWeightBold", color: "text.secondary" }}>{notification.timeLabel}</Typography>
            </Box>
            <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box component="span" sx={{ display: { xs: "none", md: "block" }, height: 56, width: 96, borderRadius: 1, background: notificationThumbnailBackground(notification.type) }} />
              {notification.unread ? <Box component="span" sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "primary.main" }} /> : null}
              <MoreVertIcon data-more-icon="" fontSize="small" sx={{ color: "text.secondary", opacity: 0, transition: "opacity 0.15s ease" }} />
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}

function NotificationDetailIcon({ notification }: { notification: NotificationFeedItem | NotificationDetailItem }) {
  const Icon = notification.type === "company" ? BusinessIcon : notification.type === "system" ? DnsIcon : CampaignIcon;

  return (
    <Box
      component="span"
      sx={{ display: "grid", width: 48, height: 48, flexShrink: 0, placeItems: "center", borderRadius: "50%", color: "common.white", bgcolor: notificationIconColor(notification.type) }}
    >
      <Icon fontSize="small" />
    </Box>
  );
}

function notificationLabel(type: LmsNotificationType) {
  if (type === "company") return "Công ty";
  if (type === "system") return "Hệ thống";
  return "Lớp học";
}

function notificationTone(type: LmsNotificationType) {
  if (type === "company") return "neutral" as const;
  if (type === "system") return "info" as const;
  return "warning" as const;
}

function notificationIconColor(type: LmsNotificationType) {
  if (type === "company") return "text.secondary";
  if (type === "system") return "primary.main";
  return "warning.main";
}

function notificationThumbnailBackground(type: LmsNotificationType) {
  return (theme: Theme) => {
    const base = type === "company" ? theme.palette.text.primary : type === "system" ? theme.palette.primary.main : theme.palette.warning.main;
    return `linear-gradient(135deg, ${base}, ${alpha(base, 0.35)})`;
  };
}

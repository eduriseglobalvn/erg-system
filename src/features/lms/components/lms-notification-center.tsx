import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import {
  Business,
  Campaign,
  MarkEmailRead,
  Notifications,
  NotificationsNone,
  Settings,
} from "@mui/icons-material";
import { toast } from "sonner";

import {
  fetchNotificationFeed,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  notificationQueryKeys,
  resolveNotificationQueryScope,
  type LmsNotificationType,
  type NotificationFeedItem,
} from "@/features/notifications/api/notification-api";
import { useNavigate } from "@/routes/router-compat";

const LMS_NOTIFICATION_PORTAL = "lms";

export function LmsNotificationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shownToastRef = useRef<string | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const notificationScope = resolveNotificationQueryScope(LMS_NOTIFICATION_PORTAL);

  const notificationsQuery = useQuery({
    queryKey: notificationQueryKeys.inbox(LMS_NOTIFICATION_PORTAL, tab, 0, 5, notificationScope),
    queryFn: () => fetchNotificationFeed({ portal: LMS_NOTIFICATION_PORTAL, status: tab, page: 0, size: 5 }),
    staleTime: 30_000,
  });
  const unreadCountQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount(LMS_NOTIFICATION_PORTAL, notificationScope),
    queryFn: () => fetchUnreadNotificationCount(LMS_NOTIFICATION_PORTAL),
    staleTime: 30_000,
  });
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId, LMS_NOTIFICATION_PORTAL),
    onSuccess: invalidateNotificationQueries,
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(LMS_NOTIFICATION_PORTAL),
    onSuccess: invalidateNotificationQueries,
  });

  const notifications = notificationsQuery.data?.items ?? [];
  const latestNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);
  const unreadCount = unreadCountQuery.data?.unread ?? notifications.filter((item) => item.unread).length;
  const newestSystemNotification = useMemo(
    () => notifications.find((item) => item.type === "system" && item.unread),
    [notifications],
  );

  useEffect(() => {
    if (!newestSystemNotification || shownToastRef.current === newestSystemNotification.id) return;

    shownToastRef.current = newestSystemNotification.id;
    const timeoutId = window.setTimeout(() => {
      showSystemToast(newestSystemNotification, openNotificationDetail);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [newestSystemNotification?.id]);

  function invalidateNotificationQueries() {
    void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root(LMS_NOTIFICATION_PORTAL, notificationScope) });
  }

  function markAllAsRead() {
    void markAllReadMutation.mutateAsync();
  }

  function openNotification(notification: NotificationFeedItem) {
    if (notification.unread) {
      markReadMutation.mutate(notification.id);
    }
    openNotificationDetail(notification);
  }

  function openNotificationDetail(notification: NotificationFeedItem) {
    setAnchorEl(null);
    navigate(`/notifications/${notification.id}`);
  }

  function handleOpen(event: React.MouseEvent<HTMLElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: "text.secondary",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        {unreadCount > 0 ? (
          <Badge badgeContent={unreadCount > 99 ? "99+" : unreadCount} color="error">
            <Notifications sx={{ fontSize: 22 }} />
          </Badge>
        ) : (
          <NotificationsNone sx={{ fontSize: 22 }} />
        )}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 470,
              maxWidth: "calc(100vw - 20px)",
              borderRadius: 3,
              boxShadow: "0 18px 44px rgba(15,23,42,0.14)",
              overflow: "hidden",
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Thông báo</Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                onClick={markAllAsRead}
                disabled={!unreadCount || markAllReadMutation.isPending}
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "primary.main",
                  textTransform: "none",
                  borderRadius: 1.5,
                }}
                startIcon={<MarkEmailRead sx={{ fontSize: 16 }} />}
              >
                Đọc tất cả
              </Button>
              <IconButton size="small" sx={{ color: "text.secondary" }}>
                <Settings sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Tabs */}
          <Stack direction="row" spacing={1}>
            <Chip
              label="Tất cả"
              onClick={() => setTab("all")}
              variant={tab === "all" ? "filled" : "outlined"}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: tab === "all" ? "primary.light" : "transparent",
                color: tab === "all" ? "primary.main" : "text.secondary",
                "&:hover": { bgcolor: tab === "all" ? "primary.light" : "action.hover" },
              }}
            />
            <Chip
              label="Chưa đọc"
              onClick={() => setTab("unread")}
              variant={tab === "unread" ? "filled" : "outlined"}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: tab === "unread" ? "primary.light" : "transparent",
                color: tab === "unread" ? "primary.main" : "text.secondary",
                "&:hover": { bgcolor: tab === "unread" ? "primary.light" : "action.hover" },
              }}
            />
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ maxHeight: 470, overflow: "auto" }}>
          {notificationsQuery.isLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>Đang tải thông báo...</Typography>
            </Box>
          ) : notificationsQuery.isError ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "error.main", fontWeight: 500 }}>Không tải được thông báo.</Typography>
            </Box>
          ) : latestNotifications.length ? (
            <>
              {/* Important */}
              <Box sx={{ px: 3, py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Quan trọng</Typography>
                  <Button
                    size="small"
                    onClick={() => navigate("/notifications")}
                    sx={{ fontSize: 12, fontWeight: 600, color: "primary.main", textTransform: "none", p: 0 }}
                  >
                    Xem tất cả
                  </Button>
                </Box>
                {latestNotifications.slice(0, 1).map((notification) => (
                  <NotificationFeedCard
                    key={notification.id}
                    notification={notification}
                    unread={notification.unread}
                    onOpen={() => openNotification(notification)}
                    thumbnail
                  />
                ))}
              </Box>

              <Divider />

              {/* Others */}
              <Box sx={{ px: 3, py: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>Các thông báo khác</Typography>
                {latestNotifications.slice(1).map((notification) => (
                  <NotificationFeedCard
                    key={notification.id}
                    notification={notification}
                    unread={notification.unread}
                    onOpen={() => openNotification(notification)}
                    thumbnail={notification.type === "general"}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                {tab === "unread" ? "Không còn thông báo chưa đọc." : "Chưa có thông báo."}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Divider />
        <Box sx={{ px: 3, py: 1.5 }}>
          <Button
            fullWidth
            onClick={() => navigate("/notifications")}
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "primary.main",
              textTransform: "none",
              borderRadius: 2,
              py: 1,
            }}
          >
            Xem tất cả thông báo
          </Button>
        </Box>
      </Popover>
    </>
  );
}

function NotificationFeedCard({
  notification,
  onOpen,
  thumbnail,
  unread,
}: {
  notification: NotificationFeedItem;
  onOpen: () => void;
  thumbnail?: boolean;
  unread: boolean;
}) {
  const iconClass = notificationIconClass(notification.type);
  const Icon = notification.type === "company" ? Business : notification.type === "system" ? Notifications : Campaign;

  return (
    <ListItemButton
      onClick={onOpen}
      sx={{
        borderRadius: 2,
        mb: 1,
        px: 2,
        py: 1.5,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        "&:hover": {
          bgcolor: "action.hover",
          borderColor: "primary.light",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 52 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: iconClass.bg,
            color: "white",
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{notificationLabel(notification.type)}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>· {notification.title}</Typography>
          </Box>
        }
        secondary={
          <>
            <Typography sx={{ fontSize: 13, color: "text.secondary", display: "block" }}>
              {notification.description}
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: "text.disabled", mt: 0.5 }}>
              {notification.timeLabel}
            </Typography>
          </>
        }
      />
      {thumbnail && (
        <Box
          sx={{
            width: 60,
            height: 40,
            borderRadius: 1,
            bgcolor: notificationThumbnailClass(notification.type),
            mr: 1,
            display: { xs: "none", md: "block" },
          }}
        />
      )}
      {unread && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "primary.main",
            flexShrink: 0,
          }}
        />
      )}
    </ListItemButton>
  );
}

function notificationIconClass(type: LmsNotificationType) {
  if (type === "company") return { bg: "grey.700" };
  if (type === "system") return { bg: "primary.main" };
  return { bg: "warning.main" };
}

function notificationThumbnailClass(type: LmsNotificationType) {
  if (type === "company") return "linear-gradient(135deg, #0f172a, #64748b)";
  if (type === "system") return "linear-gradient(135deg, #0068d9, #9cc9ff)";
  return "linear-gradient(135deg, #f59e0b, #fde68a)";
}

function notificationLabel(type: LmsNotificationType) {
  if (type === "company") return "Công ty";
  if (type === "system") return "Hệ thống";
  return "Lớp học";
}

function showSystemToast(notification: NotificationFeedItem, onOpenDetail: (notification: NotificationFeedItem) => void) {
  toast.custom(
    (toastId) => (
      <Box
        sx={{
          position: "relative",
          display: "flex",
          width: 380,
          maxWidth: "calc(100vw - 32px)",
          alignItems: "flex-start",
          gap: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "primary.light",
          bgcolor: "background.paper",
          p: 2.5,
          pr: 5,
          boxShadow: "0 16px 42px rgba(15,23,42,0.16)",
        }}
      >
        <Button
          onClick={() => {
            toast.dismiss(toastId);
            onOpenDetail(notification);
          }}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            minWidth: 0,
            borderRadius: 3,
            p: 2.5,
            justifyContent: "flex-start",
            textAlign: "left",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "primary.main",
                color: "white",
                flexShrink: 0,
              }}
            >
              <Notifications sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Chip
                  label="Hệ thống"
                  size="small"
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    bgcolor: "primary.light",
                    color: "primary.main",
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                  }}
                />
                <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
                  {notification.timeLabel}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                {notification.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.5 }}>
                {notification.description}
              </Typography>
            </Box>
          </Box>
        </Button>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toast.dismiss(toastId);
          }}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "text.secondary",
          }}
        >
          <Settings sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    ),
    { className: "lms-system-toast", duration: 5200 },
  );
}

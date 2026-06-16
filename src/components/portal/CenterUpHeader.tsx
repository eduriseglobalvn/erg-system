"use client";

import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import { useState, type ReactNode } from "react";

interface Notification {
  id: string;
  type: "reminder" | "success" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface HeaderProps {
  centerName?: string;
  headerControls?: ReactNode;
  headerTrailingControls?: ReactNode;
  hideIdentity?: boolean;
  portalPlan?: string;
  portalName?: string;
  notificationCount?: number;
  scrolled?: boolean;
  userName?: string;
}

const HEADER_GLASS_BG = "rgba(250,252,255,0.70)";
const HEADER_NETWORK_SHADOW =
  "rgba(145, 158, 171, 0.2) 0px 2px 1px -1px, rgba(145, 158, 171, 0.14) 0px 1px 1px 0px, rgba(145, 158, 171, 0.12) 0px 1px 3px 0px";

export default function CenterUpHeader({
  centerName,
  headerControls,
  headerTrailingControls,
  hideIdentity = false,
  portalPlan,
  portalName,
  notificationCount = 0,
  scrolled = false,
  userName,
}: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const displayCenter = centerName || portalName || "ERG Education";
  const displayPlan = portalPlan ?? "ADVANCED";
  const showPortalPlan = portalPlan !== "";
  const initial = userName?.charAt(0).toUpperCase() || "E";
  const badgeCount = notificationCount > 0 ? notificationCount : 24;

  // Demo notifications
  const notifications: Notification[] = [
    {
      id: "1",
      type: "reminder",
      title: "Thông báo nhắc nhở",
      message:
        "Nhắc nhở lịch học cho các lớp đang theo học. Nhấn để xem chi tiết.",
      time: "Hôm nay, 10:55",
      isRead: false,
    },
    {
      id: "2",
      type: "success",
      title: "Thông báo nhắc nhở",
      message:
        "Nhắc nhở lịch dạy cho các lớp đang phụ trách. Nhấn để xem chi tiết.",
      time: "Hôm nay, 10:55",
      isRead: false,
    },
    {
      id: "3",
      type: "info",
      title: "Thông báo hệ thống",
      message:
        "Đã cập nhật phiên bản mới. Một số tính năng mới đã được thêm vào.",
      time: "Hôm qua, 14:30",
      isRead: true,
    },
    {
      id: "4",
      type: "warning",
      title: "Cảnh báo",
      message: "Lớp học sắp hết hạn đăng ký. Vui lòng kiểm tra và gia hạn.",
      time: "Hôm qua, 09:00",
      isRead: true,
    },
  ];

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          backgroundImage: scrolled
            ? "linear-gradient(180deg, rgba(255,255,255,0.76) 0%, rgba(255,255,255,0.62) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 100%)",
          bgcolor: scrolled ? HEADER_GLASS_BG : "rgba(255,255,255,0.28)",
          backdropFilter: scrolled
            ? "blur(14px) saturate(145%)"
            : "blur(6px) saturate(125%)",
          WebkitBackdropFilter: scrolled
            ? "blur(14px) saturate(145%)"
            : "blur(6px) saturate(125%)",
          border: "0 !important",
          borderBottom: scrolled
            ? "1px solid rgba(145,158,171,0.14)"
            : "1px solid rgba(145,158,171,0.05)",
          borderRadius: 0,
          boxShadow: scrolled
            ? "0 10px 24px rgba(145,158,171,0.10), inset 0 1px 0 rgba(255,255,255,0.68)"
            : "inset 0 1px 0 rgba(255,255,255,0.34)",
          color: "#1C252E",
          overflow: "hidden",
          transition:
            "background-color 280ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms cubic-bezier(0.22, 1, 0.36, 1), border-color 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          zIndex: 1200,
          "&::before": {
            background: scrolled
              ? "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 48%, rgba(255,255,255,0) 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0) 100%)",
            content: '""',
            inset: 0,
            pointerEvents: "none",
            position: "absolute",
          },
          "&::after": {
            background: scrolled
              ? "linear-gradient(106deg, rgba(255,255,255,0) 24%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.06) 49%, rgba(255,255,255,0) 60%)"
              : "linear-gradient(106deg, rgba(255,255,255,0) 28%, rgba(255,255,255,0.10) 42%, rgba(255,255,255,0) 58%)",
            content: '""',
            inset: 0,
            opacity: scrolled ? 0.55 : 0.32,
            pointerEvents: "none",
            position: "absolute",
          },
        }}
      >
        <Toolbar
          sx={{
            gap: 1,
            minHeight: "72px !important",
            px: "32px !important",
            position: "relative",
            zIndex: 1,
          }}
        >
          {hideIdentity ? null : (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                gap: 0.75,
                minHeight: 40,
                minWidth: 0,
                px: 0.5,
              }}
            >
              {headerControls ? null : (
                <Box
                  sx={{
                    alignItems: "center",
                    bgcolor: "transparent",
                    border: 0,
                    borderRadius: 0,
                    color: "#0F6CBD",
                    display: "flex",
                    fontSize: 9.5,
                    fontWeight: 900,
                    height: 26,
                    justifyContent: "center",
                    letterSpacing: 0,
                    width: 30,
                  }}
                >
                  ERG
                </Box>
              )}
              {headerControls ? (
                headerControls
              ) : (
                <Typography
                  sx={{
                    color: "#1C252E",
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: "22px",
                  }}
                >
                  {displayCenter}
                </Typography>
              )}
              {showPortalPlan ? (
                <Box
                  component="span"
                  sx={{
                    bgcolor: "rgba(0,184,217,0.12)",
                    border: "1px solid rgba(0,184,217,0.14)",
                    borderRadius: "10px",
                    color: "#006C9C",
                    fontSize: 11.5,
                    fontWeight: 850,
                    height: 28,
                    lineHeight: "26px",
                    px: 1.35,
                  }}
                >
                  {displayPlan}
                </Box>
              ) : null}
              {headerTrailingControls}
            </Box>
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Chất lượng kết nối">
            <Box
              sx={{
                alignItems: "center",
                bgcolor: "#FFFFFF",
                border: 0,
                borderRadius: "8px",
                boxShadow: HEADER_NETWORK_SHADOW,
                color: "#22C55E",
                display: "flex",
                gap: 1,
                height: 34,
                px: 1,
              }}
            >
              <WifiRoundedIcon sx={{ fontSize: 18 }} />
              <Typography
                sx={{
                  color: "#22C55E",
                  fontSize: 12,
                  fontWeight: 400,
                  lineHeight: "18px",
                }}
              >
                Mạng tốt
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Tìm kiếm nhanh">
            <Box
              component="button"
              type="button"
              sx={{
                alignItems: "center",
                bgcolor: "rgba(145,158,171,0.08)",
                border: 0,
                borderRadius: "12px",
                boxShadow: "none",
                color: "#52616F",
                cursor: "pointer",
                display: "flex",
                gap: 0.75,
                height: 36,
                ml: 1,
                px: 1,
                transition: "all 160ms ease",
                "&:hover": {
                  bgcolor: "rgba(145,158,171,0.12)",
                  color: "#1C252E",
                },
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 18 }} />
              <Box
                component="span"
                sx={{
                  bgcolor: "transparent",
                  border: 0,
                  borderRadius: 0,
                  color: "#1C252E",
                  fontSize: 12,
                  fontWeight: 700,
                  height: "auto",
                  lineHeight: "18px",
                  px: 0,
                }}
              >
                ⌘K
              </Box>
            </Box>
          </Tooltip>

          <Tooltip title="Ngôn ngữ">
            <IconButton
              sx={{
                border: 0,
                bgcolor: "rgba(245,31,36,0.94)",
                borderRadius: "10px",
                boxShadow: "none",
                color: "#FFDE59",
                height: 40,
                ml: 1,
                width: 40,
                "&:hover": { bgcolor: "#DB1D22" },
              }}
            >
              <Typography
                sx={{
                  color: "inherit",
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                VN
              </Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title="Trợ lý">
            <IconButton sx={headerIconButtonSx}>
              <AutoAwesomeRoundedIcon sx={{ color: "#696CFF", fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Badge badgeContent={badgeCount} color="error" sx={{ ml: 0.5 }}>
            <Tooltip title="Thông báo">
              <IconButton
                sx={headerIconButtonSx}
                onClick={() => setNotificationOpen(true)}
              >
                <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Badge>

          <Tooltip title="Thiết lập">
            <IconButton sx={headerIconButtonSx}>
              <SettingsRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={userName || "User"}>
            <IconButton
              sx={{
                bgcolor: "transparent",
                border: 0,
                borderRadius: "10px",
                boxShadow: "none",
                height: 40,
                ml: 0.5,
                width: 40,
                "&:hover": {
                  bgcolor: "rgba(145,158,171,0.08)",
                },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "#696CFF",
                  border: "2px solid #FFD666",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  height: 40,
                  width: 40,
                }}
              >
                {initial}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Notification Drawer */}
      <NotificationDrawer
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={filteredNotifications}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  );
}

// =============================================================================
// Notification Drawer
// =============================================================================

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  activeTab: "all" | "unread";
  onTabChange: (tab: "all" | "unread") => void;
}

function NotificationDrawer({
  open,
  onClose,
  notifications,
  activeTab,
  onTabChange,
}: NotificationDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 400,
          bgcolor: "#FFFFFF",
          border: "none",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          alignItems: "center",
          borderBottom: "1px solid rgba(145,158,171,0.12)",
          display: "flex",
          height: 72,
          justifyContent: "space-between",
          px: 3,
        }}
      >
        <Typography sx={{ color: "#1C252E", fontSize: 20, fontWeight: 700 }}>
          Thông báo
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "#637381" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(145,158,171,0.12)",
          display: "flex",
          px: 3,
        }}
      >
        <Box
          onClick={() => onTabChange("all")}
          sx={{
            borderBottom:
              activeTab === "all"
                ? "2px solid #696CFF"
                : "2px solid transparent",
            color: activeTab === "all" ? "#1C252E" : "#637381",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "all" ? 600 : 400,
            pb: 2,
            pt: 2,
          }}
        >
          Tất cả
        </Box>
        <Box
          onClick={() => onTabChange("unread")}
          sx={{
            borderBottom:
              activeTab === "unread"
                ? "2px solid #696CFF"
                : "2px solid transparent",
            color: activeTab === "unread" ? "#1C252E" : "#637381",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeTab === "unread" ? 600 : 400,
            ml: 3,
            pb: 2,
            pt: 2,
          }}
        >
          Chưa đọc
        </Box>
      </Box>

      {/* Notification List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              py: 8,
            }}
          >
            <CheckCircleRoundedIcon
              sx={{ color: "#919EAB", fontSize: 48, mb: 2 }}
            />
            <Typography
              sx={{ color: "#637381", fontSize: 14, fontWeight: 400 }}
            >
              Không có thông báo nào
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isLast={index === notifications.length - 1}
              />
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          borderTop: "1px solid rgba(145,158,171,0.12)",
          p: 2,
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "#F4F6F8",
            borderRadius: "8px",
            color: "#1C252E",
            cursor: "pointer",
            display: "flex",
            fontSize: 14,
            fontWeight: 500,
            justifyContent: "center",
            p: 1.5,
            "&:hover": { bgcolor: "#EEF0FF" },
          }}
        >
          Xem thêm thông báo
        </Box>
      </Box>
    </Drawer>
  );
}

// =============================================================================
// Notification Item
// =============================================================================

interface NotificationItemProps {
  notification: Notification;
  isLast: boolean;
}

function NotificationItem({ notification, isLast }: NotificationItemProps) {
  const iconColors: Record<string, string> = {
    reminder: "#00B8D9",
    success: "#22C55E",
    info: "#696CFF",
    warning: "#FFAB00",
  };

  const getIcon = () => {
    switch (notification.type) {
      case "reminder":
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2C6.13401 2 3 5.13401 3 9C3 12.866 6.13401 16 10 16C13.866 16 17 12.866 17 9C17 5.13401 13.866 2 10 2ZM10 14.5C7.51472 14.5 5.5 12.4853 5.5 10H8.5C8.5 11.3807 9.61929 12.5 11 12.5C12.3807 12.5 13.5 11.3807 13.5 10C13.5 8.61929 12.3807 7.5 11 7.5H9.5M10 6.5V5M8.5 8.5H11.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "success":
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM7.5 10L9 11.5L12.5 8"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2L18 16H2L10 2Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  return (
    <Box>
      <ListItemButton
        sx={{
          alignItems: "flex-start",
          px: 3,
          py: 2,
          "&:hover": { bgcolor: "#F8F9FA" },
        }}
      >
        {/* Unread dot */}
        {!notification.isRead && (
          <Box
            sx={{
              bgcolor: "#696CFF",
              borderRadius: "50%",
              flexShrink: 0,
              height: 6,
              left: 12,
              position: "absolute",
              top: 20,
              width: 6,
            }}
          />
        )}

        {/* Icon */}
        <ListItemIcon sx={{ minWidth: 48 }}>
          <Box
            sx={{
              alignItems: "center",
              bgcolor: iconColors[notification.type],
              borderRadius: "50%",
              display: "flex",
              height: 40,
              justifyContent: "center",
              width: 40,
            }}
          >
            {getIcon()}
          </Box>
        </ListItemIcon>

        <ListItemText
          primary={
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
            >
              <Typography
                sx={{
                  color: "#1C252E",
                  fontSize: 14,
                  fontWeight: notification.isRead ? 500 : 600,
                }}
              >
                {notification.title}
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography
                sx={{
                  color: notification.isRead ? "#637381" : "#1C252E",
                  fontSize: 14,
                  fontWeight: notification.isRead ? 400 : 500,
                  lineHeight: "20px",
                  mb: 0.5,
                }}
              >
                {notification.message}
              </Typography>
              <Typography
                sx={{ color: "#919EAB", fontSize: 12, fontWeight: 400 }}
              >
                {notification.time}
              </Typography>
            </>
          }
        />
      </ListItemButton>
      {!isLast && (
        <Divider
          sx={{ ml: 12, mr: 3, borderColor: "rgba(145,158,171,0.12)" }}
        />
      )}
    </Box>
  );
}

// =============================================================================
// Styles
// =============================================================================

const headerIconButtonSx = {
  bgcolor: "transparent",
  border: 0,
  borderRadius: "10px",
  boxShadow: "none",
  color: "#637381",
  height: 40,
  ml: 0.5,
  width: 40,
  "&:hover": {
    bgcolor: "rgba(145,158,171,0.08)",
    color: "#1C252E",
  },
};

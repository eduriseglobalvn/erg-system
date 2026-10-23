import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";

import type { PortalNotification, PortalNotificationTab } from "./portal-header-notification-data";
import { PortalHeaderNotificationItem } from "./portal-header-notification-item";

type PortalHeaderNotificationsProps = {
  activeTab: PortalNotificationTab;
  notifications: PortalNotification[];
  onClose: () => void;
  onTabChange: (tab: PortalNotificationTab) => void;
  open: boolean;
};

export function PortalHeaderNotifications({ activeTab, notifications, onClose, onTabChange, open }: PortalHeaderNotificationsProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ "& .MuiDrawer-paper": { width: 400, bgcolor: "#FFFFFF", border: "none", boxShadow: "-4px 0 20px rgba(0,0,0,0.08)" } }}>
      <Box sx={{ alignItems: "center", borderBottom: "1px solid rgba(145,158,171,0.12)", display: "flex", height: 72, justifyContent: "space-between", px: 3 }}>
        <Typography sx={{ color: "#1C252E", fontSize: 20, fontWeight: 700 }}>Thông báo</Typography>
        <IconButton onClick={onClose} sx={{ color: "#637381" }}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></IconButton>
      </Box>
      <Box sx={{ borderBottom: "1px solid rgba(145,158,171,0.12)", display: "flex", px: 3 }}>
        <NotificationTab active={activeTab === "all"} label="Tất cả" onClick={() => onTabChange("all")} />
        <NotificationTab active={activeTab === "unread"} label="Chưa đọc" onClick={() => onTabChange("unread")} spaced />
      </Box>
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {notifications.length === 0 ? (
          <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", py: 8 }}>
            <CheckCircleRoundedIcon sx={{ color: "#919EAB", fontSize: 48, mb: 2 }} />
            <Typography sx={{ color: "#637381", fontSize: 14, fontWeight: 400 }}>Không có thông báo nào</Typography>
          </Box>
        ) : (
          <List disablePadding>{notifications.map((notification, index) => <PortalHeaderNotificationItem isLast={index === notifications.length - 1} key={notification.id} notification={notification} />)}</List>
        )}
      </Box>
      <Box sx={{ borderTop: "1px solid rgba(145,158,171,0.12)", p: 2 }}>
        <Box sx={{ alignItems: "center", bgcolor: "#F4F6F8", borderRadius: "8px", color: "#1C252E", cursor: "pointer", display: "flex", fontSize: 14, fontWeight: 500, justifyContent: "center", p: 1.5, "&:hover": { bgcolor: "#EEF0FF" } }}>Xem thêm thông báo</Box>
      </Box>
    </Drawer>
  );
}

function NotificationTab({ active, label, onClick, spaced = false }: { active: boolean; label: string; onClick: () => void; spaced?: boolean }) {
  return <Box onClick={onClick} sx={{ borderBottom: active ? "2px solid #696CFF" : "2px solid transparent", color: active ? "#1C252E" : "#637381", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, ml: spaced ? 3 : 0, pb: 2, pt: 2 }}>{label}</Box>;
}

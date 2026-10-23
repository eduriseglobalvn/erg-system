import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import type { PortalNotification } from "./portal-header-notification-data";

type PortalHeaderNotificationItemProps = { notification: PortalNotification; isLast: boolean };

function NotificationIcon({ type }: { type: PortalNotification["type"] }) {
  if (type === "reminder") {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C6.13401 2 3 5.13401 3 9C3 12.866 6.13401 16 10 16C13.866 16 17 12.866 17 9C17 5.13401 13.866 2 10 2ZM10 14.5C7.51472 14.5 5.5 12.4853 5.5 10H8.5C8.5 11.3807 9.61929 12.5 11 12.5C12.3807 12.5 13.5 11.3807 13.5 10C13.5 8.61929 12.3807 7.5 11 7.5H9.5M10 6.5V5M8.5 8.5H11.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  if (type === "success") {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM7.5 10L9 11.5L12.5 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 16H2L10 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function PortalHeaderNotificationItem({ notification, isLast }: PortalHeaderNotificationItemProps) {
  const iconColors: Record<PortalNotification["type"], string> = { reminder: "#00B8D9", success: "#22C55E", info: "#696CFF", warning: "#FFAB00" };
  return (
    <Box>
      <ListItemButton sx={{ alignItems: "flex-start", px: 3, py: 2, "&:hover": { bgcolor: "#F8F9FA" } }}>
        {!notification.isRead ? <Box sx={{ bgcolor: "#696CFF", borderRadius: "50%", flexShrink: 0, height: 6, left: 12, position: "absolute", top: 20, width: 6 }} /> : null}
        <ListItemIcon sx={{ minWidth: 48 }}>
          <Box sx={{ alignItems: "center", bgcolor: iconColors[notification.type], borderRadius: "50%", display: "flex", height: 40, justifyContent: "center", width: 40 }}><NotificationIcon type={notification.type} /></Box>
        </ListItemIcon>
        <ListItemText
          primary={<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}><Typography sx={{ color: "#1C252E", fontSize: 14, fontWeight: notification.isRead ? 500 : 600 }}>{notification.title}</Typography></Box>}
          secondary={<><Typography sx={{ color: notification.isRead ? "#637381" : "#1C252E", fontSize: 14, fontWeight: notification.isRead ? 400 : 500, lineHeight: "20px", mb: 0.5 }}>{notification.message}</Typography><Typography sx={{ color: "#919EAB", fontSize: 12, fontWeight: 400 }}>{notification.time}</Typography></>}
        />
      </ListItemButton>
      {!isLast ? <Divider sx={{ ml: 12, mr: 3, borderColor: "rgba(145,158,171,0.12)" }} /> : null}
    </Box>
  );
}

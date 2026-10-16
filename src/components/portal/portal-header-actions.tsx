import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { HEADER_ICON_BUTTON_SX, HEADER_NETWORK_SHADOW } from "./portal-header-styles";

type PortalHeaderActionsProps = {
  notificationCount: number;
  onOpenNotifications: () => void;
  userName?: string;
};

export function PortalHeaderActions({ notificationCount, onOpenNotifications, userName }: PortalHeaderActionsProps) {
  const badgeCount = notificationCount > 0 ? notificationCount : 24;
  const initial = userName?.charAt(0).toUpperCase() || "E";

  return (
    <>
      <Tooltip title="Chất lượng kết nối">
        <Box sx={{ alignItems: "center", bgcolor: "#FFFFFF", border: 0, borderRadius: "8px", boxShadow: HEADER_NETWORK_SHADOW, color: "#22C55E", display: { xs: "none", sm: "flex" }, gap: 1, height: 34, px: 1 }}>
          <WifiRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ color: "#22C55E", fontSize: 12, fontWeight: 400, lineHeight: "18px" }}>Mạng tốt</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Tìm kiếm nhanh">
        <Box component="button" type="button" sx={{ alignItems: "center", bgcolor: "rgba(145,158,171,0.08)", border: 0, borderRadius: "12px", boxShadow: "none", color: "#52616F", cursor: "pointer", display: { xs: "none", md: "flex" }, gap: 0.75, height: 36, ml: 1, px: 1, transition: "all 160ms ease", "&:hover": { bgcolor: "rgba(145,158,171,0.12)", color: "#1C252E" } }}>
          <SearchRoundedIcon sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ bgcolor: "transparent", border: 0, borderRadius: 0, color: "#1C252E", fontSize: 12, fontWeight: 700, height: "auto", lineHeight: "18px", px: 0 }}>⌘K</Box>
        </Box>
      </Tooltip>
      <Tooltip title="Ngôn ngữ">
        <IconButton sx={{ border: 0, bgcolor: "rgba(245,31,36,0.94)", borderRadius: "10px", boxShadow: "none", color: "#FFDE59", display: { xs: "none", sm: "inline-flex" }, height: 40, ml: 1, width: 40, "&:hover": { bgcolor: "#DB1D22" } }}>
          <Typography sx={{ color: "inherit", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>VN</Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title="Trợ lý">
        <IconButton sx={{ ...HEADER_ICON_BUTTON_SX, display: { xs: "none", md: "inline-flex" } }}><AutoAwesomeRoundedIcon sx={{ color: "#696CFF", fontSize: 20 }} /></IconButton>
      </Tooltip>
      <Badge badgeContent={badgeCount} color="error" sx={{ ml: 0.5 }}>
        <Tooltip title="Thông báo">
          <IconButton onClick={onOpenNotifications} sx={HEADER_ICON_BUTTON_SX}><NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} /></IconButton>
        </Tooltip>
      </Badge>
      <Tooltip title="Thiết lập">
        <IconButton sx={{ ...HEADER_ICON_BUTTON_SX, display: { xs: "none", sm: "inline-flex" } }}><SettingsRoundedIcon sx={{ fontSize: 20 }} /></IconButton>
      </Tooltip>
      <Tooltip title={userName || "User"}>
        <IconButton sx={{ bgcolor: "transparent", border: 0, borderRadius: "10px", boxShadow: "none", height: 40, ml: 0.5, width: 40, "&:hover": { bgcolor: "rgba(145,158,171,0.08)" } }}>
          <Avatar sx={{ bgcolor: "#696CFF", border: "2px solid #FFD666", color: "#FFFFFF", fontSize: 13, fontWeight: 700, height: 40, width: 40 }}>{initial}</Avatar>
        </IconButton>
      </Tooltip>
    </>
  );
}

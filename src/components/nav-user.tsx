import { useState } from "react"

import Avatar from "@mui/material/Avatar"
import Divider from "@mui/material/Divider"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListSubheader from "@mui/material/ListSubheader"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import { useI18n } from "@/platform/i18n"
import {
  ArrowDownwardIcon,
  ArrowUpwardIcon,
  LogoutIcon,
  NotificationsIcon,
  SettingsIcon,
  VerifiedIcon,
} from "@/components/icons"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { locale, setLocale, t } = useI18n()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)
  const closeMenu = () => setAnchorEl(null)
  const fallback = user.name
    .split(" ")
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          className="border-[#cbd7e6] bg-white/80 shadow-[var(--shadow-xs)] hover:border-[#b8c8db] hover:bg-white data-[state=open]:border-[#b8c8db] data-[state=open]:bg-white data-[state=open]:text-[var(--primary)] data-[state=open]:shadow-[var(--shadow-xs)]"
        >
          <Avatar
            src={user.avatar}
            alt={user.name}
            variant="rounded"
            sx={{ width: 32, height: 32, bgcolor: "var(--primary)", color: "#fff", fontSize: "0.75rem" }}
          >
            {fallback}
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-[var(--foreground)]">{user.name}</span>
            <span className="truncate text-xs font-medium text-[var(--muted-foreground)]">{user.email}</span>
          </div>
          <span className="ml-auto inline-flex flex-col">
            <ArrowUpwardIcon className="size-3" fontSize="inherit" />
            <ArrowDownwardIcon className="-mt-1 size-3" fontSize="inherit" />
          </span>
        </SidebarMenuButton>
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: isMobile ? "center" : "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 224, borderRadius: 2 } } }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 text-left text-sm">
            <Avatar
              src={user.avatar}
              alt={user.name}
              variant="rounded"
              sx={{ width: 32, height: 32, bgcolor: "var(--primary)", color: "#fff", fontSize: "0.75rem" }}
            >
              {fallback}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-[var(--foreground)]">{user.name}</span>
              <span className="truncate text-xs font-medium text-[var(--muted-foreground)]">{user.email}</span>
            </div>
          </div>
          <Divider />
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <VerifiedIcon fontSize="inherit" />
            </ListItemIcon>
            {t("common.account")}
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <SettingsIcon fontSize="inherit" />
            </ListItemIcon>
            {t("common.settings")}
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <NotificationsIcon fontSize="inherit" />
            </ListItemIcon>
            {t("common.notifications")}
          </MenuItem>
          <Divider />
          <ListSubheader sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", lineHeight: 2.5 }}>
            {t("locale.language")}
          </ListSubheader>
          <div className="px-2 pb-2">
            <ToggleButtonGroup
              exclusive
              value={locale}
              onChange={(_event, value) => {
                if (value === "vi" || value === "en") setLocale(value)
              }}
              size="small"
              fullWidth
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}
            >
              <ToggleButton value="vi" aria-label="Tiếng Việt" sx={{ height: 36, borderRadius: 1.5, fontSize: 14 }}>
                VI
              </ToggleButton>
              <ToggleButton value="en" aria-label="English" sx={{ height: 36, borderRadius: 1.5, fontSize: 14 }}>
                EN
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <Divider />
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <LogoutIcon fontSize="inherit" />
            </ListItemIcon>
            {t("common.logout")}
          </MenuItem>
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

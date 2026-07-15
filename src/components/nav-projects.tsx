"use client"

import { useState } from "react"

import Divider from "@mui/material/Divider"
import ListItemIcon from "@mui/material/ListItemIcon"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { useI18n } from "@/platform/i18n"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar-context"
import {
  ArrowForwardIcon,
  DeleteOutlinedIcon,
  FolderIcon,
  MoreHorizIcon,
} from "@/components/icons"

export function NavProjects({
  projects,
  activeLeafId,
  onSelectLeaf,
}: {
  projects: {
    name: string
    leafId: string
    icon: React.ReactNode
  }[]
  activeLeafId: string
  onSelectLeaf: (leafId: string) => void
}) {
  const { isMobile } = useSidebar()
  const { t } = useI18n()
  const [menuState, setMenuState] = useState<{ anchorEl: HTMLElement; leafId: string } | null>(null)
  const closeMenu = () => setMenuState(null)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("common.projects")}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={item.leafId === activeLeafId}>
              <button type="button" onClick={() => onSelectLeaf(item.leafId)}>
                {item.icon}
                <span>{item.name}</span>
              </button>
            </SidebarMenuButton>
            <SidebarMenuAction
              showOnHover
              onClick={(event) => setMenuState({ anchorEl: event.currentTarget, leafId: item.leafId })}
              className="text-slate-500 hover:bg-white hover:text-[var(--erg-blue)] aria-expanded:bg-white aria-expanded:text-[var(--erg-blue)] aria-expanded:shadow-sm"
            >
              <MoreHorizIcon />
              <span className="sr-only">{t("common.more")}</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        ))}
        <Menu
          anchorEl={menuState?.anchorEl ?? null}
          open={Boolean(menuState)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "top", horizontal: isMobile ? "right" : "left" }}
          transformOrigin={{ vertical: "top", horizontal: isMobile ? "right" : "left" }}
          slotProps={{ paper: { sx: { width: 192, borderRadius: 2 } } }}
        >
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <FolderIcon className="text-slate-500" fontSize="inherit" />
            </ListItemIcon>
            <span>{t("common.viewProject")}</span>
          </MenuItem>
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <ArrowForwardIcon className="text-slate-500" fontSize="inherit" />
            </ListItemIcon>
            <span>{t("common.shareProject")}</span>
          </MenuItem>
          <Divider />
          <MenuItem onClick={closeMenu}>
            <ListItemIcon>
              <DeleteOutlinedIcon className="text-slate-500" fontSize="inherit" />
            </ListItemIcon>
            <span>{t("common.deleteProject")}</span>
          </MenuItem>
        </Menu>
        <SidebarMenuItem>
            <SidebarMenuButton className="text-slate-500 hover:text-[var(--erg-blue)]">
              <MoreHorizIcon className="text-slate-500" fontSize="inherit" />
              <span>{t("common.more")}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

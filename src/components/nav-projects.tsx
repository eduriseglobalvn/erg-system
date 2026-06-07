"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="text-slate-500 hover:bg-white hover:text-[var(--erg-blue)] aria-expanded:bg-white aria-expanded:text-[var(--erg-blue)] aria-expanded:shadow-sm"
                >
                  <MoreHorizIcon />
                  <span className="sr-only">{t("common.more")}</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <FolderIcon className="text-slate-500" fontSize="inherit" />
                  <span>{t("common.viewProject")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowForwardIcon className="text-slate-500" fontSize="inherit" />
                  <span>{t("common.shareProject")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <DeleteOutlinedIcon className="text-slate-500" fontSize="inherit" />
                  <span>{t("common.deleteProject")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
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

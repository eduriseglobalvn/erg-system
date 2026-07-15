"use client"

import * as React from "react";

import Divider from "@mui/material/Divider";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import { useI18n } from "@/platform/i18n";
import {
  AddIcon,
  ArrowDownwardIcon,
  ArrowUpwardIcon,
} from "@/components/icons";

export function TeamSwitcher({
  activeTeamId,
  addLabel,
  menuLabel,
  onSelectTeam,
  showAddItem = true,
  teams,
}: {
  teams: {
    id?: string;
    disabled?: boolean;
    name: string;
    logo: React.ReactNode;
    plan: string;
  }[];
  addLabel?: string;
  activeTeamId?: string;
  menuLabel?: string;
  onSelectTeam?: (team: { id?: string; disabled?: boolean; name: string; plan: string }) => void;
  showAddItem?: boolean;
}) {
  const { isMobile } = useSidebar();
  const { t } = useI18n();
  const [fallbackActiveTeam, setFallbackActiveTeam] = React.useState(teams[0]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  const closeMenu = () => setAnchorEl(null);
  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? fallbackActiveTeam ?? teams[0];

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={(event) => setAnchorEl(event.currentTarget)}
          className="border-[#cbd7e6] bg-white/80 shadow-[var(--shadow-xs)] hover:border-[#b8c8db] hover:bg-white data-[state=open]:border-[#b8c8db] data-[state=open]:bg-white data-[state=open]:text-[var(--primary)] data-[state=open]:shadow-[var(--shadow-xs)]"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-[var(--shadow-xs)]">
            {activeTeam.logo}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-[var(--foreground)]">{activeTeam.name}</span>
            <span className="truncate text-xs font-medium text-[var(--muted-foreground)]">{activeTeam.plan}</span>
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
          anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{ paper: { sx: { minWidth: 224, borderRadius: 2 } } }}
        >
          <ListSubheader sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary", lineHeight: 2.5 }}>
            {menuLabel ?? t("common.teams")}
          </ListSubheader>
          {teams.map((team, index) => (
            <MenuItem
              key={team.name}
              onClick={() => {
                setFallbackActiveTeam(team);
                onSelectTeam?.(team);
                closeMenu();
              }}
              sx={{ gap: 1, p: 1 }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-[#cbd7e6] bg-[#f8fbff] text-[var(--primary)]">
                {team.logo}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{team.name}</div>
                {team.disabled ? (
                  <div className="text-xs text-rose-500">403 access denied</div>
                ) : null}
              </div>
              {index < 9 ? (
                <span className="ml-auto text-xs tracking-widest text-[var(--muted-foreground)]">{`Ctrl+${index + 1}`}</span>
              ) : null}
            </MenuItem>
          ))}
          {showAddItem ? (
            <>
              <Divider />
              <MenuItem onClick={closeMenu} sx={{ gap: 1, p: 1 }}>
                <div className="flex size-6 items-center justify-center rounded-md border border-[#cbd7e6] bg-[#f8fbff] text-[var(--primary)]">
                  <AddIcon className="size-4" fontSize="inherit" />
                </div>
                <div className="font-semibold text-[var(--muted-foreground)]">{addLabel ?? t("common.addTeam")}</div>
              </MenuItem>
            </>
          ) : null}
        </Menu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

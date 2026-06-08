"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const activeTeam = teams.find((team) => team.id === activeTeamId) ?? fallbackActiveTeam ?? teams[0];

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
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
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs font-semibold text-[var(--muted-foreground)]">
              {menuLabel ?? t("common.teams")}
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => {
                  setFallbackActiveTeam(team);
                  onSelectTeam?.(team);
                }}
                className="gap-2 p-2"
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
                {index < 9 ? <DropdownMenuShortcut>{`Ctrl+${index + 1}`}</DropdownMenuShortcut> : null}
              </DropdownMenuItem>
            ))}
            {showAddItem ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border border-[#cbd7e6] bg-[#f8fbff] text-[var(--primary)]">
                    <AddIcon className="size-4" fontSize="inherit" />
                  </div>
                  <div className="font-semibold text-[var(--muted-foreground)]">{addLabel ?? t("common.addTeam")}</div>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

"use client";

import * as React from "react";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuBookIcon,
  PieChartIcon,
  QuizIcon,
  SchoolIcon,
  SettingsIcon,
  SmartToyIcon,
  VerifiedIcon,
} from "@/components/icons";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import type { DashboardGroup } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";

export function AppSidebar({
  activeLeafId,
  dashboardSections,
  onSelectLeaf,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  activeLeafId: string;
  dashboardSections: DashboardGroup[];
  onSelectLeaf: (leafId: string) => void;
}) {
  const navMain = dashboardSections.map((group) => ({
    ...group,
    url: "#",
    icon: getSectionIcon(group.iconKey),
    tone: getSectionTone(group.iconKey),
    isActive: group.items.some((item) => item.id === activeLeafId),
    items: group.items.map((item) => ({
      title: item.title,
      leafId: item.id,
    })),
  }));

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="relative overflow-visible border-r border-[rgba(145,158,171,0.12)] bg-[#1C252E] shadow-none group-data-[collapsible=icon]:px-0"
      {...props}
    >
      <SidebarEdgeToggle />
      <SidebarContent className="h-full min-h-0 overflow-y-auto overscroll-contain px-2.5 py-4 pb-10 group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-5">
        <NavMain items={navMain} activeLeafId={activeLeafId} onSelectLeaf={onSelectLeaf} />
      </SidebarContent>
    </Sidebar>
  );
}

function SidebarEdgeToggle() {
  const { state, toggleSidebar } = useSidebar();
  const { t } = useI18n();
  const isExpanded = state === "expanded";

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={isExpanded ? t("sidebar.collapseMenu") : t("sidebar.expandMenu")}
      className="absolute top-1/2 -right-3 z-40 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-[rgba(145,158,171,0.12)] bg-[#1C252E] text-[#919EAB] shadow-md ring-2 ring-[#1C252E] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#696CFF]"
    >
      {isExpanded ? <ChevronLeftIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
    </button>
  );
}

function getSectionTone(iconKey: DashboardGroup["iconKey"]) {
  if (iconKey === "materials") return "text-[#696CFF]";
  if (iconKey === "classroom") return "text-[#696CFF]";
  if (iconKey === "docs") return "text-[#696CFF]";
  if (iconKey === "settings") return "text-[#696CFF]";
  if (iconKey === "admin") return "text-[#696CFF]";
  if (iconKey === "members") return "text-[#696CFF]";

  return "text-[#696CFF]";
}

function getSectionIcon(iconKey: DashboardGroup["iconKey"]) {
  if (iconKey === "materials") return <QuizIcon />;
  if (iconKey === "classroom") return <SmartToyIcon />;
  if (iconKey === "docs") return <MenuBookIcon />;
  if (iconKey === "settings") return <SettingsIcon />;
  if (iconKey === "admin") return <SchoolIcon />;
  if (iconKey === "members") return <VerifiedIcon />;

  return <PieChartIcon />;
}

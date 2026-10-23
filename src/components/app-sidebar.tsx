"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { NavMain } from "@/components/nav-main";
import { DashboardAccountCard } from "@/layouts/dashboard/components/dashboard-account-card";
import type { DashboardGroup } from "@/layouts/dashboard/types/dashboard-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const COLLAPSED_WIDTH = 76;

export function AppSidebar({
  activeLeafId,
  dashboardSections,
  onSelectLeaf,
}: {
  activeLeafId: string;
  dashboardSections: DashboardGroup[];
  onSelectLeaf: (leafId: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useI18n();
  const width = collapsed ? COLLAPSED_WIDTH : ergEnterpriseTokens.size.sidebar;
  const navigationItems = dashboardSections.map((section) => ({
    ...section,
    icon: getSectionIcon(section.iconKey),
  }));

  return (
    <Box
      aria-label="Điều hướng LMS"
      component="nav"
      data-sidebar-width={width}
      sx={{
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        overflow: "visible",
        position: "relative",
        transition: "width 280ms cubic-bezier(0.2, 0, 0, 1)",
        width,
        "@media (prefers-reduced-motion: reduce)": { transitionDuration: "1ms" },
      }}
    >
      <IconButton
        aria-label={collapsed ? t("sidebar.expandMenu") : t("sidebar.collapseMenu")}
        onClick={() => setCollapsed((value) => !value)}
        size="small"
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          position: "absolute",
          right: -14,
          top: 18,
          zIndex: 4,
          "&:hover": { bgcolor: "background.paper", color: "primary.main" },
        }}
      >
        {collapsed ? <ChevronRightRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
      </IconButton>

      <Box sx={{ flex: 1, minHeight: 0, overflowX: "hidden", overflowY: "auto", p: collapsed ? 1 : 1.5 }}>
        <NavMain
          activeLeafId={activeLeafId}
          collapsed={collapsed}
          items={navigationItems}
          onSelectLeaf={onSelectLeaf}
        />
      </Box>

      <Box sx={{ maxHeight: collapsed ? 0 : 260, opacity: collapsed ? 0 : 1, overflow: "hidden", transition: "opacity 160ms ease, max-height 220ms ease" }}>
        <DashboardAccountCard />
      </Box>
    </Box>
  );
}

function getSectionIcon(iconKey: DashboardGroup["iconKey"]) {
  if (iconKey === "materials") return <QuizOutlinedIcon />;
  if (iconKey === "classroom") return <SchoolOutlinedIcon />;
  if (iconKey === "docs") return <MenuBookOutlinedIcon />;
  if (iconKey === "settings") return <SettingsOutlinedIcon />;
  if (iconKey === "admin") return <AdminPanelSettingsOutlinedIcon />;
  if (iconKey === "members") return <GroupOutlinedIcon />;
  return <AssessmentOutlinedIcon />;
}

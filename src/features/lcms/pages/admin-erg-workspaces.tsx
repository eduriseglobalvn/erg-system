"use client";

import Box from "@mui/material/Box";

import PageHeader from "@/components/shared/PageHeader";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import type { MenuItem as PortalMenuItem } from "@/components/portal/ErgPortalLayout";
import AdminGoogleCalendarWorkspace from "@/features/lcms/components/admin-google-calendar-workspace";
import { getMenuItemDescription } from "@/features/lcms/admin-menu";
import { adminPath } from "@/platform/workspaces/workspace-paths";

const FALLBACK_TITLES: Record<string, string> = {
  "/customers": "Khách hàng",
  "/center-tasks": "Công việc",
  "/report": "Báo cáo",
  "/setting": "Thiết lập",
  "/integration": "Thiết lập",
  "/employees": "Nhân sự",
};

export function AdminErgPortalWorkspace({ activeItem, pathname }: { activeItem: PortalMenuItem | null; pathname: string }) {
  if (pathname.startsWith("/calendar")) {
    return <AdminGoogleCalendarWorkspace activeItem={activeItem} />;
  }

  const fallback = Object.entries(FALLBACK_TITLES).find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? "Dữ liệu";
  const title = activeItem?.label ?? fallback;

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={activeItem ? getMenuItemDescription(activeItem) : undefined}
        breadcrumbs={[{ label: "Dashboard", href: adminPath("/") }, { label: title }]}
      />
      <ErgEmptyState
        title="Chưa có dữ liệu"
        description="Không gian làm việc này chưa được kết nối với nguồn dữ liệu."
      />
    </Box>
  );
}

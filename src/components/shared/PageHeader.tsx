import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

/** Giữ API cũ; phần tiêu đề/mô tả/hành động do ErgPageHeader render. Breadcrumb (không có trong ErgPageHeader) hiển thị bên dưới. */
export default function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  const hasBreadcrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0);
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ "& > :first-of-type": { mb: 0 } }}>
        <ErgPageHeader description={subtitle} primaryAction={actions} title={title} />
      </Box>
      {hasBreadcrumbs && (
        <Breadcrumbs separator={<ChevronRightRoundedIcon sx={{ fontSize: 16 }} />} sx={{ color: "text.secondary", fontSize: 14, mt: 1 }}>
          {breadcrumbs!.map((item, i) => {
            const isLast = i === breadcrumbs!.length - 1;
            if (isLast || !item.href) {
              return (
                <Typography key={i} sx={{ color: isLast ? "text.disabled" : "text.secondary", fontSize: 14 }}>
                  {item.label}
                </Typography>
              );
            }
            return (
              <Link href={item.href} key={i} sx={{ color: "text.primary", fontSize: 14 }} underline="hover">
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
    </Box>
  );
}

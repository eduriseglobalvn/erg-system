import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import type { DashboardLeaf, DashboardLeafVariant } from '@/layouts/dashboard/types/dashboard-types';
import type { MenuGroup } from '@/components/portal/ErgPortalLayout';

// =============================================================================
// CRM Navigation Types & Data
// =============================================================================

export type CrmNavItem = {
  id: string;
  path: string;
  label: string;
  section: string;
  description: string;
  variant: DashboardLeafVariant;
  icon: React.ReactNode;
};

export const crmNavItems: CrmNavItem[] = [
  {
    id: 'seo-overview',
    path: '/',
    label: 'Tổng quan CRM',
    section: 'CRM & P&L',
    description: 'Theo dõi pipeline trường tư vấn, doanh thu dự kiến, margin và việc cần xử lý trước khi chốt.',
    variant: 'seo-overview',
    icon: <TrendingUpRoundedIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'seo-schools',
    path: '/seo/schools',
    label: 'Trường đã tư vấn',
    section: 'CRM & P&L',
    description: 'Lập danh sách trường, cập nhật tình trạng tư vấn, chờ chốt, đàm phán, chờ triển khai hoặc active.',
    variant: 'seo-schools',
    icon: <ApartmentRoundedIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'seo-opportunities',
    path: '/seo/opportunities',
    label: 'Opportunity',
    section: 'CRM & P&L',
    description: 'Quản lý cơ hội theo trường, chương trình, năm học, xác suất chốt và trạng thái thương lượng.',
    variant: 'seo-opportunities',
    icon: <HandshakeRoundedIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'seo-pnl',
    path: '/seo/pnl',
    label: 'P&L chốt trường',
    section: 'CRM & P&L',
    description: 'Dự trù doanh thu, chi phí, lợi nhuận, margin và điểm hòa vốn trước khi chuyển trường sang vận hành.',
    variant: 'seo-pnl',
    icon: <CalculateRoundedIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'seo-followups',
    path: '/seo/follow-ups',
    label: 'Lịch follow-up',
    section: 'CRM & P&L',
    description: 'Theo dõi các việc CRM cần làm: gọi lại, gặp trường, gửi proposal, xử lý hợp đồng và bàn giao.',
    variant: 'seo-followups',
    icon: <PhoneInTalkRoundedIcon sx={{ fontSize: 24 }} />,
  },
  {
    id: 'seo-handover',
    path: '/seo/handover',
    label: 'Bàn giao triển khai',
    section: 'CRM & P&L',
    description: 'Deal đã chốt được kiểm tra điều kiện trước khi quản lý trung tâm active và cấu hình giáo viên, lớp, học sinh.',
    variant: 'seo-handover',
    icon: <AssignmentRoundedIcon sx={{ fontSize: 24 }} />,
  },
];

// =============================================================================
// Convert CRM items to portal menu groups
// =============================================================================

export function toMenuGroup(crmItems: CrmNavItem[]): MenuGroup[] {
  const sections = Array.from(new Set(crmItems.map((item) => item.section)));
  return sections.map((section) => ({
    label: section,
    items: crmItems
      .filter((item) => item.section === section)
      .map((item) => ({
        id: item.id,
        label: item.label,
        path: item.path,
        icon: item.icon,
        description: item.description,
        section: item.section,
        variant: item.variant,
      })),
  }));
}

// =============================================================================
// Helpers
// =============================================================================

export function resolveCrmItem(pathname: string): CrmNavItem {
  const normalized = pathname === '' ? '/' : pathname;
  if (normalized === '/seo') return crmNavItems[0]!;
  return (
    [...crmNavItems]
      .filter((item) => item.path !== '/' && normalized.startsWith(item.path))
      .sort((left, right) => right.path.length - left.path.length)[0] ?? crmNavItems[0]!
  );
}

export function toDashboardLeaf(item: CrmNavItem): DashboardLeaf {
  return {
    id: item.id,
    title: item.label,
    breadcrumb: ['CRM ERG', item.section, item.label],
    description: item.description,
    variant: item.variant,
  };
}

/**
 * CRM Portal Shell — MUI CenterUp Theme
 * Converted from Tailwind/shadcn to MUI (2026-06-12)
 *
 * Sidebar: 280px, #1C252E
 * Header: 72px, white glass
 * Selected item: sky blue rgba(14,165,233,0.12)
 */
'use client';

import { useMemo } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import { useLocation, useNavigate } from '@/routes/router-compat';
import { useAuthSession } from '@/platform/auth/hooks/use-auth-session';
import { defaultClassId, defaultSchoolId } from '@/features/lms/classroom/api/mock-classroom-data';
import { DashboardContent } from '@/layouts/dashboard/components/dashboard-content';
import type { DashboardLeaf, DashboardLeafVariant } from '@/layouts/dashboard/types/dashboard-types';
import type { ContentScope, ManagementScope } from '@/types/scope-types';
import CenterUpLayout from '@/components/portal/CenterUpLayout';
import type { MenuGroup, PortalInfo } from '@/components/portal/CenterUpLayout';

// =============================================================================
// CRM Navigation Types & Data
// =============================================================================

type CrmNavItem = {
  id: string;
  path: string;
  label: string;
  section: string;
  description: string;
  variant: DashboardLeafVariant;
  icon: React.ReactNode;
};

const crmNavItems: CrmNavItem[] = [
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
// Convert CRM items to MenuGroup for CenterUpLayout
// =============================================================================

function toMenuGroup(crmItems: CrmNavItem[]): MenuGroup[] {
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

function resolveCrmItem(pathname: string): CrmNavItem {
  const normalized = pathname === '' ? '/' : pathname;
  if (normalized === '/seo') return crmNavItems[0]!;
  return (
    [...crmNavItems]
      .filter((item) => item.path !== '/' && normalized.startsWith(item.path))
      .sort((left, right) => right.path.length - left.path.length)[0] ?? crmNavItems[0]!
  );
}

function toDashboardLeaf(item: CrmNavItem): DashboardLeaf {
  return {
    id: item.id,
    title: item.label,
    breadcrumb: ['CRM ERG', item.section, item.label],
    description: item.description,
    variant: item.variant,
  };
}

function getInitials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

// =============================================================================
// CRM Portal Shell Component
// =============================================================================

const crmScope: ManagementScope = { level: 'global' };
const globalContentScope: ContentScope = { type: 'global' };

export function CrmPortalShell() {
  const { account } = useAuthSession('crm');
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = resolveCrmItem(location.pathname);
  const activeLeaf = useMemo<DashboardLeaf>(() => toDashboardLeaf(activeItem), [activeItem]);

  const menuGroups = useMemo(() => toMenuGroup(crmNavItems), []);

  const portalInfo: PortalInfo = useMemo(
    () => ({
      name: 'CRM ERG',
      plan: 'ADVANCED',
      centerName: 'ERG Education',
      userName: account?.fullName || 'CRM Admin',
      userEmail: account?.email || 'crm@erg.edu.vn',
    }),
    [account],
  );

  function openLeaf(leafId: string) {
    const target = crmNavItems.find((item) => item.id === leafId || item.variant === leafId);
    navigate(target?.path ?? '/');
  }

  return (
    <CenterUpLayout
      menuGroups={menuGroups}
      portalInfo={portalInfo}
      notificationCount={24}
    >
      <CrmContent activeLeaf={activeLeaf} onOpenLeaf={openLeaf} account={account ?? undefined} />
    </CenterUpLayout>
  );
}

// =============================================================================
// CRM Content (inside CenterUpLayout)
// =============================================================================

function CrmContent({
  activeLeaf,
  onOpenLeaf,
  account,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (id: string) => void;
  account?: { fullName?: string; email?: string };
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(10px)',
          border: '0 !important',
          boxShadow: 'none',
          color: '#1C252E',
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important', px: '32px !important' }}>
          {/* Left: Portal selector */}
          <Box sx={{ alignItems: 'center', display: 'flex', gap: 1, height: 32, minWidth: 266 }}>
            <Box
              component="svg"
              sx={{ height: 32, width: 80 }}
            >
              <text x="0" y="24" fontFamily="Manrope Variable, sans-serif" fontSize="22" fontWeight="800" fill="#1C252E">ERG</text>
              <text x="0" y="36" fontFamily="Manrope Variable, sans-serif" fontSize="9" fontWeight="600" fill="#696CFF" letterSpacing="2">EDUCATION</text>
            </Box>
            <Typography sx={{ color: '#1C252E', fontSize: 14, fontWeight: 600, lineHeight: '22px' }}>
              CRM ERG
            </Typography>
            <Box
              component="span"
              sx={{
                bgcolor: 'rgba(0,184,217,0.16)',
                borderRadius: '6px',
                color: '#006C9C',
                fontSize: 12,
                fontWeight: 700,
                height: 22,
                lineHeight: '22px',
                px: 1.5,
              }}
            >
              ADVANCED
            </Box>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Connection quality */}
          <Tooltip title="Chất lượng kết nối">
            <Box
              sx={{
                alignItems: 'center',
                bgcolor: '#FFFFFF',
                border: '1px solid rgba(145,158,171,0.12)',
                borderRadius: 1,
                color: '#22C55E',
                display: 'flex',
                gap: 1,
                height: 34,
                px: 1,
              }}
            >
              <WifiRoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={{ color: '#22C55E', fontSize: 12, fontWeight: 400, lineHeight: '18px' }}>
                Mạng tốt
              </Typography>
            </Box>
          </Tooltip>

          {/* Search */}
          <Tooltip title="Tìm kiếm nhanh">
            <Box
              component="button"
              type="button"
              sx={{
                alignItems: 'center',
                bgcolor: 'rgba(145,158,171,0.08)',
                border: 0,
                borderRadius: 1,
                color: '#637381',
                cursor: 'pointer',
                display: 'flex',
                gap: 0.75,
                height: 36,
                ml: 1,
                px: 1,
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 18 }} />
              <Box
                component="span"
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '6px',
                  color: '#1C252E',
                  fontSize: 12,
                  fontWeight: 700,
                  height: 24,
                  lineHeight: '24px',
                  px: 0.75,
                }}
              >
                ⌘K
              </Box>
            </Box>
          </Tooltip>

          {/* Language */}
          <Tooltip title="Ngôn ngữ">
            <IconButton
              sx={{
                bgcolor: '#F51F24',
                borderRadius: '6px',
                color: '#FFDE59',
                height: 24,
                ml: 1,
                width: 32,
                '&:hover': { bgcolor: '#DB1D22' },
              }}
            >
              <Typography sx={{ color: 'inherit', fontSize: 10, fontWeight: 800, lineHeight: 1 }}>
                VN
              </Typography>
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Badge badgeContent={24} color="error" sx={{ ml: 0.5 }}>
            <Tooltip title="Thông báo">
              <IconButton sx={headerIconButtonSx}>
                <NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Badge>

          {/* Settings */}
          <Tooltip title="Thiết lập">
            <IconButton sx={headerIconButtonSx}>
              <SettingsRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          <Tooltip title={account?.fullName || 'User'}>
            <IconButton sx={{ height: 48, ml: 0.5, width: 48 }}>
              <Avatar
                sx={{
                  bgcolor: '#696CFF',
                  border: '2px solid #FFD666',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  height: 32,
                  width: 32,
                }}
              >
                {getInitials(account?.fullName || 'CRM')}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Dashboard Content */}
      <Box sx={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <DashboardContent
          activeLeaf={activeLeaf}
          canAccessGlobalErg
          contentScope={globalContentScope}
          managementScope={crmScope}
          onOpenLeaf={onOpenLeaf}
          pendingQuestionImports={[]}
          selectedClassId={defaultClassId}
          selectedSchoolId={defaultSchoolId}
          onQuestionImportsHandled={() => undefined}
          onCreateQuizFromBank={() => undefined}
        />
      </Box>
    </Box>
  );
}

const headerIconButtonSx = {
  color: '#637381',
  height: 36,
  ml: 0.5,
  width: 36,
  '&:hover': {
    bgcolor: 'rgba(145,158,171,0.08)',
  },
};

// =============================================================================
// Default export alias (for backwards compatibility)
// =============================================================================

export default CrmPortalShell;

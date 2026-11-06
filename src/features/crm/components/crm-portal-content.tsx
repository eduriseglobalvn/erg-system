'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthSession } from '@/platform/auth/hooks/use-auth-session';
import { evaluatePermission } from '@/platform/auth/permissions/permission-evaluator';
import { DashboardContent } from '@/layouts/dashboard/components/dashboard-content';
import type { DashboardLeaf } from '@/layouts/dashboard/types/dashboard-types';
import type { ContentScope, ManagementScope } from '@/types/scope-types';
import { usePortalNotifications } from '@/features/notifications/hooks/use-portal-notifications';
import { CrmPortalHeader } from './crm-portal-header';
import { crmNavItems, resolveCrmItem, toDashboardLeaf } from './crm-nav';

const crmScope: ManagementScope = { level: 'global' };
const globalContentScope: ContentScope = { type: 'global' };

/** The page of every CRM route: the dashboard leaf is resolved from the current path. */
export function CrmPortalContent() {
  const { account, session } = useAuthSession('crm');
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = resolveCrmItem(location.pathname);
  const activeLeaf = useMemo<DashboardLeaf>(() => toDashboardLeaf(activeItem), [activeItem]);
  const { unreadCount } = usePortalNotifications('crm', 'all', false);
  const canAccessGlobalErg = evaluatePermission({
    permission: 'lms.admin',
    grantedPermissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
  });

  function openLeaf(leafId: string) {
    const target = crmNavItems.find((item) => item.id === leafId || item.variant === leafId);
    void navigate({ href: target?.path ?? '/' });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CrmPortalHeader fullName={account?.fullName} unreadCount={unreadCount} />

      {/* Dashboard Content */}
      <Box sx={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
        <DashboardContent
          activeLeaf={activeLeaf}
          canAccessGlobalErg={canAccessGlobalErg}
          contentScope={globalContentScope}
          managementScope={crmScope}
          onOpenLeaf={openLeaf}
          pendingQuestionImports={[]}
          selectedClassId=""
          selectedSchoolId=""
          onQuestionImportsHandled={() => undefined}
          onCreateQuizFromBank={() => undefined}
        />
      </Box>
    </Box>
  );
}

'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAuthSession } from '@/platform/auth/hooks/use-auth-session';
import { evaluatePermission } from '@/platform/auth/permissions/permission-evaluator';
import { DashboardContent } from '@/layouts/dashboard/components/dashboard-content';
import type { DashboardLeaf } from '@/layouts/dashboard/types/dashboard-types';
import type { ContentScope, ManagementScope } from '@/types/scope-types';
import ErgPortalLayout from '@/components/portal/ErgPortalLayout';
import { usePortalNotifications } from '@/features/notifications/hooks/use-portal-notifications';
import type { PortalInfo } from '@/components/portal/ErgPortalLayout';
import { CrmPortalHeader } from './crm-portal-header';
import { crmNavItems, resolveCrmItem, toDashboardLeaf, toMenuGroup } from './crm-nav';

// =============================================================================
// CRM Portal Shell Component
// =============================================================================

const crmScope: ManagementScope = { level: 'global' };
const globalContentScope: ContentScope = { type: 'global' };

export function CrmPortalShell() {
  const { account, session } = useAuthSession('crm');
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
      workspaceCapabilities: session?.workspaces,
      workspacePortals: session?.portals ?? ['crm'],
    }),
    [account, session?.portals, session?.workspaces],
  );

  function openLeaf(leafId: string) {
    const target = crmNavItems.find((item) => item.id === leafId || item.variant === leafId);
    void navigate({ href: target?.path ?? '/' });
  }

  return (
    <ErgPortalLayout
      menuGroups={menuGroups}
      portalInfo={portalInfo}
    >
      <CrmContent activeLeaf={activeLeaf} onOpenLeaf={openLeaf} account={account ?? undefined} />
    </ErgPortalLayout>
  );
}

// =============================================================================
// CRM content
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
  const { session } = useAuthSession('crm');
  const { unreadCount } = usePortalNotifications('crm', 'all', false);
  const canAccessGlobalErg = evaluatePermission({
    permission: 'lms.admin',
    grantedPermissions: session?.permissions,
    deniedPermissions: session?.deniedPermissions,
  });
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
          onOpenLeaf={onOpenLeaf}
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

// =============================================================================
// Default export alias (for backwards compatibility)
// =============================================================================

export default CrmPortalShell;
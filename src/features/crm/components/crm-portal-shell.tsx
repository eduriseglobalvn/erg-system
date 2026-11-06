'use client';

import { useMemo, type ReactNode } from 'react';
import ErgPortalLayout from '@/components/portal/ErgPortalLayout';
import type { PortalInfo } from '@/components/portal/ErgPortalLayout';
import { useAuthSession } from '@/platform/auth/hooks/use-auth-session';
import { CrmPortalContent } from './crm-portal-content';
import { crmNavItems, toMenuGroup } from './crm-nav';

// =============================================================================
// CRM Portal Shell Component
// =============================================================================

/** CRM chrome (menu, header identity). Pages go in `children` (the route Outlet); the "/" entry uses the default content. */
export function CrmPortalShell({ children }: { children?: ReactNode }) {
  const { account, session } = useAuthSession('crm');
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

  return (
    <ErgPortalLayout menuGroups={menuGroups} portalInfo={portalInfo}>
      {children ?? <CrmPortalContent />}
    </ErgPortalLayout>
  );
}

export default CrmPortalShell;

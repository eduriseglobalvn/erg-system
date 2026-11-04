import { Outlet } from "@tanstack/react-router";

import { CrmPortalShell } from "@/features/crm";

/** CRM entry used at "/" on the CRM host: shell with the default content. */
export function CrmPage() {
  return <CrmPortalShell />;
}

/** Layout of the /seo/* routes: the same shell, pages rendered through the route Outlet. */
export function CrmLayoutPage() {
  return (
    <CrmPortalShell>
      <Outlet />
    </CrmPortalShell>
  );
}

export default CrmPage;

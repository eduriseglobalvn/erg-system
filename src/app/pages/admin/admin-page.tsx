import { AdminErgPortalShell, AdminPortalShell } from "@/features/lcms";

/** Canonical Admin workspace entry. */
export function AdminPage() {
  const Shell = AdminErgPortalShell ?? AdminPortalShell;
  return <Shell />;
}

export default AdminPage;

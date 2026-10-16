import { LcmsErgPortalShell, LcmsPortalShell } from "@/features/lcms";

/** Canonical Admin workspace entry. The feature implementation remains legacy-named during migration. */
export function AdminPage() {
  const Shell = LcmsErgPortalShell ?? LcmsPortalShell;
  return <Shell />;
}

export default AdminPage;

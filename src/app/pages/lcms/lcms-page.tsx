import { LcmsErgPortalShell, LcmsPortalShell } from "@/features/lcms";

export function LcmsPage() {
  const Shell = LcmsErgPortalShell ?? LcmsPortalShell;
  return <Shell />;
}

export default LcmsPage;

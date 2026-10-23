import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";
import { ErgContentBand, ErgEmptyState, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui";
import {
  useLaunchLearningStandardPackage,
  useLearningStandardPackages,
  useLearningStandardsScope,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-query";
import type { LearningStandardPackage } from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";
import { LearningStandardsIntegrationPanel } from "@/features/lcms/integrations/learning-standards/components/learning-standards-integration-panel";
import { LearningStandardsPackageCreateDialog, LearningStandardsPackageValidationDialog } from "@/features/lcms/integrations/learning-standards/components/learning-standards-package-dialogs";
import { LearningStandardsPackageTable } from "@/features/lcms/integrations/learning-standards/components/learning-standards-package-table";

export function LearningStandardsWorkspace() {
  const scope = useLearningStandardsScope("ADMIN");
  const { session } = useAuthSession("lcms");
  const canRead = evaluatePermission({ permission: "learning.standards.read", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
  const canManage = evaluatePermission({ permission: "learning.standards.manage", grantedPermissions: session?.permissions ?? [], deniedPermissions: session?.deniedPermissions ?? [] });
  const packagesQuery = useLearningStandardPackages(scope, "", canRead);
  const launchMutation = useLaunchLearningStandardPackage(scope);
  const [tab, setTab] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [validationPackage, setValidationPackage] = useState<LearningStandardPackage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!canRead) {
    return <ErgContentBand><ErgEmptyState icon={<HubRoundedIcon fontSize="large" />} title="Không có quyền Learning Standards" description="Tài khoản cần learning.standards.read hoặc learning.standards.manage để vào khu vực tích hợp." /></ErgContentBand>;
  }

  async function launch(value: LearningStandardPackage) {
    try {
      const result = await launchMutation.mutateAsync({ packageId: value.id });
      setNotice(`Backend xác nhận package READY. Launch path: ${result.launchPath || "chưa có"}. FE không tự suy đoán URL artifact.`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Không thể launch package.");
    }
  }

  return (
    <ErgContentBand>
      <ErgSectionHeader
        eyebrow="Admin / Integrations"
        title="Learning Standards"
        description="Quản trị SCORM package, LTI 1.3 và xAPI theo tenant; mọi trạng thái đều do backend xác nhận."
        action={canManage ? <Button startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)} variant="contained">Đăng ký SCORM</Button> : null}
      />
      {notice ? <Alert onClose={() => setNotice(null)} severity="info" sx={{ mb: 2 }}>{notice}</Alert> : null}
      <ErgPageSurface sx={{ mb: 2, p: 0 }}>
        <Tabs onChange={(_, nextTab: number) => setTab(nextTab)} value={tab} variant="scrollable">
          <Tab label="SCORM packages" />
          <Tab label="LTI & xAPI" />
        </Tabs>
      </ErgPageSurface>
      {tab === 0 ? (
        <LearningStandardsPackageTable
          canManage={canManage}
          isError={packagesQuery.isError}
          isLoading={packagesQuery.isLoading}
          onLaunch={(value) => void launch(value)}
          onRetry={() => void packagesQuery.refetch()}
          onValidate={setValidationPackage}
          packages={packagesQuery.data ?? []}
        />
      ) : (
        <LearningStandardsIntegrationPanel canManage={canManage} onComplete={setNotice} scope={scope} />
      )}
      <LearningStandardsPackageCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} onComplete={setNotice} scope={scope} />
      <LearningStandardsPackageValidationDialog packageValue={validationPackage} open={Boolean(validationPackage)} onClose={() => setValidationPackage(null)} onComplete={setNotice} scope={scope} />
    </ErgContentBand>
  );
}

export default LearningStandardsWorkspace;

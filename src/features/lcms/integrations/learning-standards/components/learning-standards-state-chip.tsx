import Chip from "@mui/material/Chip";

import type { LearningPackageStatus } from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";

const labels: Record<LearningPackageStatus, string> = {
  UPLOADING: "Đang tải lên",
  VALIDATING: "Đang kiểm tra",
  READY: "Sẵn sàng",
  QUARANTINED: "Cách ly",
};

export function LearningStandardsStateChip({ status }: { status: LearningPackageStatus }) {
  const color = status === "READY" ? "success" : status === "QUARANTINED" ? "error" : status === "VALIDATING" ? "warning" : "info";
  return <Chip color={color} label={labels[status]} size="small" />;
}

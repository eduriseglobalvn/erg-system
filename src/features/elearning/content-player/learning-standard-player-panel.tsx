import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Typography from "@mui/material/Typography";

import type { LearningStandardPackage } from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";
import { useLaunchLearningStandardPackage, useLearningStandardsScope } from "@/features/lcms/integrations/learning-standards/api/learning-standards-query";

export type LearningStandardPlayerPanelProps = {
  packageId: string;
  title?: string;
  onLaunchResolved?: (value: LearningStandardPackage) => void;
};

/**
 * Server-confirmed entry point for a SCORM package in the learner player.
 * The backend currently returns a relative launch path, not a signed asset URL;
 * therefore this component deliberately does not invent an iframe URL.
 */
export function LearningStandardPlayerPanel({ packageId, title = "Nội dung chuẩn hóa", onLaunchResolved }: LearningStandardPlayerPanelProps) {
  const scope = useLearningStandardsScope("STUDENT");
  const mutation = useLaunchLearningStandardPackage(scope);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<LearningStandardPackage | null>(null);

  async function launch() {
    setError(null);
    try {
      const value = await mutation.mutateAsync({ packageId });
      setResolved(value);
      onLaunchResolved?.(value);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể mở nội dung chuẩn hóa.");
    }
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: "grid", gap: 1.25 }}>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle1">{title}</Typography>
        <Typography color="text.secondary" variant="body2">SCORM package được kiểm tra quyền launch theo tài khoản học viên.</Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {resolved ? (
          <Alert severity="success">
            Backend đã xác nhận package <strong>{resolved.id}</strong> ở trạng thái {resolved.status}. Launch path: <code>{resolved.launchPath || "chưa có"}</code>.
          </Alert>
        ) : null}
        <Box>
          <Button disabled={!packageId.trim() || mutation.isPending} onClick={() => void launch()} startIcon={<LaunchRoundedIcon />} variant="contained">
            {mutation.isPending ? "Đang kiểm tra quyền…" : "Mở nội dung"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LearningStandardPlayerPanel;

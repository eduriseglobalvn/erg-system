import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  canUseDesktopUpdater,
  checkDesktopUpdate,
  installDesktopUpdate,
  type DesktopUpdateProgress,
  type DesktopUpdateResult,
} from "@/platform/desktop";

export function DesktopUpdateBanner() {
  const [result, setResult] = useState<DesktopUpdateResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState<DesktopUpdateProgress | null>(null);

  const checkForUpdate = async () => {
    setChecking(true);
    setResult(null);
    setProgress(null);
    const next = await checkDesktopUpdate({ channel: "stable" });
    setResult(next);
    setChecking(false);
  };

  useEffect(() => {
    if (!canUseDesktopUpdater()) return;
    void checkForUpdate();
  }, []);

  if (!canUseDesktopUpdater()) return null;

  const install = async () => {
    if (result?.status !== "available") return;
    setInstalling(true);
    const next = await installDesktopUpdate(result.update, setProgress);
    setResult(next.status === "installed" ? { status: "up-to-date", state: "up-to-date" } : next);
    setInstalling(false);
  };

  return (
    <Alert
      severity={result?.status === "error" ? "error" : result?.status === "available" ? "info" : "success"}
      sx={{ borderRadius: 2 }}
      action={
        <Button
          color="inherit"
          size="small"
          disabled={checking || installing}
          onClick={() => void (result?.status === "available" ? install() : checkForUpdate())}
        >
          {installing ? "Đang cập nhật…" : checking ? "Đang kiểm tra…" : result?.status === "available" ? "Cài đặt" : "Kiểm tra cập nhật"}
        </Button>
      }
    >
      <Stack spacing={0.25}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {result?.status === "available"
            ? `Có bản cập nhật ERG LMS Desktop ${result.version}`
            : result?.status === "error"
              ? "Không thể kiểm tra cập nhật desktop"
              : result?.status === "up-to-date"
                ? "Desktop đang ở phiên bản mới nhất"
                : "Desktop updater sẵn sàng"}
        </Typography>
        {result?.status === "available" && result.body ? <Typography variant="caption">{result.body}</Typography> : null}
        {result?.status === "error" ? <Typography variant="caption">{result.error}</Typography> : null}
        {installing && progress ? <Typography variant="caption">Đã tải {progress.downloadedBytes.toLocaleString("vi-VN")} byte</Typography> : null}
      </Stack>
    </Alert>
  );
}


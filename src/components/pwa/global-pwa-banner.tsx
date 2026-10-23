import { useEffect, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useServiceWorkerUpdate } from "@/features/lms/mobile/hooks/use-service-worker-update";

export const PWA_LAUNCH_FILE_EVENT = "erg:pwa:launch-file";

export function GlobalPwaBanner() {
  const { applyUpdate, updateAvailable } = useServiceWorkerUpdate();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Window Controls Overlay & File Handling API listener
    if (typeof window === "undefined") return;

    if ("launchQueue" in window && "files" in (window as unknown as { LaunchParams: { prototype: object } }).LaunchParams.prototype) {
      (window as unknown as { launchQueue: { setConsumer: (cb: (params: { files?: FileSystemFileHandle[] }) => Promise<void>) => void } })
        .launchQueue.setConsumer(async (launchParams) => {
          if (!launchParams.files || launchParams.files.length === 0) return;
          try {
            const firstHandle = launchParams.files[0];
            const file = await firstHandle.getFile();
            window.dispatchEvent(new CustomEvent(PWA_LAUNCH_FILE_EVENT, { detail: { file } }));
          } catch (err) {
            console.error("Failed to read file from PWA launchQueue:", err);
          }
        });
    }
  }, []);

  const handleApplyUpdate = () => {
    setUpdating(true);
    applyUpdate();
  };

  if (!updateAvailable) return null;

  return (
    <Snackbar
      open={updateAvailable}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{
        bottom: { xs: "calc(env(safe-area-inset-bottom, 0px) + 80px)", sm: "calc(env(safe-area-inset-bottom, 0px) + 24px)" },
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Alert
        severity="info"
        variant="filled"
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(15, 23, 42, 0.2)",
          alignItems: "center",
          px: 2,
          py: 0.75,
        }}
        action={
          <Button
            color="inherit"
            size="small"
            variant="outlined"
            disabled={updating}
            onClick={handleApplyUpdate}
            startIcon={<RefreshRoundedIcon />}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.6)",
              color: "#fff",
              fontWeight: 700,
              ml: 1,
              "&:hover": {
                borderColor: "#fff",
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {updating ? "Đang tải…" : "Cập nhật"}
          </Button>
        }
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Đã có phiên bản mới của ERG
          </Typography>
        </Stack>
      </Alert>
    </Snackbar>
  );
}

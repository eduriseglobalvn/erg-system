import { useEffect, useState } from "react";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import Box from "@mui/material/Box";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { OutboxQuarantineNotice } from "@/components/pwa/outbox-quarantine-notice";
import { useServiceWorkerUpdate } from "@/hooks/use-service-worker-update";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export const PWA_LAUNCH_FILE_EVENT = "erg:pwa:launch-file";

const { color, radius, shadow } = ergEnterpriseTokens;

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

  return (
    <>
    <OutboxQuarantineNotice />
    <Snackbar
      open={updateAvailable}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{
        // Phones: sit above the floating dock; from sm up there is no dock.
        bottom: { xs: ergMobileDockAnchor(12), sm: "calc(env(safe-area-inset-bottom, 0px) + 24px)" },
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 24px), 420px)",
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <Box
        aria-live="polite"
        role="status"
        sx={{
          alignItems: "center",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${radius.card}px`,
          boxShadow: shadow.float,
          display: "flex",
          gap: 1.5,
          p: 1.5,
          width: "100%",
        }}
      >
        <Box
          aria-hidden
          sx={{
            alignItems: "center",
            bgcolor: color.primarySofter,
            borderRadius: `${radius.control}px`,
            color: "primary.main",
            display: "flex",
            flexShrink: 0,
            height: 40,
            justifyContent: "center",
            width: 40,
          }}
        >
          <SystemUpdateAltRoundedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2">Có phiên bản mới</Typography>
          <Typography color="text.secondary" variant="caption" component="p">
            Cập nhật để dùng tính năng mới nhất.
          </Typography>
        </Box>
        <ErgButton loading={updating} onClick={handleApplyUpdate} size="small" sx={{ flexShrink: 0 }}>
          {updating ? "Đang cập nhật…" : "Cập nhật"}
        </ErgButton>
      </Box>
    </Snackbar>
    </>
  );
}

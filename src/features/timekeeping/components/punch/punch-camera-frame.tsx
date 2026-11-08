import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { InputHTMLAttributes, RefObject } from "react";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type PunchCameraFrameProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** False when getUserMedia is missing or the permission was refused: the photo comes from the file input. */
  live: boolean;
  fallbackInputProps: InputHTMLAttributes<HTMLInputElement>;
  hasPhoto?: boolean;
  error?: string | null;
  onPickFile: (file: File) => void;
  onSwitchCamera: () => void;
};

/** G02 camera frame with the hint, a camera switch, or the file-input fallback. */
export function PunchCameraFrame({ videoRef, live, fallbackInputProps, hasPhoto, error, onPickFile, onSwitchCamera }: PunchCameraFrameProps) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      {live ? (
        <Box sx={{ bgcolor: "text.primary", borderRadius: `${ergEnterpriseTokens.radius.shell}px`, height: 330, overflow: "hidden", position: "relative" }}>
          <video aria-label="Khung camera" muted playsInline ref={videoRef} style={{ height: "100%", objectFit: "cover", transform: "scaleX(-1)", width: "100%" }} />
          {/* Face guide: an oval cut out of a dimmed frame. */}
          <Box aria-hidden sx={{ border: 3, borderColor: "common.white", borderRadius: "50%", boxShadow: "0 0 0 999px rgba(0, 0, 0, 0.35)", height: 240, left: "50%", position: "absolute", top: "50%", transform: "translate(-50%, -50%)", width: 190 }} />
          <ErgStatusChip dot={false} label="Giữ mặt trong khung · đủ sáng" sx={{ bgcolor: "background.paper", color: "text.primary", left: "50%", position: "absolute", top: 14, transform: "translateX(-50%)" }} />
          <ErgIconButton label="Đổi camera" onClick={onSwitchCamera} sx={{ bgcolor: "rgba(255, 255, 255, 0.15)", bottom: 14, color: "common.white", position: "absolute", right: 14 }}>
            <CameraswitchIcon />
          </ErgIconButton>
        </Box>
      ) : (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "grid", gap: 1, justifyItems: "center", p: 2 }}>
          <Typography color="text.secondary" variant="body2">Không mở được camera. Chọn hoặc chụp một ảnh khuôn mặt.</Typography>
          <Button component="label" startIcon={<PhotoCameraIcon />} variant="outlined">
            Chọn ảnh
            <input
              {...fallbackInputProps}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onPickFile(file);
              }}
            />
          </Button>
          {hasPhoto ? <Typography variant="caption">Đã chọn ảnh</Typography> : null}
        </Box>
      )}
      {error || !live ? (
        <Typography color={error ? "error" : "text.secondary"} role={error ? "alert" : undefined} sx={{ textAlign: "center" }} variant="caption">
          {error ?? "Giữ mặt trong khung · đủ sáng"}
        </Typography>
      ) : null}
    </Box>
  );
}

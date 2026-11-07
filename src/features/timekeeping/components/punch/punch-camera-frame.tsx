import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { InputHTMLAttributes, RefObject } from "react";

import { ErgIconButton } from "@/components/erg-mui/erg-actions";
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
        <Box sx={{ aspectRatio: "4 / 3", bgcolor: "text.primary", borderRadius: `${ergEnterpriseTokens.radius.card}px`, overflow: "hidden", position: "relative" }}>
          <video aria-label="Khung camera" muted playsInline ref={videoRef} style={{ height: "100%", objectFit: "cover", transform: "scaleX(-1)", width: "100%" }} />
          <ErgIconButton label="Đổi camera" onClick={onSwitchCamera} sx={{ bgcolor: "background.paper", position: "absolute", right: 8, top: 8 }}>
            <CameraswitchIcon fontSize="small" />
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
      <Typography color={error ? "error" : "text.secondary"} role={error ? "alert" : undefined} sx={{ textAlign: "center" }} variant="caption">
        {error ?? "Giữ mặt trong khung · đủ sáng"}
      </Typography>
    </Box>
  );
}

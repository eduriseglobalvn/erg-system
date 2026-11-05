import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { MouseEvent, ReactNode } from "react";

import { ERG_ASSETS } from "@/config/seo";

export function StudentUpdateBanner({ onApply }: { onApply: () => void }) {
  return (
      <Box sx={{ flexShrink: 0, px: 2, pt: 1, zIndex: 1100 }}>
        <ButtonBase
          onClick={onApply}
          sx={{
            alignItems: "center",
            bgcolor: "rgba(37, 99, 235, 0.95)",
            borderRadius: "999px",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
            color: "#FFFFFF",
            display: "flex",
            gap: 1,
            mx: "auto",
            px: 2,
            py: 0.75,
          }}
        >
          <RefreshRoundedIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Bản cập nhật mới có sẵn · Chạm để làm mới</Typography>
        </ButtonBase>
      </Box>
  );
}

type InstallBannerProps = {
  meta: { icon: ReactNode; subtitle: string; title: string };
  onDismiss: (event: MouseEvent) => void;
  onInstall: () => void;
};

export function StudentInstallBanner({ meta: bannerMeta, onDismiss: handleDismiss, onInstall: handleInstallClick }: InstallBannerProps) {
  return (
      <Box sx={{ flexShrink: 0, px: 1.75, pt: 1, pb: 0.5, zIndex: 1050 }}>
        <Box
          sx={{
            alignItems: "center",
            backdropFilter: "blur(12px)",
            bgcolor: "rgba(255, 255, 255, 0.94)",
            border: "1px solid rgba(226, 232, 240, 0.85)",
            borderRadius: "14px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
            display: "flex",
            gap: 1,
            minHeight: 48,
            pl: 1.25,
            pr: 0.75,
            py: 0.75,
            width: "100%",
          }}
        >
          <ButtonBase
            onClick={handleInstallClick}
            sx={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              gap: 1.25,
              minHeight: 44,
              minWidth: 0,
              textAlign: "left",
            }}
          >
            <Box
              alt="ERG"
              component="img"
              src={ERG_ASSETS.logo}
              sx={{ bgcolor: "#FFFFFF", borderRadius: "8px", height: 28, objectFit: "contain", width: 28 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ color: "#0F172A", fontSize: 12.5, fontWeight: 600 }}>
                {bannerMeta.title}
              </Typography>
              <Typography noWrap sx={{ color: "#64748B", fontSize: 10.5, fontWeight: 550 }}>
                {bannerMeta.subtitle}
              </Typography>
            </Box>
            <Box sx={{ alignItems: "center", display: "flex", px: 0.5 }}>
              {bannerMeta.icon}
            </Box>
          </ButtonBase>

          <IconButton
            aria-label="Đóng gợi ý cài đặt"
            onClick={handleDismiss}
            size="small"
            sx={{
              color: "#94A3B8",
              flexShrink: 0,
              height: 44,
              p: 0.5,
              width: 44,
              "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)", color: "#0F172A" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>
  );
}

import { useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, radius, shadow } = ergEnterpriseTokens;
const DISMISS_KEY = "erg-pwa-install-dismissed";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function wasDismissedRecently() {
  try {
    return Date.now() - Number(window.localStorage.getItem(DISMISS_KEY)) < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

const GUIDES = {
  ios: {
    subtitle: "Xem hướng dẫn cho iPhone/iPad",
    steps: [
      <>Nhấn nút <b>Chia sẻ</b> <IosShareRoundedIcon fontSize="inherit" sx={{ verticalAlign: "-2px" }} /> trên thanh địa chỉ (hoặc menu ⋯ của trình duyệt).</>,
      <>Chọn <b>Thêm vào MH chính</b> (Add to Home Screen).</>,
      <>Nhấn <b>Thêm</b> ở góc trên bên phải, rồi mở ERG từ biểu tượng mới trên màn hình chính.</>,
    ],
    note: "Nếu không thấy mục này, hãy mở trang bằng Safari (không mở trong Zalo/Facebook).",
  },
  android: {
    subtitle: "Cài đặt nhanh, mở như ứng dụng",
    steps: [
      <>Nhấn menu <b>⋮</b> <MoreVertRoundedIcon fontSize="inherit" sx={{ verticalAlign: "-2px" }} /> của Chrome.</>,
      <>Chọn <b>Cài đặt ứng dụng</b> (hoặc <b>Thêm vào màn hình chính</b>).</>,
      <>Nhấn <b>Cài đặt</b>, rồi mở ERG từ biểu tượng mới trên màn hình chính.</>,
    ],
    note: "Nếu không thấy mục này, hãy mở trang bằng Chrome (không mở trong Zalo/Facebook).",
  },
} as const;

/** Phone browsers only: offers to install the PWA, with steps for the phone's own OS (iOS has no install prompt). */
export function PwaInstallBanner() {
  const install = useInstallPrompt();
  const [dismissed, setDismissed] = useState(wasDismissedRecently);
  const [guideOpen, setGuideOpen] = useState(false);
  const os = install.platform === "ios" ? "ios" : install.platform === "android" ? "android" : null;

  if (install.installed || dismissed || !os) return null;
  const guide = GUIDES[os];

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // storage blocked: dismissed for this page view only
    }
    setDismissed(true);
  }
  async function onInstall() {
    if (install.canInstall && (await install.promptInstall()) !== "unavailable") return;
    setGuideOpen(true);
  }

  return (
    <>
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${radius.card}px`,
          bottom: ergMobileDockAnchor(12),
          boxShadow: shadow.float,
          display: { xs: "flex", md: "none" },
          gap: 1.5,
          left: 12,
          maxWidth: 480,
          mx: "auto",
          p: 1.5,
          position: "fixed",
          right: 12,
          transition: "bottom 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: (theme) => theme.zIndex.appBar + 1,
        }}
      >
        <ButtonBase onClick={() => void onInstall()} sx={{ alignItems: "center", display: "flex", flex: 1, gap: 1.5, minWidth: 0, textAlign: "left" }}>
          <Box aria-hidden sx={{ alignItems: "center", bgcolor: color.primarySofter, borderRadius: `${radius.control}px`, color: "primary.main", display: "flex", flexShrink: 0, height: 40, justifyContent: "center", width: 40 }}>
            <PhoneAndroidRoundedIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap variant="subtitle2">Cài ERG lên màn hình chính</Typography>
            <Typography color="text.secondary" noWrap variant="caption">{guide.subtitle}</Typography>
          </Box>
        </ButtonBase>
        <IconButton aria-label="Để sau" onClick={dismiss} size="small"><CloseRoundedIcon fontSize="small" /></IconButton>
      </Box>
      <Drawer anchor="bottom" onClose={() => setGuideOpen(false)} open={guideOpen} slotProps={{ paper: { sx: { borderRadius: `${radius.shell}px ${radius.shell}px 0 0`, p: 2.5, pb: "calc(env(safe-area-inset-bottom, 0px) + 20px)" } } }}>
        <Typography sx={{ mb: 1.5 }} variant="h4">{os === "ios" ? "Cài ERG trên iPhone/iPad" : "Cài ERG trên Android"}</Typography>
        <Box component="ol" sx={{ display: "grid", gap: 1.25, m: 0, pl: 2.5 }}>
          {guide.steps.map((step, index) => (
            <Typography component="li" key={index} variant="body2">{step}</Typography>
          ))}
        </Box>
        <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="caption" component="p">{guide.note}</Typography>
        <ErgButton fullWidth onClick={() => setGuideOpen(false)} sx={{ mt: 2 }}>Đã hiểu</ErgButton>
      </Drawer>
    </>
  );
}

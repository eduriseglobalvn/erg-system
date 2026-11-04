import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import LaptopChromebookRoundedIcon from "@mui/icons-material/LaptopChromebookRounded";
import PhoneAndroidRoundedIcon from "@mui/icons-material/PhoneAndroidRounded";
import { useMemo, useState } from "react";

import type { useInstallPrompt } from "@/hooks/use-install-prompt";

export function useStudentInstallBanner(installPrompt: ReturnType<typeof useInstallPrompt>, openSetup: () => void) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage?.getItem("erg_pwa_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const isInstalled = installPrompt.installed;
  const isIos = installPrompt.isIos;
  const isAndroid = installPrompt.platform === "android";
  const canDirectInstall = installPrompt.canInstall;

  // Never offer install if already installed or dismissed by user in this session
  const shouldOfferInstall =
    !isInstalled && !dismissed && (canDirectInstall || isIos || isAndroid);

  const bannerMeta = useMemo(() => {
    if (isIos) {
      return {
        icon: <IosShareRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
        subtitle: 'Mở Safari, nhấn nút Chia sẻ và chọn "Thêm vào MH chính"',
        title: "Thêm ERG Learning vào Màn hình chính",
      };
    }
    if (isAndroid) {
      return {
        icon: <PhoneAndroidRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
        subtitle: "Cài ứng dụng nhanh trực tiếp từ trình duyệt Android",
        title: "Cài đặt ERG Learning cho Android",
      };
    }
    return {
      icon: <LaptopChromebookRoundedIcon sx={{ color: "#2563EB", fontSize: 18 }} />,
      subtitle: "Mở nhanh Student Workspace từ màn hình thiết bị",
      title: "Cài đặt ứng dụng ERG Learning",
    };
  }, [isIos, isAndroid]);

  const handleInstallClick = async () => {
    if (canDirectInstall) {
      const outcome = await installPrompt.promptInstall();
      if (outcome === "accepted") return;
    }
    openSetup();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      window.sessionStorage?.setItem("erg_pwa_banner_dismissed", "true");
    } catch {
      // storage unavailable (private mode); dismissal just won't persist
    }
  };

  return { bannerMeta, handleDismiss, handleInstallClick, shouldOfferInstall };
}

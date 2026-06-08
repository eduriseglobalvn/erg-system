import { useCallback, useEffect, useState } from "react";

type InstallPromptOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallPromptOutcome; platform: string }>;
};

type InstallPlatform = "android" | "ios" | "desktop" | "unknown";

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isRunningStandalone());
  const [platform, setPlatform] = useState<InstallPlatform>(() => detectInstallPlatform());

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallEvent(null);
      setInstalled(true);
    };
    const handleDisplayModeChange = () => {
      setInstalled(isRunningStandalone());
      setPlatform(detectInstallPlatform());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.matchMedia?.("(display-mode: standalone)").addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.matchMedia?.("(display-mode: standalone)").removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return "unavailable" as const;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;

    if (choice.outcome === "accepted") {
      setInstallEvent(null);
    }

    return choice.outcome;
  }, [installEvent]);

  return {
    canInstall: Boolean(installEvent),
    installed,
    isIos: platform === "ios",
    isManualInstall: !installEvent && !installed && platform === "ios",
    platform,
    promptInstall,
  };
}

function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function detectInstallPlatform(): InstallPlatform {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() ?? "";
  const maxTouchPoints = window.navigator.maxTouchPoints ?? 0;
  const isiPadOs = platform === "macintel" && maxTouchPoints > 1;

  if (/iphone|ipad|ipod/.test(userAgent) || isiPadOs) return "ios";
  if (/android/.test(userAgent)) return "android";
  if (/chrome|edge|firefox|safari/.test(userAgent)) return "desktop";
  return "unknown";
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

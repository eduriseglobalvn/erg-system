import { useEffect, useState } from "react";

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;

    const watchRegistration = async () => {
      registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const waitingWorker = registration.waiting;
      if (waitingWorker) {
        setUpdateAvailable(true);
      }

      registration.addEventListener("updatefound", () => {
        const installingWorker = registration?.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    };

    void watchRegistration();
  }, []);

  function applyUpdate() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then((registration) => {
      registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    });
  }

  return {
    applyUpdate,
    updateAvailable,
  };
}

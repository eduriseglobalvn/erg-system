import { useEffect, useRef, useState } from "react";

const UPDATE_CHECK_INTERVAL_MS = 60_000;

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const reloadPendingRef = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);
  const checkInFlightRef = useRef<Promise<void> | undefined>(undefined);
  const lastCheckAtRef = useRef(0);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let disposed = false;
    let observedRegistration: ServiceWorkerRegistration | undefined;
    let observedWorker: ServiceWorker | null = null;

    const syncWaitingState = (registration: ServiceWorkerRegistration) => {
      if (!disposed && registration.waiting) setUpdateAvailable(true);
    };
    const handleWorkerStateChange = () => {
      if (!disposed && observedWorker?.state === "installed" && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    };
    const handleUpdateFound = () => {
      observedWorker?.removeEventListener("statechange", handleWorkerStateChange);
      observedWorker = observedRegistration?.installing ?? null;
      observedWorker?.addEventListener("statechange", handleWorkerStateChange);
    };
    const observeRegistration = (registration: ServiceWorkerRegistration) => {
      if (observedRegistration === registration) return;
      observedRegistration?.removeEventListener("updatefound", handleUpdateFound);
      observedWorker?.removeEventListener("statechange", handleWorkerStateChange);
      observedRegistration = registration;
      registrationRef.current = registration;
      registration.addEventListener("updatefound", handleUpdateFound);
      syncWaitingState(registration);
    };
    const checkForUpdate = (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckAtRef.current < UPDATE_CHECK_INTERVAL_MS) return Promise.resolve();
      if (checkInFlightRef.current) return checkInFlightRef.current;

      lastCheckAtRef.current = now;
      const operation = (async () => {
        try {
          const registration = registrationRef.current ?? await navigator.serviceWorker.getRegistration();
          if (!registration || disposed) return;
          observeRegistration(registration);
          await registration.update();
          syncWaitingState(registration);
        } catch {
          // Offline/update-server failures are recoverable and retried on the
          // next focus or online event; they must not interrupt the workspace.
        }
      })().finally(() => {
        if (checkInFlightRef.current === operation) checkInFlightRef.current = undefined;
      });
      checkInFlightRef.current = operation;
      return operation;
    };
    const handleResume = () => { void checkForUpdate(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };

    window.addEventListener("focus", handleResume);
    window.addEventListener("online", handleResume);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    void checkForUpdate(true);

    return () => {
      disposed = true;
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("online", handleResume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observedRegistration?.removeEventListener("updatefound", handleUpdateFound);
      observedWorker?.removeEventListener("statechange", handleWorkerStateChange);
    };
  }, []);

  function applyUpdate() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistration().then((registration) => {
      const waitingWorker = registration?.waiting;
      if (!waitingWorker || reloadPendingRef.current) return;

      const reloadAfterControllerChange = () => {
        reloadPendingRef.current = false;
        navigator.serviceWorker.removeEventListener("controllerchange", reloadAfterControllerChange);
        window.location.reload();
      };

      reloadPendingRef.current = true;
      navigator.serviceWorker.addEventListener("controllerchange", reloadAfterControllerChange);
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    });
  }

  return { applyUpdate, updateAvailable };
}

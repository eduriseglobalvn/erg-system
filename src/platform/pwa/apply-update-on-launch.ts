const LAUNCH_WINDOW_MS = 30_000;
const APPLIED_KEY = "erg-launch-update-applied";
const PROTECTED_PATH = /exam|quiz|attempt/i;

/**
 * An installed app opens on the previous release until its worker is replaced, which otherwise takes
 * "open, quit, open again". If the new worker is ready within LAUNCH_WINDOW_MS of opening and the user has not
 * touched anything yet (nothing to lose), activate it and reload once. Later updates keep the manual prompt.
 */
export function applyUpdateOnLaunch() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;

  const startedAt = Date.now();
  let interacted = false;
  const markInteraction = () => { interacted = true; };
  const events = ["pointerdown", "keydown", "touchstart"] as const;
  for (const name of events) window.addEventListener(name, markInteraction, { capture: true, once: true, passive: true });

  function tryApply(registration: ServiceWorkerRegistration) {
    const waiting = registration.waiting;
    if (!waiting || interacted || Date.now() - startedAt > LAUNCH_WINDOW_MS || PROTECTED_PATH.test(window.location.pathname)) return;
    try {
      if (window.sessionStorage.getItem(APPLIED_KEY)) return;
      window.sessionStorage.setItem(APPLIED_KEY, "1");
    } catch {
      return; // no storage: cannot guard against a reload loop
    }
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  void navigator.serviceWorker.ready.then((registration) => {
    tryApply(registration);
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed") tryApply(registration);
      });
    });
  });
}

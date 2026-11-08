const CLEANUP_TIMEOUT_MS = 3_000;

/**
 * Reload that escapes a stale service-worker shell. After a deploy the old worker keeps serving its precached
 * index.html (whose lazy chunks no longer exist), so a plain reload loops on the same dead shell. Online, we drop
 * the workers and caches first so the reload hits the network; offline the cached shell is all we have, so keep it.
 */
export async function reloadFresh() {
  if (typeof window === "undefined") return;
  if (navigator.onLine) {
    const cleanup = Promise.all([
      "serviceWorker" in navigator
        ? navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        : undefined,
      typeof caches !== "undefined" ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))) : undefined,
    ]).catch(() => undefined);
    // A hung cleanup must not keep the user on the broken page.
    await Promise.race([cleanup, new Promise((resolve) => window.setTimeout(resolve, CLEANUP_TIMEOUT_MS))]);
  }
  window.location.reload();
}

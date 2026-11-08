import { afterEach, expect, test, vi } from "vitest";
import { reloadFresh } from "./reload-fresh";

afterEach(() => vi.unstubAllGlobals());

function stubEnvironment(online: boolean) {
  const unregister = vi.fn(async () => true);
  const deleteCache = vi.fn(async () => true);
  const reload = vi.fn();
  vi.stubGlobal("navigator", { onLine: online, serviceWorker: { getRegistrations: async () => [{ unregister }] } });
  vi.stubGlobal("caches", { keys: async () => ["workbox-precache-v2"], delete: deleteCache });
  vi.stubGlobal("location", { reload });
  return { unregister, deleteCache, reload };
}

test("online reload drops the stale service worker and caches first", async () => {
  const { unregister, deleteCache, reload } = stubEnvironment(true);
  await reloadFresh();
  expect(unregister).toHaveBeenCalledTimes(1);
  expect(deleteCache).toHaveBeenCalledWith("workbox-precache-v2");
  expect(reload).toHaveBeenCalledTimes(1);
});

test("offline reload keeps the cached shell", async () => {
  const { unregister, deleteCache, reload } = stubEnvironment(false);
  await reloadFresh();
  expect(unregister).not.toHaveBeenCalled();
  expect(deleteCache).not.toHaveBeenCalled();
  expect(reload).toHaveBeenCalledTimes(1);
});

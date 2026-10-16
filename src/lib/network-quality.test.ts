import { describe, expect, test } from "vitest";

import { resolveAdaptiveLoadingPolicy, resolveNetworkState } from "@/lib/network-quality";

describe("adaptive loading policy", () => {
  test("derives one advisory network state for the offline shell", () => {
    expect(resolveNetworkState({ online: false })).toMatchObject({ quality: "offline", policy: { mode: "minimal" } });
    expect(resolveNetworkState({ effectiveType: "3g", online: true, saveData: false })).toMatchObject({ quality: "degraded", policy: { mode: "reduced" } });
    expect(resolveNetworkState({ effectiveType: "4g", online: true, saveData: false })).toMatchObject({ quality: "online", policy: { mode: "full" } });
  });

  test("keeps full behavior for SSR, unsupported browsers and 4G", () => {
    expect(resolveAdaptiveLoadingPolicy()).toMatchObject({ mode: "full", prefetchNonEssential: true, preloadRoutes: true });
    expect(resolveAdaptiveLoadingPolicy({ online: true })).toMatchObject({ mode: "full", prefetchNonEssential: true, preloadRoutes: true });
    expect(resolveAdaptiveLoadingPolicy({ effectiveType: "4g", online: true, saveData: false })).toMatchObject({ mode: "full", prefetchNonEssential: true, preloadRoutes: true });
  });

  test("reduces non-essential work on 3G", () => {
    expect(resolveAdaptiveLoadingPolicy({ effectiveType: "3g", online: true, saveData: false })).toEqual({
      mode: "reduced",
      preferReducedMedia: true,
      prefetchNonEssential: false,
      preloadRoutes: false,
    });
  });

  test.each([
    { effectiveType: "2g" as const, online: true, saveData: false },
    { effectiveType: "slow-2g" as const, online: true, saveData: false },
    { effectiveType: "4g" as const, online: true, saveData: true },
    { effectiveType: "4g" as const, online: false, saveData: false },
  ])("uses minimal loading for constrained snapshot %#", (snapshot) => {
    expect(resolveAdaptiveLoadingPolicy(snapshot)).toEqual({
      mode: "minimal",
      preferReducedMedia: true,
      prefetchNonEssential: false,
      preloadRoutes: false,
    });
  });
});

import { describe, expect, test, vi } from "vitest";

import { createDesktopUpdaterController, type DesktopUpdateHandle } from "./updater";

const update = (overrides: Partial<DesktopUpdateHandle> = {}): DesktopUpdateHandle => ({
  currentVersion: "1.0.0",
  version: "1.1.0",
  downloadAndInstall: vi.fn(async (onEvent) => {
    onEvent?.({ event: "Started", data: { contentLength: 10 } });
    onEvent?.({ event: "Progress", data: { chunkLength: 4 } });
    onEvent?.({ event: "Finished" });
  }),
  close: vi.fn(async () => undefined),
  ...overrides,
});

describe("desktop updater controller", () => {
  test("fails closed when the runtime is not Tauri", async () => {
    const controller = createDesktopUpdaterController({
      check: vi.fn(),
      relaunch: vi.fn(),
    });

    await expect(controller.check()).resolves.toMatchObject({ status: "unavailable" });
    await expect(controller.install()).resolves.toMatchObject({ status: "unavailable" });
  });

  test("normalizes channel and timeout, then reports an available update", async () => {
    const check = vi.fn(async () => update({ body: "Security fixes" }));
    const controller = createDesktopUpdaterController({ check, relaunch: vi.fn(async () => undefined) });

    // The jsdom runtime is web, so inject the Tauri marker only for this test.
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    try {
      const result = await controller.check({ channel: "stable", timeoutMs: 999_999 });
      expect(result).toMatchObject({ status: "available", version: "1.1.0" });
      expect(check).toHaveBeenCalledWith({ timeout: 120_000, headers: { "X-ERG-Release-Channel": "stable" } });
    } finally {
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
  });

  test("downloads, reports progress, closes the resource, and relaunches", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    const relaunch = vi.fn(async () => undefined);
    const handle = update();
    const controller = createDesktopUpdaterController({ check: vi.fn(async () => handle), relaunch });
    const progress: number[] = [];
    try {
      const available = await controller.check();
      if (available.status !== "available") throw new Error("expected update");
      const result = await controller.install(available.update, (event) => progress.push(event.downloadedBytes));
      expect(result).toMatchObject({ status: "installed", version: "1.1.0" });
      expect(progress).toEqual([0, 4, 4]);
      expect(handle.close).toHaveBeenCalledTimes(1);
      expect(relaunch).toHaveBeenCalledTimes(1);
    } finally {
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
  });

  test("returns a safe error and does not relaunch after failed installation", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
    const relaunch = vi.fn(async () => undefined);
    const controller = createDesktopUpdaterController({
      check: vi.fn(async () => update({ downloadAndInstall: vi.fn(async () => { throw new Error("network unavailable"); }) })),
      relaunch,
    });
    try {
      const available = await controller.check();
      if (available.status !== "available") throw new Error("expected update");
      await expect(controller.install(available.update)).resolves.toMatchObject({ status: "error", error: "network unavailable" });
      expect(relaunch).not.toHaveBeenCalled();
    } finally {
      delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
  });
});


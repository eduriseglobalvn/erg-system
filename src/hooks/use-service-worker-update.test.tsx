import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { useServiceWorkerUpdate } from "./use-service-worker-update";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("waits for the new service worker to control the page before reloading", async () => {
  const waitingWorker = { postMessage: vi.fn() };
  const registration = {
    waiting: waitingWorker,
    installing: null,
    update: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration;
  const serviceWorker = {
    controller: {},
    getRegistration: vi.fn().mockResolvedValue(registration),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorkerContainer;
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });

  const { result } = renderHook(() => useServiceWorkerUpdate());

  await waitFor(() => expect(result.current.updateAvailable).toBe(true));
  await act(async () => result.current.applyUpdate());

  await waitFor(() => expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" }));
  expect(serviceWorker.addEventListener).toHaveBeenCalledWith("controllerchange", expect.any(Function));
});

it("checks for updates again after a later focus or online resume", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-14T00:00:00.000Z"));
  const update = vi.fn().mockResolvedValue(undefined);
  const registration = {
    waiting: null,
    installing: null,
    update,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration;
  const serviceWorker = {
    controller: {},
    getRegistration: vi.fn().mockResolvedValue(registration),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorkerContainer;
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });

  renderHook(() => useServiceWorkerUpdate());
  await act(async () => Promise.resolve());
  expect(update).toHaveBeenCalledTimes(1);

  vi.setSystemTime(new Date("2026-08-14T00:01:01.000Z"));
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await Promise.resolve();
  });
  expect(update).toHaveBeenCalledTimes(2);

  vi.setSystemTime(new Date("2026-08-14T00:02:02.000Z"));
  await act(async () => {
    window.dispatchEvent(new Event("online"));
    await Promise.resolve();
  });
  expect(update).toHaveBeenCalledTimes(3);
});

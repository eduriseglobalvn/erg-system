import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { reloadFresh } from "@/platform/pwa/reload-fresh";
import { useServiceWorkerUpdate } from "./use-service-worker-update";

vi.mock("@/platform/pwa/reload-fresh", () => ({ reloadFresh: vi.fn() }));

afterEach(() => {
  vi.mocked(reloadFresh).mockClear();
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

function stubServiceWorker(registration: Partial<ServiceWorkerRegistration>) {
  const full = { installing: null, update: vi.fn().mockResolvedValue(undefined), addEventListener: vi.fn(), removeEventListener: vi.fn(), ...registration } as unknown as ServiceWorkerRegistration;
  const serviceWorker = { controller: {}, getRegistration: vi.fn().mockResolvedValue(full), addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as ServiceWorkerContainer;
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: serviceWorker });
  return full;
}

it("reloads clean instead of hanging when there is no waiting worker left to apply", async () => {
  stubServiceWorker({ waiting: null });
  const { result } = renderHook(() => useServiceWorkerUpdate());
  await act(async () => Promise.resolve());

  await act(async () => result.current.applyUpdate());

  await waitFor(() => expect(reloadFresh).toHaveBeenCalledTimes(1));
});

it("reloads clean when the waiting worker never takes control", async () => {
  vi.useFakeTimers();
  const waitingWorker = { postMessage: vi.fn() };
  stubServiceWorker({ waiting: waitingWorker as unknown as ServiceWorker });
  const { result } = renderHook(() => useServiceWorkerUpdate());
  await act(async () => Promise.resolve());

  await act(async () => result.current.applyUpdate());
  expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  expect(reloadFresh).not.toHaveBeenCalled();

  await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
  expect(reloadFresh).toHaveBeenCalledTimes(1);
});

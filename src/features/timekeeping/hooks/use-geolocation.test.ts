import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useGeolocation } from "./use-geolocation";

const originalSecure = Object.getOwnPropertyDescriptor(window, "isSecureContext");
afterEach(() => {
  if (originalSecure) Object.defineProperty(window, "isSecureContext", originalSecure);
  Reflect.deleteProperty(navigator, "geolocation");
});

function setSecure(value: boolean) {
  Object.defineProperty(window, "isSecureContext", { configurable: true, value });
}

test("insecure context reports 'insecure' without touching the geolocation API", () => {
  setSecure(false);
  const watchPosition = vi.fn();
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
  const { result } = renderHook(() => useGeolocation());
  act(() => result.current.request());
  expect(result.current.error).toBe("insecure");
  expect(watchPosition).not.toHaveBeenCalled();
});

test("maps PERMISSION_DENIED to 'denied' and watches with high accuracy, no cache", () => {
  setSecure(true);
  const watchPosition = vi.fn((_ok: unknown, fail: (e: { code: number }) => void, _options?: unknown) => { fail({ code: 1 }); return 7; });
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
  const { result } = renderHook(() => useGeolocation());
  act(() => result.current.request());
  expect(result.current.error).toBe("denied");
  expect(watchPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 });
});

test("stores the latest reading", () => {
  setSecure(true);
  const watchPosition = vi.fn((ok: (p: unknown) => void) => {
    ok({ coords: { latitude: 21, longitude: 105, accuracy: 12 }, timestamp: 1_000 });
    return 1;
  });
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
  const { result } = renderHook(() => useGeolocation());
  act(() => result.current.request());
  expect(result.current.reading).toEqual({ lat: 21, lng: 105, accuracyM: 12, at: 1_000 });
  expect(result.current.error).toBeNull();
});

test("clears the last fix when a later error arrives", () => {
  setSecure(true);
  let fail!: (e: { code: number }) => void;
  const watchPosition = vi.fn((ok: (p: unknown) => void, onError: (e: { code: number }) => void) => {
    fail = onError;
    ok({ coords: { latitude: 21, longitude: 105, accuracy: 12 }, timestamp: 1 });
    return 1;
  });
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: { watchPosition, clearWatch: vi.fn() } });
  const { result } = renderHook(() => useGeolocation());
  act(() => result.current.request());
  expect(result.current.reading).not.toBeNull();
  act(() => fail({ code: 3 }));
  expect(result.current.reading).toBeNull();
  expect(result.current.error).toBe("timeout");
});

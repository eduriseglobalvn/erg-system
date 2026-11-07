import { renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { useCameraCapture } from "./use-camera-capture";

afterEach(() => Reflect.deleteProperty(navigator, "mediaDevices"));

test("without navigator.mediaDevices the hook is unsupported and offers the file-input fallback", () => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
  const { result } = renderHook(() => useCameraCapture());
  expect(result.current.supported).toBe(false);
  expect(result.current.fallbackInputProps).toEqual({ type: "file", accept: "image/*", capture: "user" });
});

test("is supported when getUserMedia exists", () => {
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: () => Promise.resolve({}) } });
  expect(renderHook(() => useCameraCapture()).result.current.supported).toBe(true);
});

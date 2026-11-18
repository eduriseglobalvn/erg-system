import { renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { encodeSmallJpeg, TARGET_PHOTO_BYTES, useCameraCapture } from "./use-camera-capture";

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

test("releases the camera when the component unmounts while getUserMedia is pending", async () => {
  const track = { stop: vi.fn() };
  let resolveStream!: (stream: unknown) => void;
  const getUserMedia = vi.fn(() => new Promise((resolve) => { resolveStream = resolve; }));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  const { result, unmount } = renderHook(() => useCameraCapture());
  result.current.videoRef.current = document.createElement("video");
  const starting = result.current.start();
  unmount();
  resolveStream({ getTracks: () => [track] });
  await starting;
  expect(track.stop).toHaveBeenCalledTimes(1);
});

test("a superseded start() (camera switch) stops its own stream and keeps the newer one", async () => {
  const oldTrack = { stop: vi.fn() };
  const newTrack = { stop: vi.fn() };
  const resolvers: Array<(stream: unknown) => void> = [];
  const getUserMedia = vi.fn(() => new Promise((resolve) => { resolvers.push(resolve); }));
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  const { result } = renderHook(() => useCameraCapture());
  const video = document.createElement("video");
  video.play = () => Promise.resolve();
  result.current.videoRef.current = video;
  const first = result.current.start("user");
  const second = result.current.start("environment");
  // The newer request resolves first, then the stale one arrives late.
  resolvers[1]({ getTracks: () => [newTrack] });
  await second;
  resolvers[0]({ getTracks: () => [oldTrack] });
  await first;
  expect(oldTrack.stop).toHaveBeenCalledTimes(1);
  expect(newTrack.stop).not.toHaveBeenCalled();
});

test("encodeSmallJpeg keeps shrinking until the photo is under 5 KB", async () => {
  const tried: Array<[number, number]> = [];
  const original = document.createElement.bind(document);
  const spy = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag !== "canvas") return original(tag);
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }) } as unknown as HTMLCanvasElement;
    // Fake encoder: bytes grow with pixels and quality, like a real JPEG.
    canvas.toBlob = (done, _type, quality = 1) => {
      tried.push([canvas.width, quality]);
      done(new Blob([new Uint8Array(Math.round(canvas.width * canvas.height * quality * 0.4))]));
    };
    return canvas;
  }) as typeof document.createElement);
  const blob = await encodeSmallJpeg({} as CanvasImageSource, 1280, 960);
  spy.mockRestore();
  expect(blob?.size).toBeLessThanOrEqual(TARGET_PHOTO_BYTES);
  expect(tried[0]).toEqual([240, 0.5]);
  expect(tried.length).toBeGreaterThan(1);
});

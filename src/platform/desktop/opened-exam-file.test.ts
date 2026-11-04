import { afterEach, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { readOpenedExamFile } from "./opened-exam-file";

afterEach(() => {
  invoke.mockReset();
  delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
});

it("does not call native code outside the desktop app", async () => {
  await expect(readOpenedExamFile()).resolves.toBeNull();
  expect(invoke).not.toHaveBeenCalled();
});

it("returns the opened file bytes, or null when the player was started without a file", async () => {
  Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
  invoke.mockResolvedValueOnce(new Uint8Array([1, 2]).buffer);
  expect((await readOpenedExamFile())?.byteLength).toBe(2);
  expect(invoke).toHaveBeenCalledWith("opened_exam_file");
  invoke.mockResolvedValueOnce(new ArrayBuffer(0));
  await expect(readOpenedExamFile()).resolves.toBeNull();
});

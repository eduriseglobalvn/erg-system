import { afterEach, expect, test, vi } from "vitest";
import { applyUpdateOnLaunch } from "./apply-update-on-launch";

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
});

function stubWorker() {
  const postMessage = vi.fn();
  const registration = { waiting: { postMessage }, addEventListener: vi.fn() };
  vi.stubGlobal("navigator", { serviceWorker: { controller: {}, ready: Promise.resolve(registration), addEventListener: vi.fn() } });
  return postMessage;
}

test("a waiting worker is activated when the app was just opened and untouched", async () => {
  const postMessage = stubWorker();
  applyUpdateOnLaunch();
  await Promise.resolve();
  expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
});

test("nothing is activated once the user has interacted", async () => {
  const postMessage = stubWorker();
  applyUpdateOnLaunch();
  window.dispatchEvent(new Event("pointerdown"));
  await Promise.resolve();
  expect(postMessage).not.toHaveBeenCalled();
});

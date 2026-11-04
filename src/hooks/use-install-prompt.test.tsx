import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";

type MutableMediaQueryList = MediaQueryList & {
  matches: boolean;
};

describe("useInstallPrompt", () => {
  let mediaQuery: MutableMediaQueryList;

  beforeEach(() => {
    mediaQuery = createMediaQueryList(false);
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
    Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => mediaQuery) });
    Object.defineProperty(window.navigator, "standalone", { configurable: true, value: false });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36",
    });
    Object.defineProperty(window.navigator, "platform", { configurable: true, value: "Linux armv8l" });
    Object.defineProperty(window.navigator, "maxTouchPoints", { configurable: true, value: 5 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("captures the deferred browser prompt and reports an accepted install", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = createInstallEvent(prompt, "accepted");
    const { result } = renderHook(() => useInstallPrompt());

    act(() => window.dispatchEvent(event));
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    let outcome: Awaited<ReturnType<typeof result.current.promptInstall>> | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(prompt).toHaveBeenCalledOnce();
    expect(outcome).toBe("accepted");
    expect(result.current.canInstall).toBe(false);
  });

  it("keeps a dismissed prompt available until the browser emits a new lifecycle event", async () => {
    const event = createInstallEvent(vi.fn().mockResolvedValue(undefined), "dismissed");
    const { result } = renderHook(() => useInstallPrompt());

    act(() => window.dispatchEvent(event));
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    await act(async () => {
      expect(await result.current.promptInstall()).toBe("dismissed");
    });

    expect(result.current.canInstall).toBe(true);
    expect(result.current.installed).toBe(false);
  });

  it("switches to installed after appinstalled and never offers another prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    act(() => window.dispatchEvent(createInstallEvent(vi.fn().mockResolvedValue(undefined), "accepted")));
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    act(() => window.dispatchEvent(new Event("appinstalled")));

    await waitFor(() => expect(result.current.installed).toBe(true));
    expect(result.current.canInstall).toBe(false);
    await expect(result.current.promptInstall()).resolves.toBe("unavailable");
  });

  it("provides manual Add to Home Screen guidance on iOS", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1",
    });
    Object.defineProperty(window.navigator, "platform", { configurable: true, value: "iPhone" });

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.platform).toBe("ios");
    expect(result.current.isManualInstall).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it("recognizes an already-installed standalone launch", () => {
    mediaQuery.matches = true;

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.installed).toBe(true);
    expect(result.current.isManualInstall).toBe(false);
  });
});

function createInstallEvent(prompt: () => Promise<void>, outcome: "accepted" | "dismissed") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome, platform: "web" }),
  });
  return event;
}

function createMediaQueryList(matches: boolean): MutableMediaQueryList {
  const target = new EventTarget();
  return {
    matches,
    media: "(display-mode: standalone)",
    onchange: null,
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: target.dispatchEvent.bind(target),
  } as MutableMediaQueryList;
}

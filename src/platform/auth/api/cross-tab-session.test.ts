import { beforeEach, expect, test, vi } from "vitest";

const storage = vi.hoisted(() => ({ clearStoredAuthSessions: vi.fn() }));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  AUTH_SESSION_STORAGE_CHANGED_EVENT: "erg-auth-session-storage-changed",
  clearStoredAuthSessions: storage.clearStoredAuthSessions,
}));

class FakeBroadcastChannel {
  static latest: FakeBroadcastChannel | undefined;
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: unknown[] = [];

  name: string;

  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.latest = this;
  }

  postMessage(message: unknown) {
    this.posted.push(message);
  }

  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

beforeEach(() => {
  vi.resetModules();
  storage.clearStoredAuthSessions.mockReset();
  FakeBroadcastChannel.latest = undefined;
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

test("a local sign-in broadcasts a bare signal without any token", async () => {
  const { initializeCrossTabAuthSync } = await import("@/platform/auth/api/cross-tab-session");
  initializeCrossTabAuthSync();
  const session = { accountId: "u1", accessToken: "secret", refreshToken: "secret-r" };

  window.dispatchEvent(new CustomEvent("erg-auth-session-storage-changed", { detail: session }));
  window.dispatchEvent(new CustomEvent("erg-auth-session-storage-changed", { detail: null }));

  expect(FakeBroadcastChannel.latest!.posted).toEqual([{ type: "session-changed" }, { type: "signed-out" }]);
  expect(JSON.stringify(FakeBroadcastChannel.latest!.posted)).not.toContain("secret");
});

test("a signed-out signal clears this tab's own storage without echoing", async () => {
  const { initializeCrossTabAuthSync } = await import("@/platform/auth/api/cross-tab-session");
  initializeCrossTabAuthSync();
  storage.clearStoredAuthSessions.mockImplementation(() =>
    window.dispatchEvent(new CustomEvent("erg-auth-session-storage-changed", { detail: null })),
  );

  FakeBroadcastChannel.latest!.emit({ type: "signed-out" });

  expect(storage.clearStoredAuthSessions).toHaveBeenCalledTimes(1);
  expect(FakeBroadcastChannel.latest!.posted).toEqual([]);
});

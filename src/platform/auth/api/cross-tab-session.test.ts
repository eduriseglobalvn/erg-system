import { beforeEach, expect, test, vi } from "vitest";

const storage = vi.hoisted(() => ({ clearStoredAuthSessions: vi.fn(), currentTabAccountId: vi.fn<() => string | undefined>() }));
const logout = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/platform/auth/api/auth-api", () => ({ authApi: { logout } }));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  AUTH_SESSION_STORAGE_CHANGED_EVENT: "erg-auth-session-storage-changed",
  clearStoredAuthSessions: storage.clearStoredAuthSessions,
  currentTabAccountId: storage.currentTabAccountId,
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
  storage.currentTabAccountId.mockReset();
  logout.mockClear();
  FakeBroadcastChannel.latest = undefined;
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

test("a local sign-in broadcasts a bare signal without any token", async () => {
  const { initializeCrossTabAuthSync } = await import("@/platform/auth/api/cross-tab-session");
  initializeCrossTabAuthSync();
  const session = { accountId: "u1", accessToken: "secret", refreshToken: "secret-r" };

  window.dispatchEvent(new CustomEvent("erg-auth-session-storage-changed", { detail: session }));
  window.dispatchEvent(new CustomEvent("erg-auth-session-storage-changed", { detail: null }));

  expect(FakeBroadcastChannel.latest!.posted).toEqual([{ type: "session-changed", accountId: "u1" }, { type: "signed-out", accountId: "u1" }]);
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

test("another account signing out leaves this tab signed in", async () => {
  storage.currentTabAccountId.mockReturnValue("pdt");
  const { initializeCrossTabAuthSync } = await import("@/platform/auth/api/cross-tab-session");
  initializeCrossTabAuthSync();

  FakeBroadcastChannel.latest!.emit({ type: "signed-out", accountId: "admin" });
  FakeBroadcastChannel.latest!.emit({ type: "signed-out" }); // from a signed-out tab: no account, not ours
  expect(storage.clearStoredAuthSessions).not.toHaveBeenCalled();

  FakeBroadcastChannel.latest!.emit({ type: "signed-out", accountId: "pdt" });
  expect(storage.clearStoredAuthSessions).toHaveBeenCalledTimes(1);
});

test("a newer sign-in as someone else forgets this tab's session and reloads; the same account does nothing", async () => {
  storage.currentTabAccountId.mockReturnValue("teacher");
  const reload = vi.fn();
  vi.stubGlobal("location", { ...window.location, reload });
  window.sessionStorage.setItem("anything", "token");
  const { initializeCrossTabAuthSync } = await import("@/platform/auth/api/cross-tab-session");
  initializeCrossTabAuthSync();

  FakeBroadcastChannel.latest!.emit({ type: "session-changed", accountId: "teacher" });
  expect(logout).not.toHaveBeenCalled();
  // The local re-read must not go back out: a CustomEvent's detail is null, which used to be announced as a sign-out.
  expect(FakeBroadcastChannel.latest!.posted).toEqual([]);

  FakeBroadcastChannel.latest!.emit({ type: "session-changed", accountId: "student-1" });
  await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  expect(logout).not.toHaveBeenCalled();
  expect(window.sessionStorage.getItem("anything")).toBeNull();
  vi.unstubAllGlobals();
});

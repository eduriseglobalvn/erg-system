import { beforeEach, expect, test, vi } from "vitest";

const storage = vi.hoisted(() => ({
  readStoredAuthIdentity: vi.fn(),
  writeStoredAuthIdentity: vi.fn(),
}));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  AUTH_SESSION_STORAGE_CHANGED_EVENT: "erg-auth-session-storage-changed",
  clearStoredAuthSessions: vi.fn(),
  hasStoredAuthCredential: (session: { accessToken?: string } | null) => Boolean(session?.accessToken),
  readStoredAuthIdentity: storage.readStoredAuthIdentity,
  writeStoredAuthIdentity: storage.writeStoredAuthIdentity,
}));

class FakeBroadcastChannel {
  static latest: FakeBroadcastChannel | undefined;
  onmessage: ((event: MessageEvent) => void) | null = null;
  posted: unknown[] = [];

  constructor(public name: string) {
    FakeBroadcastChannel.latest = this;
  }

  postMessage(message: unknown) {
    this.posted.push(message);
  }

  close() {}

  emit(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

beforeEach(() => {
  vi.resetModules();
  storage.readStoredAuthIdentity.mockReset();
  storage.writeStoredAuthIdentity.mockReset();
  FakeBroadcastChannel.latest = undefined;
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

test("a new tab hydrates the existing tab session without another login", async () => {
  storage.readStoredAuthIdentity.mockReturnValue(null);
  const { hydrateSessionFromPeerTab } = await import("@/platform/auth/api/cross-tab-session");
  const hydration = hydrateSessionFromPeerTab("lms", 1_000);
  const request = FakeBroadcastChannel.latest!.posted[0] as { requestId: string };
  const session = { accountId: "user-1", accessToken: "shared-token", portal: "lms", rememberMe: true };

  FakeBroadcastChannel.latest!.emit({ type: "SESSION_RESPONSE", requestId: request.requestId, session });

  await expect(hydration).resolves.toBe(true);
  expect(storage.writeStoredAuthIdentity).toHaveBeenCalledWith(session);
});

test("an authenticated tab answers a peer session request", async () => {
  const session = { accountId: "user-1", accessToken: "shared-token", portal: "lms", rememberMe: true };
  storage.readStoredAuthIdentity.mockReturnValue(session);
  const { hydrateSessionFromPeerTab } = await import("@/platform/auth/api/cross-tab-session");
  await expect(hydrateSessionFromPeerTab("lms")).resolves.toBe(false);

  FakeBroadcastChannel.latest!.emit({ type: "SESSION_REQUEST", requestId: "request-1", portal: "lms" });

  expect(FakeBroadcastChannel.latest!.posted).toContainEqual({
    type: "SESSION_RESPONSE",
    requestId: "request-1",
    session,
  });
});

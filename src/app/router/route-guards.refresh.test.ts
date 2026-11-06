import { isRedirect } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn<() => Promise<string | null>>(),
  refreshSession: vi.fn(),
  account: vi.fn(),
}));

vi.mock("@/lib/api-client/refresh", () => ({ refreshStoredAuthSession: mocks.refresh }));
vi.mock("@/platform/auth/api/auth-token-storage", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  readStoredRefreshSession: mocks.refreshSession,
  resolveCurrentPortal: () => "lms",
}));
vi.mock("@/platform/auth/api/auth-storage", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getCurrentAccount: mocks.account,
  getAuthScope: () => ({ session: { permissions: ["lms.dashboard.read"], portals: ["lms"], workspaces: ["TEACHER"] } }),
}));

import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { authedBeforeLoad } from "./route-guards";

const expired = createAuthRouteState({ account: null, session: null, apiBacked: true });
const run = async (pathname: string) => {
  try {
    await authedBeforeLoad({ context: { auth: expired }, location: { href: pathname, pathname } });
    return "allow";
  } catch (error) {
    if (!isRedirect(error)) throw error;
    return (error as unknown as { options: { to?: string } }).options.to;
  }
};

describe("authedBeforeLoad with an expired access token", () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.refreshSession.mockReturnValue({ refreshToken: "r1" });
    mocks.account.mockReturnValue({ id: "u1", email: "u1@erg.edu.vn", lifecycle: { status: "ACTIVE", nextSteps: [] } });
  });

  it("refreshes and lets the user through instead of sending them to login", async () => {
    mocks.refresh.mockResolvedValue("new-access");
    expect(await run("/teacher/home")).toBe("allow");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("goes to login when the refresh token is rejected", async () => {
    mocks.refresh.mockResolvedValue(null);
    expect(await run("/teacher/home")).toBe("/login");
  });

  it("goes straight to login without a refresh token", async () => {
    mocks.refreshSession.mockReturnValue(null);
    expect(await run("/teacher/home")).toBe("/login");
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});

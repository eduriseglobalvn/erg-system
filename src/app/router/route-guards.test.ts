import { describe, expect, it } from "vitest";
import { isRedirect } from "@tanstack/react-router";

import { enforceWorkspaceRoute } from "./route-guards";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";

describe("workspace route guards", () => {
  it("denies an unregistered sensitive path even for a wildcard permission", () => {
    const auth = createAuthRouteState({
      account: { id: "root", email: "root@erg.edu.vn" } as never,
      session: { permissions: ["*"], portals: ["lcms"], workspaces: ["ADMIN"] },
      apiBacked: true,
    });

    try {
      enforceWorkspaceRoute(auth, { href: "https://lms.erg.edu.vn/admin/unknown-sensitive", pathname: "/admin/unknown-sensitive" }, "ADMIN");
      throw new Error("guard did not redirect");
    } catch (error) {
      expect(isRedirect(error)).toBe(true);
      expect((error as { options?: { to?: string } }).options?.to).toBe("/access-denied");
    }
  });
});

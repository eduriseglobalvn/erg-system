import { describe, expect, it, vi } from "vitest";
import { LEGACY_ALIAS_SUNSET_DATE, recordLegacyAliasHit, resolveLegacyRouteRedirect } from "@/app/router/legacy-route-redirects";

describe("legacy route redirects", () => {
  it("maps legacy public paths to canonical workspace paths", () => {
    expect(resolveLegacyRouteRedirect("admin")).toEqual({ target: "lms", path: "/admin" });
    expect(resolveLegacyRouteRedirect("admin/content/resources")).toEqual({ target: "lms", path: "/admin/content/resources" });
    expect(resolveLegacyRouteRedirect("dashboard")).toEqual({ target: "lms", path: "/teacher" });
    expect(resolveLegacyRouteRedirect("learner/course/42")).toEqual({ target: "lms", path: "/student/course/42" });
    expect(resolveLegacyRouteRedirect("kho-hoc-lieu/foo")).toEqual({ target: "lms", path: "/teacher/resources" });
  });

  it("does not redirect unknown paths", () => {
    expect(resolveLegacyRouteRedirect("settings")).toEqual({ target: "lms", path: "/admin/settings" });
  });

  it("keeps alias telemetry payload free of credentials", () => {
    const redirect = resolveLegacyRouteRedirect("dashboard");
    expect(redirect).toEqual({ target: "lms", path: "/teacher" });
    expect(JSON.stringify({ path: "dashboard", ...redirect })).not.toContain("token");
  });

  it("publishes a dated migration sunset with alias telemetry", () => {
    const listener = vi.fn();
    window.addEventListener("erg-legacy-route-alias-hit", listener);
    recordLegacyAliasHit("dashboard", { target: "lms", path: "/teacher" });
    window.removeEventListener("erg-legacy-route-alias-hit", listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].detail).toMatchObject({ sunsetDate: LEGACY_ALIAS_SUNSET_DATE });
  });
});

import { describe, expect, it } from "vitest";

import { createAuthRouteState, resolveAuthRouteAccess } from "@/platform/auth/router/auth-route-context";
import { routePermissionForPath } from "./route-permission-matrix";

const stateWith = (permissions: string[]) => createAuthRouteState({
  account: { id: "u", email: "u@erg.edu.vn" } as never,
  session: { permissions, portals: ["lcms"], workspaces: ["ADMIN"] },
  apiBacked: true,
});

describe("lich giang day: ma tran quyen cho cac route moi", () => {
  it.each([
    ["/admin/calendar", "lms.schedule.read"],
    ["/admin/calendar/schedule", "lms.schedule.create"],
    ["/admin/calendar/overview", "lms.schedule.read"],
    ["/admin/calendar/settings/travel", "lms.schedule.manage"],
    ["/admin/calendar/days-off", "timekeeping.manage"],
  ])("%s yeu cau %s", (path, permission) => {
    expect(routePermissionForPath(path, "ADMIN")?.permission).toBe(permission);
  });

  it.each([
    ["/admin/calendar/overview", ["lms.schedule.read"], "allow"],
    ["/admin/calendar/overview", ["lms.dashboard.read"], "access-denied"],
    ["/admin/calendar/settings/travel", ["lms.schedule.manage"], "allow"],
    ["/admin/calendar/settings/travel", ["lms.schedule.read"], "access-denied"],
    ["/admin/calendar/schedule", ["lms.schedule.create"], "allow"],
    ["/admin/calendar/schedule", ["lms.schedule.read"], "access-denied"],
    ["/admin/calendar/days-off", ["timekeeping.manage"], "allow"],
    ["/admin/calendar/days-off", ["lms.schedule.manage", "lms.schedule.read"], "access-denied"],
  ] as const)("%s voi quyen %j -> %s", (path, permissions, expected) => {
    const entry = routePermissionForPath(path, "ADMIN");
    expect(entry).toBeDefined();
    expect(resolveAuthRouteAccess(stateWith([...permissions]), { workspace: "ADMIN", permission: entry!.permission })).toBe(expected);
  });

  it("nguoi dung khong co quyen lich bi chan o ca bon route", () => {
    const nobody = stateWith(["lms.dashboard.read"]);
    for (const path of ["/admin/calendar", "/admin/calendar/schedule", "/admin/calendar/overview", "/admin/calendar/settings/travel"]) {
      const entry = routePermissionForPath(path, "ADMIN")!;
      expect(resolveAuthRouteAccess(nobody, { workspace: "ADMIN", permission: entry.permission })).toBe("access-denied");
    }
  });
});

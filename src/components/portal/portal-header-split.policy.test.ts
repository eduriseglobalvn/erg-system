import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const portalRoot = path.resolve(process.cwd(), "src/components/portal");
const source = (name: string) => fs.readFileSync(path.join(portalRoot, name), "utf8");

describe("portal header ownership", () => {
  test("keeps the header shell below the AGENTS limit", () => {
    const header = source("ErgPortalHeader.tsx");

    expect(header.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(header).toContain('from "./portal-header-identity"');
    expect(header).toContain('from "./portal-header-actions"');
    expect(header).toContain('from "./portal-header-notifications"');
    expect(header).not.toContain("interface Notification");
    expect(header).not.toContain("function NotificationItem");
  });

  test("keeps header sub-owners cohesive and bounded", () => {
    for (const name of [
      "portal-header-identity.tsx",
      "portal-header-actions.tsx",
      "portal-header-notifications.tsx",
      "portal-header-notification-item.tsx",
    ]) {
      expect(source(name).split(/\r?\n/).length, name).toBeLessThanOrEqual(220);
    }

    expect(source("portal-header-notification-data.ts")).toContain("PORTAL_NOTIFICATIONS");
  });
});

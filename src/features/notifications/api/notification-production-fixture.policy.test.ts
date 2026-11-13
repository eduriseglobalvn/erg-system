import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "vitest";

test("allows notification fixtures only through the explicit dev runtime gate", () => {
  for (const fileName of ["notification-feed-api.ts", "notification-device-api.ts", "admin-notification-api.ts"]) {
    const source = readFileSync(resolve(process.cwd(), "src/features/notifications/api", fileName), "utf8");
    expect(source, `${fileName} still treats missing API base as fixture permission`).not.toContain("if (!hasApiBase())");
    expect(source, `${fileName} does not use the explicit fixture gate`).toContain("runtimeFixturesEnabled()");
  }
});

test("loads notification mock stores only through a dynamic import, so production bundles drop them", () => {
  for (const fileName of ["notification-api.ts", "notification-feed-api.ts", "notification-device-api.ts"]) {
    const source = readFileSync(resolve(process.cwd(), "src/features/notifications/api", fileName), "utf8");
    expect(source, `${fileName} statically imports a mock store`).not.toContain('from "./notification-mock-');
  }
});

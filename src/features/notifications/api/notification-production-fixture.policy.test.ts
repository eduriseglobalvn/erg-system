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

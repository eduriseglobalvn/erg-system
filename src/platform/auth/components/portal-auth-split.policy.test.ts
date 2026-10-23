import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const componentRoot = path.resolve(process.cwd(), "src/platform/auth/components");
const source = (name: string) => fs.readFileSync(path.join(componentRoot, name), "utf8");

describe("portal auth component ownership", () => {
  test("keeps route gates small and moves login orchestration to its own owner", () => {
    const gates = source("portal-route-gates.tsx");
    const loginPage = source("portal-login-page.tsx");

    expect(gates.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(gates).not.toContain("function handleLoginSubmit");
    expect(gates).not.toContain("function getPortalLoginCopy");
    expect(loginPage).toContain("export function PortalLoginPage");
    expect(loginPage).not.toContain('from "@/platform/auth/components/portal-auth-gates"');
  });

  test("routes import the login page directly instead of through the gate owner", () => {
    const routes = fs.readFileSync(path.resolve(process.cwd(), "src/routes/app-routes.tsx"), "utf8");

    expect(routes).toContain('from "@/platform/auth/components/portal-login-page"');
  });
});

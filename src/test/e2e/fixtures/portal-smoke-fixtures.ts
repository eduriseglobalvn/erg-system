import { expect, type Page } from "@playwright/test";

import type { PortalSmokeNetworkState } from "./portal-smoke-network";

export type SmokePortal = "lms" | "lcms" | "crm" | "elearning";

export type PortalSmokeDefinition = {
  failurePath: string;
  interaction?: { label: string; openerLabel?: string; path: string };
  mainPath: string;
  portal: SmokePortal;
};

const DEV_COLD_START_TIMEOUT_MS = 20_000;

export const portalSmokeDefinitions: Record<SmokePortal, PortalSmokeDefinition> = {
  lms: { portal: "lms", mainPath: "/teacher/home", failurePath: "/teacher/home", interaction: { label: "Danh sách hoạt động", path: "/teacher/homework" } },
  lcms: { portal: "lcms", mainPath: "/admin", failurePath: "/admin/schools", interaction: { label: "Danh sách trường", openerLabel: "Quản lý trường học", path: "/admin/schools/list" } },
  crm: { portal: "crm", mainPath: "/seo", failurePath: "/seo", interaction: { label: "Trường đã tư vấn", path: "/seo/schools" } },
  elearning: { portal: "elearning", mainPath: "/", failurePath: "/" },
};

export async function assertGuestRedirect(page: Page, definition: PortalSmokeDefinition) {
  await page.goto(definition.mainPath);
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator("body")).not.toBeEmpty();
}

export async function seedAuthenticatedPortal(page: Page, portal: SmokePortal) {
  await page.addInitScript((targetPortal) => {
    const accountId = `${targetPortal}-smoke-user`;
    const account = {
      id: accountId,
      fullName: `${targetPortal.toUpperCase()} Smoke User`,
      email: `${accountId}@example.test`,
      role: targetPortal === "elearning" ? "teacher" : "admin",
      provider: "password",
      department: "ERG QA",
      title: "Smoke Tester",
      features: [],
      lifecycle: {
        status: "ACTIVE",
        isProfileCompleted: true,
        recoveryEmailMasked: null,
        recoveryEmailVerified: true,
        mustChangePassword: false,
        nextSteps: [],
      },
      isProfileCompleted: true,
      status: "ACTIVE",
      createdAt: "2026-07-28T00:00:00.000Z",
      lastLoginAt: "2026-07-28T00:00:00.000Z",
    };
    const session = {
      accountId,
      accessToken: "smoke.header.signature",
      loggedInAt: new Date().toISOString(),
      tenantId: "tenant-smoke",
      permissions: ["*"],
      deniedPermissions: [],
      roles: ["system.super_admin"],
      portal: targetPortal,
      portals: ["*"],
      workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
      rememberMe: false,
    };

    localStorage.setItem("erg-learning.accounts", JSON.stringify([account]));
    const sessionKey = targetPortal === "elearning"
      ? "erg-learning.student-session.temp"
      : `erg-learning.session.temp.${targetPortal}`;
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
  }, portal);
}

export async function assertMainRoute(
  page: Page,
  definition: PortalSmokeDefinition,
  network: PortalSmokeNetworkState,
) {
  await page.goto(definition.mainPath);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page.locator("#root:not(:empty)")).toBeVisible({ timeout: DEV_COLD_START_TIMEOUT_MS });
  await expect
    .poll(async () => (await page.locator("body").innerText()).trim().length, { timeout: DEV_COLD_START_TIMEOUT_MS })
    .toBeGreaterThan(40);
  await expect(page.locator("vite-error-overlay, [data-nextjs-dialog-overlay]")).toHaveCount(0);
  expect(network.pageErrors).toEqual([]);

  if (definition.interaction) {
    if (definition.interaction.openerLabel) {
      const opener = page.getByRole("button", { name: definition.interaction.openerLabel, exact: true }).first();
      await expect(opener).toBeVisible();
      await opener.click();
    }
    const target = page.getByRole("button", { name: definition.interaction.label, exact: true }).first();
    await expect(target).toBeVisible();
    await target.click();
    await expect(page).toHaveURL(new RegExp(`${definition.interaction.path.replaceAll("/", "\\/")}(?:[/?#]|$)`));
  } else {
    const target = page.getByRole("button").first();
    await expect(target).toBeVisible();
    await target.click();
    await expect(page.locator("body")).toBeVisible();
  }
}

export async function assertApiFailureBoundary(
  page: Page,
  definition: PortalSmokeDefinition,
  network: PortalSmokeNetworkState,
) {
  network.failApi = true;
  const separator = definition.failurePath.includes("?") ? "&" : "?";
  await page.goto(`${definition.failurePath}${separator}smokeFailure=1`);
  await expect(page.locator("#root:not(:empty)")).toBeVisible({ timeout: DEV_COLD_START_TIMEOUT_MS });
  await expect
    .poll(async () => (await page.locator("body").innerText()).trim().length, { timeout: DEV_COLD_START_TIMEOUT_MS })
    .toBeGreaterThan(20);
  await expect(page.locator("vite-error-overlay, [data-nextjs-dialog-overlay]")).toHaveCount(0);
  expect(network.pageErrors).toEqual([]);
  if (definition.portal !== "crm") {
    await expect.poll(() => network.failedRequests).toBeGreaterThan(0);
  }
}

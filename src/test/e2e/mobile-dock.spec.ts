import { expect, test } from "@playwright/test";

import { portalHost, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("teacher phone dock: expected items, no header bell, no horizontal overflow", async ({ page }) => {
  await setupPortalNetwork(page, "lms");
  await seedAuthenticatedPortal(page, "lms");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/teacher", { waitUntil: "domcontentloaded", timeout: 20_000 });

  const dock = page.getByRole("navigation", { name: "Điều hướng giáo viên" });
  // The dev server compiles the teacher chunk on first hit.
  await expect(dock).toBeVisible({ timeout: 30_000 });
  // Chấm công joins the dock only once the attendance feature lands; today the dock has 5 items.
  for (const label of ["Hôm nay", "Lịch", "Học tập", "Hộp thư", "Tài khoản"]) {
    await expect(dock.getByRole("button", { name: new RegExp(`^${label}`) })).toBeVisible();
  }
  await expect(dock.getByRole("button")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Thông báo", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

// Admin runs under ErgPortalLayout; its dock carries Hộp thư, so the header bell is gone on phones.
test.describe("admin phone dock", () => {
  test.use({ baseURL: portalHost("lcms") });

  test("shows the dock with Hộp thư, no header bell, no horizontal overflow", async ({ page }) => {
    await setupPortalNetwork(page, "lcms");
    await seedAuthenticatedPortal(page, "lcms");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/admin", { waitUntil: "domcontentloaded", timeout: 20_000 });

    const dock = page.getByRole("navigation", { name: "Điều hướng admin" });
    await expect(dock).toBeVisible({ timeout: 30_000 });
    await expect(dock.getByRole("button", { name: /^Tất cả/ })).toBeVisible();
    await expect(dock.getByRole("button", { name: /^Hộp thư/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thông báo", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

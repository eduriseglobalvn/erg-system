import { expect, test } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("keeps Admin resources and course structure as separate workspaces", async ({ page }) => {
  test.setTimeout(120_000);
  const contentReadyTimeout = 15_000;
  await setupPortalNetwork(page, "lms");
  await seedAuthenticatedPortal(page, "lms");

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);

    await page.goto("/admin/content/structure", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/content\/structure(?:[/?#]|$)/);
    if (viewport.width >= 1280) {
      await expect(page.getByText("Cấu trúc môn học", { exact: true }).first()).toBeVisible({ timeout: contentReadyTimeout });
      await expect(page.getByLabel("Tìm trong cấu trúc môn học", { exact: true })).toBeVisible({ timeout: contentReadyTimeout });
      await expect(page.getByLabel("Tìm trong tài nguyên", { exact: true })).toHaveCount(0);
    } else {
      await expect(page.getByRole("button", { name: "Danh sách môn học", exact: true })).toBeVisible({ timeout: contentReadyTimeout });
    }

    await page.goto("/admin/content/resources", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/admin\/content\/resources(?:[/?#]|$)/);
    if (viewport.width >= 1280) {
      await expect(page.getByLabel("Tìm trong tài nguyên", { exact: true })).toBeVisible({ timeout: contentReadyTimeout });
      await expect(page.getByLabel("Tìm trong cấu trúc môn học", { exact: true })).toHaveCount(0);
    } else {
      await expect(page.getByPlaceholder("Tìm học liệu", { exact: true })).toBeVisible({ timeout: contentReadyTimeout });
    }

    await page.goto("/teacher/resources", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/teacher\/resources(?:[/?#]|$)/);
    if (viewport.width >= 1280) {
      await expect(page.getByLabel("Tìm trong tài nguyên", { exact: true })).toBeVisible({ timeout: contentReadyTimeout });
    } else {
      await expect(page.getByPlaceholder("Tìm học liệu", { exact: true })).toBeVisible({ timeout: contentReadyTimeout });
    }

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth, `horizontal overflow at ${viewport.width}px`).toBeLessThanOrEqual(metrics.clientWidth + 2);
  }
});

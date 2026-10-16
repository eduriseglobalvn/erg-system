import { expect, test } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test.describe("Teacher PWA calendar and Home dock", () => {
  test.beforeEach(async ({ page }) => {
    await setupPortalNetwork(page, "lms");
    await seedAuthenticatedPortal(page, "lms");
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("keeps action buttons visible and returns Home to the teacher workspace", async ({ page }) => {
    await page.goto("/teacher/homework/exercise-bank", { waitUntil: "domcontentloaded", timeout: 20_000 });

    const quickAssign = page.getByRole("button", { name: "Giao nhanh", exact: true }).first();
    await expect(quickAssign).toBeVisible();
    const quickAssignStyles = await quickAssign.evaluate((element) => {
      const styles = getComputedStyle(element);
      return { backgroundColor: styles.backgroundColor, color: styles.color };
    });
    expect(quickAssignStyles.backgroundColor).toBe("rgb(15, 108, 189)");
    expect(quickAssignStyles.color).not.toBe(quickAssignStyles.backgroundColor);

    await page.goto("/teacher/calendar", { waitUntil: "domcontentloaded", timeout: 20_000 });
    const home = page.getByRole("button", { name: "Home", exact: true });
    await expect(home).not.toHaveAttribute("aria-current", "page");
    await home.click();
    await expect(page).toHaveURL(/\/teacher(?:[/?#]|$)/);
  });

  test("opens the mobile calendar in an agenda-first view without horizontal overflow", async ({ page }) => {
    await page.goto("/teacher/calendar", { waitUntil: "domcontentloaded", timeout: 20_000 });

    const calendar = page.getByTestId("erg-calendar-workspace");
    await expect(calendar).toBeVisible();
    await expect(calendar).toHaveAttribute("data-calendar-mode", "schedule");

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
  });
});

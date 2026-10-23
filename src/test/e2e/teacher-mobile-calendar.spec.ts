import { expect, test } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

const viewports = [
  { width: 320, height: 760 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
];

test.describe("Teacher mobile calendar", () => {
  for (const viewport of viewports) {
    test(`month disclosure and scope filters work at ${viewport.width}px`, async ({ page }) => {
      const network = await setupPortalNetwork(page, "lms");
      await seedAuthenticatedPortal(page, "lms");
      await page.setViewportSize(viewport);
      await page.goto("/teacher/calendar", { waitUntil: "domcontentloaded", timeout: 20_000 });

      const calendar = page.getByTestId("erg-calendar-workspace");
      await expect(calendar).toBeVisible();
      await expect(calendar).toHaveAttribute("data-calendar-mode", "schedule");
      await expect(page.getByTestId("erg-mobile-mini-calendar")).toHaveCount(0);
      await expect(page.getByText("IC3 GS6 · Máy tính căn bản", { exact: true })).toBeVisible();

      const monthDisclosure = page.getByRole("button", { name: /Mở lịch tháng/i });
      await expect(monthDisclosure).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await monthDisclosure.click();
      await expect(page.getByTestId("erg-mobile-mini-calendar")).toBeVisible();
      await page.getByRole("button", { name: /Đóng lịch tháng/i }).click();
      await expect(page.getByTestId("erg-mobile-mini-calendar")).toHaveCount(0);

      await page.getByRole("button", { name: "Lịch theo trường", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Chọn trường" })).toBeVisible();
      await page.getByRole("option", { name: /Trường Alpha/ }).click();
      await expect(page.getByRole("button", { name: "Lịch theo trường: Trường Alpha" })).toHaveAttribute("aria-pressed", "true");

      await page.getByRole("button", { name: "Lịch theo môn", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Chọn môn" })).toBeVisible();
      await page.getByRole("option", { name: /^Tin học(?:\s+\d+ lịch)?$/ }).click();
      await expect(page.getByRole("button", { name: "Lịch theo môn: Tin học" })).toHaveAttribute("aria-pressed", "true");

      await page.getByRole("button", { name: "3 ngày", exact: true }).click();
      await expect(calendar).toHaveAttribute("data-calendar-mode", "three-day");
      const timeGrid = page.getByTestId("erg-calendar-time-grid");
      const initialTimeGridMetrics = await timeGrid.evaluate((element) => ({
        clientHeight: element.clientHeight,
        overflowY: getComputedStyle(element).overflowY,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      }));
      expect(initialTimeGridMetrics.clientHeight, JSON.stringify(initialTimeGridMetrics)).toBeGreaterThan(240);
      await expect.poll(
        () => timeGrid.evaluate((element) => element.scrollTop),
        { message: `Expected mobile workday auto-scroll: ${JSON.stringify(initialTimeGridMetrics)}` },
      ).toBeGreaterThan(250);

      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 2);
      expect(network.pageErrors).toEqual([]);
    });
  }
});

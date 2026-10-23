import { expect, test } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("Admin and Teacher workspaces keep canonical URLs and fit desktop/mobile viewports", async ({ page }) => {
  test.setTimeout(300_000);
  await setupPortalNetwork(page, "lms");
  await seedAuthenticatedPortal(page, "lms");

  const teacherRoutes = [
    "/teacher/home",
    "/teacher/homework",
    "/teacher/homework/assign",
    "/teacher/homework/exercise-bank",
    "/teacher/homework/progress",
    "/teacher/homework/student-groups",
    "/teacher/homework/class",
    "/teacher/notifications",
    "/teacher/account",
    "/teacher/account/login-logs",
    "/teacher/score",
    "/teacher/attendance",
    "/teacher/calendar",
    "/teacher/class-log",
    "/teacher/resources",
    "/teacher/reports",
  ];
  const adminRoutes = [
    "/admin",
    "/admin/schools/list",
    "/admin/content/resources",
    "/admin/content/quiz-bank",
    "/admin/settings/roles",
  ];

  for (const viewport of [
    { name: "phone-small", width: 320, height: 800 },
    { name: "phone", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "tablet-wide", width: 1024, height: 900 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const route of teacherRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}(?:[/?#]|$)`));
      await expect(page.locator("#root:not(:empty)")).toBeVisible();
      const teacherMetrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(teacherMetrics.scrollWidth, `${viewport.name} overflow on ${route}`).toBeLessThanOrEqual(teacherMetrics.clientWidth + 2);
    }

    const mobileDock = page.locator('nav[aria-label="Điều hướng LMS mobile"]');
    if (viewport.width < 1280) await expect(mobileDock).toBeVisible();
    else await expect(mobileDock).toBeHidden();

    for (const route of adminRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await expect(page).toHaveURL(new RegExp(`${route.replaceAll("/", "\\/")}(?:[/?#]|$)`));
      await expect(page.locator("#root:not(:empty)")).toBeVisible();
      const adminMetrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(adminMetrics.scrollWidth, `${viewport.name} overflow on ${route}`).toBeLessThanOrEqual(adminMetrics.clientWidth + 2);
    }

    const adminMenuButton = page.getByRole("button", { name: "Mở menu", exact: true });
    if (viewport.width < 1280) await expect(adminMenuButton).toBeVisible();
    else await expect(adminMenuButton).toBeHidden();
  }
});

test("Teacher mobile dock keeps selected state and leaves the assignment action bar visible", async ({ page }) => {
  test.setTimeout(120_000);
  await setupPortalNetwork(page, "lms");
  await seedAuthenticatedPortal(page, "lms");
  await page.setViewportSize({ width: 375, height: 812 });

  const cases = [
    { route: "/teacher/homework/assign", label: "Giao bài" },
    { route: "/teacher/homework/exercise-bank", label: "Kho bài" },
    { route: "/teacher/calendar", label: "Lịch" },
    { route: "/teacher/notifications", label: "Thông báo" },
  ];

  const dock = page.locator('nav[aria-label="Điều hướng LMS mobile"]');
  for (const item of cases) {
    await page.goto(item.route, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await expect(dock).toBeVisible();
    await expect(dock.getByRole("button", { name: item.label, exact: true })).toHaveAttribute("aria-current", "page");
  }

  await page.goto("/teacher/homework/assign", { waitUntil: "domcontentloaded", timeout: 20_000 });
  const nextButton = page.getByRole("button", { name: "Tiếp theo", exact: true });
  await expect(nextButton).toBeVisible();
  const actionBox = await nextButton.boundingBox();
  const dockBox = await dock.boundingBox();
  expect(actionBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect((actionBox?.y ?? 0) + (actionBox?.height ?? 0)).toBeLessThanOrEqual((dockBox?.y ?? 0) - 4);
});

test("Teacher assignment mobile keeps the shell header visible while scrolling and cancels to homework", async ({ page }) => {
  test.setTimeout(120_000);
  await setupPortalNetwork(page, "lms");
  await seedAuthenticatedPortal(page, "lms");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/teacher/homework/assign", { waitUntil: "domcontentloaded", timeout: 20_000 });

  const header = page.getByTestId("lms-mobile-header");
  const scrollRegion = page.getByTestId("lms-mobile-scroll-region");
  await expect(header).toBeVisible();
  await expect(scrollRegion).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiếp theo", exact: true })).toBeVisible();

  const metrics = await scrollRegion.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);

  await scrollRegion.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(header).toBeVisible();
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(headerBox?.y ?? -1).toBeGreaterThanOrEqual(0);

  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page).toHaveURL(/\/teacher\/homework(?:[/?#]|$)/);
});

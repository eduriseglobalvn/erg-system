import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Giao vien nhan thong bao lich moi (6.10 / 6.17): push toi thi banner «N tiết mới» hien ma khong can tai lai trang.
const NOTICE = {
  createdAt: "2026-11-09T01:00:00Z", eventType: "SCHEDULE_PUBLISHED", id: "n1", status: "unread", title: "Lịch dạy mới",
  data: { batchId: "b1", classes: JSON.stringify([{ name: "9A2" }]), fromDate: "2026-11-09", newPeriods: 4, periodRange: "6-9", role: "MAIN", schoolName: "THCS Trương Công Định", weekdays: JSON.stringify([3]) },
};
const page0 = (items: unknown[]) => ({ hasNext: false, hasPrevious: false, items, page: 0, size: 20, totalItems: items.length, totalPages: items.length ? 1 : 0 });

async function mockFeed(page: Page) {
  const feed = { items: [] as unknown[] };
  await page.route(`**${API_ENDPOINTS.notifications.list}?*`, (route) => route.fulfill({ json: page0(feed.items) }));
  return feed;
}

for (const viewport of [{ height: 900, width: 1440 }, { height: 812, width: 375 }]) {
  test(`teacher at ${viewport.width}px sees «N tiết mới» after a schedule notification`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const network = await setupPortalNetwork(page, "lms");
    const feed = await mockFeed(page);
    await seedAuthenticatedPortal(page, "lms");
    // Khoa thong bao dung tenant mac dinh; phien smoke dung tenant rieng nen phai khop thi push moi lam moi dung feed (nhu admin-teaching-schedule).
    await page.addInitScript(() => {
      const key = "erg-learning.session.temp.lms";
      const raw = sessionStorage.getItem(key);
      if (raw) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(raw), tenantId: "erg" }));
    });
    await page.goto("/teacher/calendar", { timeout: 20_000, waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /^Lịch dạy/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/\d+ tiết mới/)).toHaveCount(0);

    // Push toi (service worker -> trang): moi loai thong bao lich deu phai lam moi feed.
    feed.items = [NOTICE];
    await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new MessageEvent("message", { data: { payload: { eventType: "SCHEDULE_CHANGED", portal: "lms" }, type: "erg:notification-push" } })));
    await expect(page.getByText(/4 tiết mới/).first()).toBeVisible({ timeout: 15_000 });
    expect(network.pageErrors).toEqual([]);
  });
}

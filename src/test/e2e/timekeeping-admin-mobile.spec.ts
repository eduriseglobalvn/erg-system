import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Admin A05 on a 375x667 phone (see the "timekeeping-admin-mobile" project).
const endpoints = API_ENDPOINTS.timekeeping;

const today = {
  present: 112, total: 130, late: 9, notPunched: 8, leave: 6, pendingRequests: 1, overdueRequests: 0,
  actionItems: [{ kind: "PUNCH_REVIEW", targetId: "p1", userId: "u1", userName: "Lê Thị B", label: "Chấm ngoài vùng 180 m" }],
  recentPunches: [],
};
const approvals = {
  total: 1,
  items: [{ overdue: false, requesterName: "Nguyễn A", request: { id: "r1", code: "DT-2026-0001", type: "WFH", status: "PENDING", fromDate: "2026-11-12", toDate: "2026-11-12" } }],
};

async function mockAdmin(page: Page) {
  await setupPortalNetwork(page, "lcms");
  // Registered after the generic mock, so these routes win.
  await page.route(`**${endpoints.admin.today}*`, (route) => route.fulfill({ json: today }));
  await page.route(`**${endpoints.approvals.root}*`, (route) => route.fulfill({ json: approvals }));
  await page.route(`**${endpoints.approvals.approve("r1")}`, (route) => route.fulfill({ json: {} }));
}

test("admin phone: counts and tabs fit 375px, Duyệt approves the request", async ({ page }) => {
  await mockAdmin(page);
  await seedAuthenticatedPortal(page, "lcms");
  await page.goto("/admin/employees/timekeeping", { waitUntil: "domcontentloaded", timeout: 20_000 });

  await expect(page.getByRole("heading", { name: /^Chấm công · / })).toBeVisible({ timeout: 30_000 });
  for (const name of ["Chờ duyệt (1)", "Chưa chấm (8)", "Ngoài vùng (1)"]) await expect(page.getByRole("tab", { name })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  await page.getByRole("tab", { name: "Ngoài vùng (1)" }).click();
  await expect(page.getByRole("button", { name: "Duyệt lượt chấm của Lê Thị B" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);

  await page.getByRole("tab", { name: "Chờ duyệt (1)" }).click();
  const approve = page.waitForRequest((request) => request.url().endsWith(endpoints.approvals.approve("r1")) && request.method() === "POST");
  await page.getByRole("button", { name: "Duyệt đơn DT-2026-0001" }).click();
  await approve;
});

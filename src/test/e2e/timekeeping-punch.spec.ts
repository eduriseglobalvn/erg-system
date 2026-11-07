import { expect, test, type Page } from "@playwright/test";

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

// Teacher G01 -> G02 -> G03 on a 375x667 phone with a fake camera and GPS (see the "timekeeping-punch" project).
const endpoints = API_ENDPOINTS.timekeeping.me;

const today = {
  allowOutside: false,
  date: "2026-11-06",
  faceConsented: true,
  maxAccuracyM: 100,
  periodLocked: false,
  periods: [{}, {}, {}],
  remote: false,
  requireFace: true,
  serverTime: new Date().toISOString(),
  shift: { id: "shift-1", name: "Ca sáng", start: "00:00:00", end: "23:59:00", workUnits: 1 },
  sites: [{ id: "site-1", name: "Cơ sở Cầu Giấy", lat: 21.0285, lng: 105.8542, radiusM: 150 }],
};

async function mockTimekeeping(page: Page) {
  await setupPortalNetwork(page, "lms");
  // Registered after the generic mock, so these routes win.
  await page.route(`**${endpoints.clock}`, (route) => route.fulfill({ json: { serverTime: new Date().toISOString() } }));
  await page.route(`**${endpoints.today}`, (route) => route.fulfill({ json: today }));
  await page.route(`**${endpoints.month}*`, (route) =>
    route.fulfill({ json: { actualUnits: 4, standardUnits: 22, lateCount: 0, lateMinutes: 0, annualLeaveRemaining: 12, pendingRequests: 0, days: [] } }),
  );
  await page.route(`**${endpoints.punches}`, (route) =>
    route.fulfill({
      json: {
        alreadyPunched: false,
        minutesVsShift: 0,
        punch: { code: "CC-0001", direction: "IN", distanceM: 4, method: "GPS_FACE", remote: false, serverTime: new Date().toISOString(), siteName: "Cơ sở Cầu Giấy", status: "VALID" },
        verdict: "VALID",
      },
    }),
  );
}

test("teacher punches in with GPS and a selfie, then sees the confirmation", async ({ page }) => {
  await mockTimekeeping(page);
  await seedAuthenticatedPortal(page, "lms");
  await page.goto("/teacher/timekeeping", { waitUntil: "domcontentloaded", timeout: 20_000 });

  await expect(page.getByText("Trong vùng Cơ sở Cầu Giấy")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Chấm vào" }).click();

  await expect(page).toHaveURL(/\/teacher\/timekeeping\/punch$/);
  const punch = page.getByRole("button", { name: "Chụp & chấm vào" });
  await expect(punch).toBeEnabled({ timeout: 15_000 });
  await punch.click();

  await expect(page.getByText(/Đã chấm vào lúc/)).toBeVisible();
  // The outcome stays out of the URL.
  expect(page.url()).not.toContain("CC-0001");
  await page.getByRole("button", { name: "Xong" }).click();
  await expect(page).toHaveURL(/\/teacher\/timekeeping$/);
});

/// <reference types="node" />
import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";
import { DESIGN_NOW, graphQlFixtures } from "./fixtures/student-design-fixtures";

// Baselines: docs/design/student-portal/baseline-by-id/<ArtboardId>.png (2x). Spec: docs/superpowers/specs/2026-11-12-student-portal-gamification-design.md section 9.
// Viewport = artboard size: width fixed per device, height = baseline PNG height / 2 (read from the IHDR chunk).
function artboard(id: string, width: number) {
  const png = readFileSync(`docs/design/student-portal/baseline-by-id/${id}.png`);
  return { width, height: Math.round(png.readUInt32BE(20) / 2) };
}
const web = (id: string) => artboard(id, 1440);
const mobile = (id: string) => artboard(id, 390);
const FREEZE_CSS = "*{transition:none!important;animation:none!important;caret-color:transparent!important}";

test.use({ contextOptions: { reducedMotion: "reduce" } });

async function openStudent(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await setupPortalNetwork(page, "elearning");
  // Registered after the smoke network, so it wins; unknown operations fall through to it.
  await page.route(/\/graphql/, async (route) => {
    const op = (route.request().postDataJSON() as { operationName?: string } | null)?.operationName ?? "";
    const data = graphQlFixtures[op];
    if (!data) return route.fallback();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
  });
  await seedAuthenticatedPortal(page, "elearning");
  await page.addInitScript(() => {
    const raw = localStorage.getItem("erg-learning.accounts");
    if (raw) localStorage.setItem("erg-learning.accounts", JSON.stringify((JSON.parse(raw) as object[]).map((a) => ({ ...a, role: "student", fullName: "Nguyễn Minh Anh" }))));
    const key = "erg-learning.student-session.temp";
    const session = sessionStorage.getItem(key);
    if (session) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(session), tenantId: "erg", roles: ["student"], workspaces: ["STUDENT"], portals: ["elearning"] }));
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Thi đua" }).first()).toBeVisible({ timeout: 30_000 });
  // Frozen only after load: setFixedTime before navigation stalls the app boot (route bar never clears).
  await page.clock.setFixedTime(new Date(DESIGN_NOW));
}

async function settle(page: Page) {
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

async function compare(page: Page, id: string) {
  await settle(page);
  // Baseline path comes from snapshotPathTemplate in the student-design project.
  await expect(page).toHaveScreenshot(`${id}.png`, {
    maxDiffPixelRatio: 0.02, threshold: 0.15, animations: "disabled", fullPage: false, scale: "device",
    mask: [page.locator("svg[data-testid$='Icon']")],
  });
}

const openRanking = async (page: Page) => {
  await page.getByRole("button", { name: "Thi đua" }).first().click();
  await expect(page.getByRole("button", { name: "Xem cả lớp" })).toBeVisible();
};

test("H08 Thi dua (web)", async ({ page }) => {
  await openStudent(page, web("H08"));
  await openRanking(page);
  await compare(page, "H08");
});

test("H14 Ca lop (web)", async ({ page }) => {
  await openStudent(page, web("H14"));
  await openRanking(page);
  await page.getByRole("button", { name: "Xem cả lớp" }).click();
  await compare(page, "H14");
});

test("H18 Bang bac (web)", async ({ page }) => {
  await openStudent(page, web("H18"));
  await openRanking(page);
  await page.getByRole("button", { name: "Bảng bậc & cấp" }).click();
  await compare(page, "H18");
});

// H15 and H17 need the tier page: reached through the sidebar tier chip (onTierOpen), then the frames button.
test("H15 Bac (web)", async ({ page }) => {
  await openStudent(page, web("H15"));
  await page.getByRole("button", { name: "Mở hồ sơ" }).click();
  await compare(page, "H15");
});

test("H17 Khung (web)", async ({ page }) => {
  await openStudent(page, web("H17"));
  await page.getByRole("button", { name: "Mở hồ sơ" }).click();
  await page.getByRole("button", { name: "Đổi khung" }).click();
  await compare(page, "H17");
});

test("H03b Thi dua (mobile)", async ({ browser }) => {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, deviceScaleFactor: 2, viewport: mobile("H03b"), ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await openStudent(page, mobile("H03b"));
  await compare(page, "H03b");
  await context.close();
});

// Not driven yet. Each reason is what is missing, not a guess.
const FIXME: Record<string, string> = {
  H02b: "Da nop: needs assignments-submitted fixture (scores, 4 KPI) and tab nav; no fixture yet",
  H02c: "Can lam: needs open-assignment fixture with in-progress attempt",
  H02d: "Qua han: needs overdue-assignment fixture",
  H09: "Da nop web: same fixture as H02b",
  H10: "Can lam web: same fixture as H02c",
  H11: "Qua han web: same fixture as H02d",
  H12: "Hop thu web: needs inbox/announcement + question-thread fixtures and DESIGN text",
  H12m: "Hop thu chat mobile: same as H12",
  H13: "Thao luan web: needs discussion thread fixtures",
  H13m: "Thao luan mobile: same as H13",
  H13m2: "Thao luan chu de mobile: same as H13",
  H14m: "Ca lop mobile: H14 flow with mobile project; mobile navigation (dock) not scripted",
  H15m: "Bac mobile: mobile route to tier page not scripted",
  H16: "Len bac: needs myTier.pendingPromotion fixture and clock 2026-11-16T07:00+07:00 (separate test, not written)",
  H16m: "Len bac mobile: as H16",
  H17m: "Khung mobile: mobile route not scripted",
  H18m: "Bang bac mobile: mobile route not scripted",
  N14: "No baseline PNG yet (baseline-by-id/README.md)",
};
for (const [id, reason] of Object.entries(FIXME)) {
  test.fixme(`${id} not driven yet`, async () => { void reason; });
}

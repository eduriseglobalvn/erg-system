/// <reference types="node" />
import { readFileSync } from "node:fs";

import { expect, test, type Browser, type Page } from "@playwright/test";

import { seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";
import { DESIGN_NOW, LEVEL_UP_NOW, graphQlFixtures, leaderboardFor, myTier } from "./fixtures/student-design-fixtures";

// Baselines: docs/design/student-portal/baseline-by-id/<ArtboardId>.png (2x). Spec: docs/superpowers/specs/2026-11-12-student-portal-gamification-design.md section 9.
// Viewport = artboard size: width fixed per device, height = baseline PNG height / 2 (read from the IHDR chunk).
function artboard(id: string, width: number) {
  const png = readFileSync(`docs/design/student-portal/baseline-by-id/${id}.png`);
  return { width, height: Math.round(png.readUInt32BE(20) / 2) };
}
const web = (id: string) => artboard(id, 1440);
const mobile = (id: string) => artboard(id, 390);
const FREEZE_CSS = "*{transition:none!important;animation:none!important;caret-color:transparent!important}";

test.setTimeout(60_000);
test.use({ contextOptions: { reducedMotion: "reduce" }, timezoneId: "Asia/Ho_Chi_Minh" });

async function openStudent(page: Page, viewport: { width: number; height: number }, override: Record<string, unknown> = {}) {
  await page.setViewportSize(viewport);
  await setupPortalNetwork(page, "elearning");
  // Registered after the smoke network, so it wins; unknown operations fall through to it.
  await page.route(/\/graphql/, async (route) => {
    const body = route.request().postDataJSON() as { operationName?: string; variables?: { input?: { period?: string } } } | null;
    const op = body?.operationName ?? "";
    const data = op === "ElearningStudentClassLeaderboard" && !override[op]
      ? { elearning: { studentClassLeaderboard: leaderboardFor(body?.variables?.input?.period) } }
      : (override[op] ?? graphQlFixtures[op]);
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
  // The level-up gate (H16) is a modal that hides the shell from the accessibility tree.
  await expect(page.getByRole("button", { name: "Thi đua" }).first().or(page.getByText("Cập nhật bậc"))).toBeVisible({ timeout: 30_000 });
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
  await page.getByRole("tab", { name: "Cả khóa học" }).click();
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

async function mobilePage(browser: Browser, id: string) {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, deviceScaleFactor: 2, viewport: mobile(id), ignoreHTTPSErrors: true, reducedMotion: "reduce", timezoneId: "Asia/Ho_Chi_Minh" });
  const page = await context.newPage();
  await openStudent(page, mobile(id));
  return { page, context };
}
const dock = (page: Page, name: string) => page.getByRole("navigation", { name: "Điều hướng học sinh" }).getByRole("button", { name }).click();

/** Runs `drive` then compares; keeps every mobile test to a few lines. */
function mobileTest(id: string, title: string, drive: (page: Page) => Promise<void>) {
  test(`${id} ${title} (mobile)`, async ({ browser }) => {
    const { page, context } = await mobilePage(browser, id);
    await drive(page);
    await compare(page, id);
    await context.close();
  });
}

mobileTest("H03b", "Thi dua", (page) => dock(page, "Thi đua"));
mobileTest("H14m", "Ca lop", async (page) => {
  await dock(page, "Thi đua");
  await page.getByRole("tab", { name: "Cả khóa học" }).click();
  await page.getByRole("button", { name: "Xem cả lớp" }).click();
});
mobileTest("H18m", "Bang bac", async (page) => {
  await dock(page, "Thi đua");
  await page.getByRole("button", { name: "Bảng bậc & cấp" }).click();
});

// Assignment board: tab = filter tab of "Lọc bài tập".
const assignments = (tab: string | null) => async (page: Page) => {
  await page.getByRole("button", { name: "Bài tập" }).first().click();
  if (tab) await page.getByRole("tab", { name: new RegExp(tab) }).click();
};
test("H10 Can lam (web)", async ({ page }) => { await openStudent(page, web("H10")); await assignments(null)(page); await compare(page, "H10"); });
test("H09 Da nop (web)", async ({ page }) => { await openStudent(page, web("H09")); await assignments("Đã nộp")(page); await compare(page, "H09"); });
test("H11 Qua han (web)", async ({ page }) => { await openStudent(page, web("H11")); await assignments("Quá hạn")(page); await compare(page, "H11"); });
mobileTest("H02c", "Can lam", async (page) => { await dock(page, "Bài tập"); });
mobileTest("H02b", "Da nop", async (page) => { await dock(page, "Bài tập"); await page.getByRole("tab", { name: /Đã nộp/ }).click(); });
mobileTest("H02d", "Qua han", async (page) => { await dock(page, "Bài tập"); await page.getByRole("tab", { name: /Quá hạn/ }).click(); });

// H16: level-up screen. Needs myTier.pendingPromotion and the clock moved to Monday 16/11 07:00.
const PROMOTION = { weekStart: "2026-11-16", fromKey: "dong", fromDivision: 1, toKey: "bac", toDivision: 5, studentsPassed: 11, gradePercentile: 63 };
async function levelUp(page: Page, viewport: { width: number; height: number }) {
  const tier = { ...myTier, tierKey: "bac", division: 5, gradeRank: 80, courseXp: 1490, pendingPromotion: PROMOTION };
  await openStudent(page, viewport, { ElearningMyTier: { elearning: { myTier: tier } } });
  await page.clock.setFixedTime(new Date(LEVEL_UP_NOW));
}
test("H16 Len bac (web)", async ({ page }) => { await levelUp(page, web("H16")); await compare(page, "H16"); });
test("H16m Len bac (mobile)", async ({ browser }) => {
  const context = await browser.newContext({ isMobile: true, hasTouch: true, deviceScaleFactor: 2, viewport: mobile("H16m"), ignoreHTTPSErrors: true, reducedMotion: "reduce", timezoneId: "Asia/Ho_Chi_Minh" });
  const page = await context.newPage();
  await levelUp(page, mobile("H16m"));
  await compare(page, "H16m");
  await context.close();
});

// Not driven yet. Each reason is what is missing, not a guess.
const FIXME: Record<string, string> = {
  H12: "Hop thu web: needs notification REST feed + question-thread fixtures",
  H12m: "Hop thu chat mobile: as H12",
  H13: "Thao luan web: needs discussion feed fixture",
  H13m: "Thao luan mobile: as H13",
  H13m2: "Thao luan chu de mobile: as H13",
  H15m: "Bac mobile: no mobile route reaches the tier page. Dock Ho so opens the account page (no tier link); only the desktop sidebar chip calls openTierView. UI gap, see diff-report.md",
  H17m: "Khung mobile: as H15m (frames page is reached from the tier page)",
  N14: "No baseline PNG yet (baseline-by-id/README.md)",
};
for (const [id, reason] of Object.entries(FIXME)) {
  test.fixme(`${id} not driven yet`, async () => { void reason; });
}

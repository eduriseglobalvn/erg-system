import { expect, test, type Locator } from "@playwright/test";

// Drives the real question-list UI (src/test/e2e/harness) with a 90-question quiz, current question 61.
const harness = (view: "phone" | "web" | "phone-review") => `/src/test/e2e/harness/quiz-list-harness.html?view=${view}&n=90&current=60`;

// A chip whose label wrapped has two line boxes.
const labelLines = (chip: Locator) =>
  chip.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getClientRects().length;
  });

const noHorizontalOverflow = (locator: Locator) =>
  locator.evaluate((node) => node.scrollWidth <= node.clientWidth + 1);

test.describe("phone question sheet, 90 questions", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("opens at question 61, scrolls inside the sheet and never scrolls the page", async ({ page }) => {
    await page.goto(harness("phone"));
    await page.getByRole("button", { name: "Câu 61/90" }).click();

    const current = page.getByRole("button", { name: /^Câu 61, đang làm/ });
    await expect(current).toBeInViewport();

    const paper = page.locator(".MuiDrawer-paper");
    const box = await paper.boundingBox();
    expect(box?.height).toBeLessThanOrEqual(667 * 0.8 + 1);

    const grid = page.getByRole("group", { name: "Lưới câu hỏi" });
    expect(await noHorizontalOverflow(grid)).toBe(true);

    const pageScroll = () => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0);
    const before = await pageScroll();
    await grid.evaluate((node) => { node.scrollTop += 240; });
    await page.mouse.wheel(0, 400);
    expect(await pageScroll()).toBe(before);
    await expect(page.getByRole("button", { name: "Nộp bài" })).toBeInViewport();
  });

  test("review filter chips stay on one line", async ({ page }) => {
    await page.goto(harness("phone-review"));
    for (const chip of await page.getByRole("group", { name: "Lọc câu hỏi" }).getByRole("button").all()) {
      expect(await labelLines(chip)).toBe(1);
    }
  });
});

test.describe("web question list column", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("90 questions fit the 340px column and the review chips do not wrap", async ({ page }) => {
    await page.goto(harness("web"));
    const aside = page.getByRole("complementary").first();
    expect((await aside.boundingBox())?.width).toBeCloseTo(340, 0);
    expect(await noHorizontalOverflow(aside)).toBe(true);
    expect(await noHorizontalOverflow(page.getByRole("group", { name: "Lưới câu hỏi" }).first())).toBe(true);

    const review = page.getByTestId("review-column");
    const chips = await review.getByRole("group", { name: "Lọc câu hỏi" }).getByRole("button").all();
    expect(chips).toHaveLength(4);
    for (const chip of chips) expect(await labelLines(chip)).toBe(1);
    expect(await noHorizontalOverflow(review.getByRole("group", { name: "Lọc câu hỏi" })) ).toBe(true);
  });
});

test.describe("phone matching puzzle with a 120-character answer", () => {
  for (const width of [320, 375]) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 667 }, hasTouch: true, isMobile: true });

      test("pieces wrap, the page never scrolls sideways and dragging a piece to another row swaps them", async ({ page }) => {
        await page.goto("/src/test/e2e/harness/quiz-list-harness.html?view=matching");
        const pieces = page.getByRole("button", { name: /^Mảnh / });
        await expect(pieces).toHaveCount(3);

        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        for (const piece of await page.locator("[data-piece]").all()) {
          expect((await piece.boundingBox())?.width ?? 0).toBeLessThanOrEqual(Math.max(120, Math.floor((width - 32 - 66) / 2)) + 1);
        }

        const names = () => pieces.evaluateAll((nodes) => nodes.map((node) => /^Mảnh (.+), hàng/.exec(node.getAttribute("aria-label") ?? "")?.[1]));
        const before = await names();
        const from = (await pieces.nth(0).boundingBox())!;
        const to = (await pieces.nth(2).boundingBox())!;
        // A long press arms the touch sensor, then the finger moves to row 3.
        const client = await page.context().newCDPSession(page);
        const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
          client.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
        const sx = from.x + from.width / 2, sy = from.y + from.height / 2;
        await touch("touchStart", sx, sy);
        await page.waitForTimeout(250);
        for (let i = 1; i <= 8; i++) await touch("touchMove", sx, sy + ((to.y + to.height / 2 - sy) * i) / 8);
        await touch("touchEnd", 0, 0);
        const after = await names();
        expect(after[0]).not.toBe(before[0]);
        expect(after[2]).toBe(before[0]);
      });

      test("a quick swipe that starts on a piece scrolls the page and moves nothing", async ({ page }) => {
        await page.goto("/src/test/e2e/harness/quiz-list-harness.html?view=matching");
        const pieces = page.getByRole("button", { name: /^Mảnh / });
        const before = await pieces.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")));
        const box = (await pieces.nth(0).boundingBox())!;
        const client = await page.context().newCDPSession(page);
        const x = box.x + box.width / 2, y = box.y + box.height / 2;
        const touch = (type: "touchStart" | "touchMove" | "touchEnd", ty: number) => client.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y: ty }] });
        await touch("touchStart", y);
        for (let i = 1; i <= 12; i++) { await touch("touchMove", y - i * 15); await page.waitForTimeout(16); }
        await touch("touchEnd", 0);
        await page.waitForTimeout(300);
        expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBeGreaterThan(0);
        expect(await pieces.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")))).toEqual(before);
      });
    });
  }
});

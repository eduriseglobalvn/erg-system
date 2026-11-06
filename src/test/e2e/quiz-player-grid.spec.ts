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

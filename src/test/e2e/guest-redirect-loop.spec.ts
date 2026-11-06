import { expect, test } from "@playwright/test";

// Guest hitting a workspace deep link must reach /login once, never ping-pong between routes (plan 4.2).
for (const path of ["/admin/profile", "/teacher/exams/portable"]) {
  test(`guest ${path} redirects to login once without a loop`, async ({ page }) => {
    const visited: string[] = [];
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) visited.push(new URL(frame.url()).pathname);
    });

    await page.goto(path);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await page.waitForTimeout(1500); // a loop would keep navigating after the first landing

    expect(visited.filter((p) => p.startsWith("/login"))).toHaveLength(1);
    expect(visited.filter((p) => p === path)).toHaveLength(1);
    expect(visited.length).toBeLessThanOrEqual(3);
  });
}

import { test, expect } from "@playwright/test";

function createJwt(payload) {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

const fakeToken = createJwt({
  email: "lcms.admin@erg.local",
  exp: Math.floor(Date.now() / 1000) + 60 * 60,
  fullName: "LCMS Admin",
  name: "LCMS Admin",
  portal: "lcms",
  portals: ["lcms"],
  roles: ["admin"],
  sub: "lcms.admin@erg.local",
});

const fakeSession = {
  accessToken: fakeToken,
  accountId: "lcms-admin",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  loggedInAt: new Date().toISOString(),
  permissions: ["*"],
  portal: "lcms",
  portals: ["lcms"],
  rememberMe: true,
  refreshToken: "local-refresh-token",
};

async function createReadyPage(browser, path = "/") {
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1512, height: 982 },
  });
  const page = await context.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.addInitScript((session) => {
    window.localStorage.setItem(
      "erg-learning.session.lcms",
      JSON.stringify(session),
    );
  }, fakeSession);

  await page.goto(`https://lcms.erg.edu.local:3001${path}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  return { consoleErrors, context, page };
}

test("sidebar stays stable when navigating between LCMS routes", async ({
  browser,
}) => {
  const { context, consoleErrors, page } = await createReadyPage(
    browser,
    "/setting/setting-center-role",
  );

  await expect(page.getByText("Phân quyền", { exact: true })).toBeVisible();

  const sidebar = page.locator(".MuiDrawer-paper");

  const beforeMetrics = await page.evaluate(() => {
    const drawer = document.querySelector(".MuiDrawer-paper");
    const menu = document.querySelector(".MuiDrawer-paper .MuiList-root");

    if (!(drawer instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
      return null;
    }

    const drawerStyle = window.getComputedStyle(drawer);
    const menuStyle = window.getComputedStyle(menu);
    const rect = drawer.getBoundingClientRect();

    return {
      backdropFilter: drawerStyle.backdropFilter,
      opacity: drawerStyle.opacity,
      rect: {
        height: rect.height,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      },
      transform: menuStyle.transform,
    };
  });

  await sidebar.screenshot({
    path: ".playwright-screens/sidebar-before-navigation.png",
  });

  await page.getByText("Quản lý học liệu", { exact: true }).click();
  await page.waitForURL("**/resources");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Quản lý học liệu", { exact: true })).toBeVisible();
  await page.waitForTimeout(700);

  const afterMetrics = await page.evaluate(() => {
    const drawer = document.querySelector(".MuiDrawer-paper");
    const menu = document.querySelector(".MuiDrawer-paper .MuiList-root");

    if (!(drawer instanceof HTMLElement) || !(menu instanceof HTMLElement)) {
      return null;
    }

    const drawerStyle = window.getComputedStyle(drawer);
    const menuStyle = window.getComputedStyle(menu);
    const rect = drawer.getBoundingClientRect();

    return {
      backdropFilter: drawerStyle.backdropFilter,
      opacity: drawerStyle.opacity,
      rect: {
        height: rect.height,
        width: rect.width,
        x: rect.x,
        y: rect.y,
      },
      transform: menuStyle.transform,
    };
  });

  await sidebar.screenshot({
    path: ".playwright-screens/sidebar-after-navigation.png",
  });

  console.log(
    JSON.stringify(
      {
        afterMetrics,
        beforeMetrics,
        consoleErrors,
      },
      null,
      2,
    ),
  );

  expect(consoleErrors).toEqual([]);
  expect(beforeMetrics).not.toBeNull();
  expect(afterMetrics).not.toBeNull();
  expect(Math.abs(afterMetrics.rect.width - beforeMetrics.rect.width)).toBeLessThan(1);
  expect(afterMetrics.transform).toBe("none");
  expect(beforeMetrics.backdropFilter.includes("blur")).toBeTruthy();

  await context.close();
});

test("expanded menu does not look double-selected when opening another submenu", async ({
  browser,
}) => {
  const { context, consoleErrors, page } = await createReadyPage(browser, "/");

  await expect(
    page.getByRole("button", { name: "Trang chủ", exact: true }),
  ).toBeVisible();
  await page.getByText("Báo cáo", { exact: true }).click();
  await page.waitForTimeout(250);

  const menuState = await page.evaluate(() => {
    const findTopLevelButton = (label) => {
      const buttons = Array.from(
        document.querySelectorAll(".centerup-nav-node > .MuiListItemButton-root"),
      );
      return buttons.find((button) => {
        const text = button.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return text === label;
      });
    };

    const home = findTopLevelButton("Trang chủ");
    const report = findTopLevelButton("Báo cáo");

    if (!(home instanceof HTMLElement) || !(report instanceof HTMLElement)) {
      return null;
    }

    const homeStyle = window.getComputedStyle(home);
    const reportStyle = window.getComputedStyle(report);

    return {
      home: {
        backgroundImage: homeStyle.backgroundImage,
        borderColor: homeStyle.borderColor,
        boxShadow: homeStyle.boxShadow,
        color: homeStyle.color,
      },
      report: {
        backgroundImage: reportStyle.backgroundImage,
        borderColor: reportStyle.borderColor,
        boxShadow: reportStyle.boxShadow,
        color: reportStyle.color,
      },
    };
  });

  await page.locator(".MuiDrawer-paper").screenshot({
    path: ".playwright-screens/sidebar-expanded-open-no-double-selected.png",
  });

  console.log(JSON.stringify({ consoleErrors, menuState }, null, 2));

  expect(consoleErrors).toEqual([]);
  expect(menuState).not.toBeNull();
  expect(menuState.home.boxShadow).not.toBe("none");
  expect(menuState.report.boxShadow).toBe("none");
  expect(menuState.home.borderColor).not.toBe(menuState.report.borderColor);

  await context.close();
});

test("collapsed flyout is vertically centered to hovered item", async ({
  browser,
}) => {
  const { context, consoleErrors, page } = await createReadyPage(browser, "/");

  const collapseButton = page.getByRole("button", { name: "Thu gon menu" });
  await collapseButton.click();
  await page.waitForTimeout(450);

  const reportButton = page
    .locator(".centerup-nav-node > .MuiListItemButton-root")
    .nth(1);

  await reportButton.hover();
  await page.waitForTimeout(700);
  await expect(page.locator('[data-popper-placement="right"]')).toBeVisible();

  const flyoutMetrics = await page.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll(".centerup-nav-node > .MuiListItemButton-root"),
    );
    const reportButton = buttons[1];
    const flyout = document.querySelector('[data-popper-placement="right"]');
    const arrow = reportButton?.querySelector(":scope > .MuiSvgIcon-root");

    if (
      !(reportButton instanceof HTMLElement) ||
      !(flyout instanceof HTMLElement) ||
      !(arrow instanceof SVGElement)
    ) {
      return null;
    }

    const buttonRect = reportButton.getBoundingClientRect();
    const flyoutRect = flyout.getBoundingClientRect();
    const arrowRect = arrow.getBoundingClientRect();

    return {
      arrowCenterOffset: Math.abs(
        arrowRect.top + arrowRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
      ),
      buttonCenterY: buttonRect.top + buttonRect.height / 2,
      flyoutCenterOffset: Math.abs(
        flyoutRect.top + flyoutRect.height / 2 - (buttonRect.top + buttonRect.height / 2),
      ),
      flyoutPlacement: flyout.getAttribute("data-popper-placement"),
    };
  });

  await page.locator(".MuiDrawer-paper").screenshot({
    path: ".playwright-screens/sidebar-collapsed-flyout-centered.png",
  });

  console.log(JSON.stringify({ consoleErrors, flyoutMetrics }, null, 2));

  expect(consoleErrors).toEqual([]);
  expect(flyoutMetrics).not.toBeNull();
  expect(flyoutMetrics.flyoutPlacement).toBe("right");
  expect(flyoutMetrics.flyoutCenterOffset).toBeLessThan(3);
  expect(flyoutMetrics.arrowCenterOffset).toBeLessThan(2);

  await context.close();
});

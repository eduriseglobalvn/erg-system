import { test } from "@playwright/test";

import { assertApiFailureBoundary, assertGuestRedirect, assertMainRoute, portalSmokeDefinitions, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("LMS auth, bootstrap, main route and API failure smoke", async ({ page }) => {
  const definition = portalSmokeDefinitions.lms;
  const network = await setupPortalNetwork(page, "lms");
  await assertGuestRedirect(page, definition);
  await seedAuthenticatedPortal(page, "lms");
  await assertMainRoute(page, definition, network);
  await assertApiFailureBoundary(page, definition, network);
});

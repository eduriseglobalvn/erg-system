import { test } from "@playwright/test";

import { assertApiFailureBoundary, assertGuestRedirect, assertMainRoute, portalSmokeDefinitions, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("LCMS auth, bootstrap, main route and API failure smoke", async ({ page }) => {
  const definition = portalSmokeDefinitions.lcms;
  const network = await setupPortalNetwork(page, "lcms");
  await assertGuestRedirect(page, definition);
  await seedAuthenticatedPortal(page, "lcms");
  await assertMainRoute(page, definition, network);
  await assertApiFailureBoundary(page, definition, network);
});

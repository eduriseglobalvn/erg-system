import { test } from "@playwright/test";

import { assertApiFailureBoundary, assertGuestRedirect, assertMainRoute, portalSmokeDefinitions, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("ELEARNING auth, bootstrap, main route and API failure smoke", async ({ page }) => {
  const definition = portalSmokeDefinitions.elearning;
  const network = await setupPortalNetwork(page, "elearning");
  await assertGuestRedirect(page, definition);
  await seedAuthenticatedPortal(page, "elearning");
  await assertMainRoute(page, definition, network);
  await assertApiFailureBoundary(page, definition, network);
});

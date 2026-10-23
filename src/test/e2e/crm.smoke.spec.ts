import { test } from "@playwright/test";

import { assertApiFailureBoundary, assertGuestRedirect, assertMainRoute, portalSmokeDefinitions, seedAuthenticatedPortal } from "./fixtures/portal-smoke-fixtures";
import { setupPortalNetwork } from "./fixtures/portal-smoke-network";

test("CRM auth, bootstrap, main route and API failure resilience smoke", async ({ page }) => {
  const definition = portalSmokeDefinitions.crm;
  const network = await setupPortalNetwork(page, "crm");
  await assertGuestRedirect(page, definition);
  await seedAuthenticatedPortal(page, "crm");
  await assertMainRoute(page, definition, network);
  // CRM commands remain contract-blocked; this verifies the local read surface does not crash when all API traffic fails.
  await assertApiFailureBoundary(page, definition, network);
});

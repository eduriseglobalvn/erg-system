import { expect, it } from "vitest";

import {
  PORTAL_SIDEBAR_MOTION_EASING,
  PORTAL_SIDEBAR_MOTION_MS,
} from "@/components/portal/portal-sidebar-motion";

it("uses a measured shell motion that does not snap at the start", () => {
  expect(PORTAL_SIDEBAR_MOTION_MS).toBe(280);
  expect(PORTAL_SIDEBAR_MOTION_EASING).toBe(
    "cubic-bezier(0.2, 0, 0, 1)",
  );
});

import { describe, expect, it } from "vitest";

import { getPortalLoginCopy } from "./portal-login-copy";

describe("Admin login presentation", () => {
  it("uses Admin as the external workspace name while retaining the internal lcms key", () => {
    const copy = getPortalLoginCopy("lcms");
    expect(copy.badge).toBe("Admin");
    expect(copy.mobileLabel).toBe("Admin ERG");
    expect(copy.formTitle).toBe("Đăng nhập Admin");
    expect(copy.formTitle).not.toContain("LCMS");
  });
});

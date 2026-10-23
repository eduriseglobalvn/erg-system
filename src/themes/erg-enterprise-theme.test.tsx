import { describe, expect, it } from "vitest";
import { ergEnterpriseTheme } from "./erg-enterprise-theme";
import { ergEnterpriseTokens } from "./erg-enterprise-tokens";

describe("ERG enterprise theme", () => {
  it("uses the approved operational dimensions and typography", () => {
    expect(ergEnterpriseTokens.size.header).toBe(64);
    expect(ergEnterpriseTokens.size.sidebar).toBe(280);
    expect(ergEnterpriseTheme.shape.borderRadius).toBe(8);
    expect(ergEnterpriseTheme.palette.primary.main).toBe("#0F6CBD");
    expect(ergEnterpriseTheme.typography.fontFamily).toContain("Manrope Variable");
    expect(ergEnterpriseTheme.typography.body2.fontSize).toBe(14);
  });

  it("keeps operational motion restrained and accessible", () => {
    const componentOverrides = JSON.stringify(ergEnterpriseTheme.components);

    expect(componentOverrides).toContain("prefers-reduced-motion: reduce");
    expect(componentOverrides).not.toContain("linear-gradient");
    expect(ergEnterpriseTheme.components?.MuiButtonBase).toBeDefined();
    expect(ergEnterpriseTheme.components?.MuiDrawer).toBeDefined();
    expect(ergEnterpriseTheme.components?.MuiMenu).toBeDefined();
    expect(ergEnterpriseTheme.components?.MuiTabs).toBeDefined();
    expect(ergEnterpriseTheme.components?.MuiSnackbar).toBeDefined();
  });
});

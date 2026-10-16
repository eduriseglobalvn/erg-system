import fs from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

const portalRoot = path.resolve(process.cwd(), "src/components/portal");
const source = (name: string) => fs.readFileSync(path.join(portalRoot, name), "utf8");

describe("portal sidebar ownership", () => {
  test("keeps the shell below the AGENTS limit and delegates cohesive concerns", () => {
    const sidebar = source("ErgPortalSidebar.tsx");

    expect(sidebar.split(/\r?\n/).length).toBeLessThanOrEqual(200);
    expect(sidebar).toContain('from "./portal-sidebar-logo"');
    expect(sidebar).toContain('from "./portal-sidebar-nav-layer"');
    expect(sidebar).toContain('from "./portal-sidebar-styles"');
    expect(sidebar).toContain('from "./portal-sidebar-utils"');
    expect(sidebar).not.toContain("useState(");
    expect(sidebar).not.toContain("useEffect(");
  });

  test("keeps navigation items and responsive flyout outside the shell owner", () => {
    expect(source("portal-sidebar-nav-layer.tsx")).toContain("SidebarNavigationLayer");
    expect(source("portal-sidebar-branch-item.tsx")).toContain("SidebarBranchItem");
    expect(source("portal-sidebar-compact-item.tsx")).toContain("SidebarCompactItem");
    expect(source("portal-sidebar-leaf-item.tsx")).toContain("SidebarLeafItem");
    expect(source("use-collapsed-flyout.ts")).toContain("useCollapsedFlyout");
  });
});

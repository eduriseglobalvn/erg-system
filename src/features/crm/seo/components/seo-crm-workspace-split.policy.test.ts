import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "src/features/crm/seo/components");
const owners = [
  "seo-crm-workspace.tsx",
  "seo-crm-workspace-shared.tsx",
  "seo-crm-overview.tsx",
  "seo-crm-pipeline.tsx",
  "seo-crm-pnl-workspace.tsx",
  "seo-crm-followup-handover.tsx",
];

describe("SeoCrmWorkspace ownership", () => {
  it("keeps the public workspace thin and requires cohesive view owners", () => {
    for (const owner of owners) expect(fs.existsSync(path.join(root, owner)), owner).toBe(true);
    const publicLines = fs.readFileSync(path.join(root, owners[0]!), "utf8").split(/\r?\n/u).length;
    expect(publicLines).toBeLessThan(250);
  });

  it("keeps every extracted owner below the god-file threshold", () => {
    for (const owner of owners.slice(1)) {
      const lines = fs.readFileSync(path.join(root, owner), "utf8").split(/\r?\n/u).length;
      expect(lines, owner).toBeLessThan(300);
    }
  });
});

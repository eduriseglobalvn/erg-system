import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspacePath = join(
  process.cwd(),
  "src/features/lcms/admin-operations/components/learning-resource-authoring-workspace.tsx",
);

describe("learning resource authoring workspace boundary", () => {
  it("keeps the exported orchestration container under 250 lines", () => {
    const source = readFileSync(workspacePath, "utf8");
    const start = source.indexOf("export function LearningResourceAuthoringWorkspace");
    const nextDeclaration = source.indexOf("\nfunction SubjectsScreen", start);
    const container = source.slice(start, nextDeclaration > start ? nextDeclaration : undefined);

    expect(container.split(/\r?\n/).length).toBeLessThan(250);
  });

  it("composes extracted screens and dialogs instead of declaring them inline", () => {
    const source = readFileSync(workspacePath, "utf8");

    expect(source).toContain("learning-resource-authoring-catalog-screens");
    expect(source).toContain("learning-resource-authoring-upload-screen");
    expect(source).toContain("learning-resource-authoring-dialogs");
    expect(source).not.toMatch(/function (SubjectsScreen|ResourcesScreen|UploadScreen|PublishScreen)\b/);
  });
});

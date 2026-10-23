import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = resolve(
  process.cwd(),
  "src/features/elearning/student-dashboard/components",
);

function readComponent(fileName: string) {
  return readFileSync(resolve(componentsDirectory, fileName), "utf8");
}

function lineCount(source: string) {
  return source.trimEnd().split(/\r?\n/u).length;
}

describe("StudentDashboardWorkspace split policy", () => {
  it("keeps the public workspace as a small composition boundary", () => {
    const source = readComponent("student-dashboard-workspace.tsx");

    expect(lineCount(source)).toBeLessThanOrEqual(250);
    expect(source).toContain("StudentDashboardWorkspaceRuntime");
    expect(source).not.toMatch(/\buse(Query|Mutation|QueryClient)\b/u);
    expect(source).not.toContain("mock-student-dashboard");
  });

  it("keeps the existing runtime behind one explicit owner", () => {
    const source = readComponent("student-dashboard-workspace-runtime.tsx");

    expect(lineCount(source)).toBeLessThanOrEqual(750);
    expect(source).toContain("export function StudentDashboardWorkspaceRuntime");
    expect(source).toContain("studentDashboardQueryOptions");
    expect(source).toContain("studentDiscussionFeedQueryOptions");
    expect(source).toContain("<DiscussionView");
  });

  it("keeps cohesive presentation sections in dedicated owners", () => {
    const topMenu = readComponent("student-dashboard-top-menu.tsx");
    const contentViews = readComponent("student-dashboard-content-views.tsx");
    const primitives = readComponent("student-dashboard-view-primitives.tsx");

    expect(lineCount(topMenu)).toBeLessThanOrEqual(410);
    expect(lineCount(contentViews)).toBeLessThanOrEqual(410);
    expect(lineCount(primitives)).toBeLessThanOrEqual(420);
    expect(topMenu).toContain("export function TopMenuShell");
    expect(contentViews).toContain("export function OverviewView");
    expect(primitives).toContain("export function AssignmentListItem");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Teacher shell route state policy", () => {
  it("subscribes to TanStack Router location changes instead of reading pathname once from window", () => {
    const source = readFileSync(resolve("src/features/lms/components/use-lms-teacher-shell-controller.ts"), "utf8");

    expect(source).toContain('import { useLocation, useNavigate } from "@tanstack/react-router";');
    expect(source).toContain("const location = useLocation();");
    expect(source).not.toContain("window.location.pathname");
  });

  it("returns mobile assignment cancel to the homework list", () => {
    const source = readFileSync(resolve("src/features/lms/components/lms-teacher-shell-workspaces.tsx"), "utf8");
    const mobileSource = source.slice(source.indexOf("export function LmsTeacherMobileContent"));
    const assignmentBranchStart = mobileSource.indexOf('if (localPathname === "/homework/assign")');
    const assignmentBranchEnd = mobileSource.indexOf('if (localPathname === "/homework/exercise-bank")');
    const assignmentBranch = mobileSource.slice(assignmentBranchStart, assignmentBranchEnd);

    expect(assignmentBranch).toContain('onBack={() => void navigate({ href: teacherPath("/homework") })}');
    expect(assignmentBranch).toContain('handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))');
    expect(assignmentBranch).not.toContain('teacherPath("/homework/assign")');
  });
});

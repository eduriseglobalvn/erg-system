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
    const source = readFileSync(resolve("src/features/lms/components/lms-teacher-route-pages.tsx"), "utf8");
    const assignmentBranchStart = source.indexOf("export function TeacherAssignHomeworkRoute");
    const assignmentBranchEnd = source.indexOf("export function TeacherExerciseBankRoute");
    const assignmentBranch = source.slice(assignmentBranchStart, assignmentBranchEnd);

    expect(assignmentBranch).toContain('onBack={() => void m.navigate({ href: teacherPath("/homework") })}');
    expect(assignmentBranch).toContain('m.handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))');
    expect(assignmentBranch).not.toContain('teacherPath("/homework/assign")');
  });
});

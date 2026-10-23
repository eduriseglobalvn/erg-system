import { describe, expect, it } from "vitest";

import { adminPath, studentPath, stripWorkspacePath, teacherPath, workspacePath } from "./workspace-paths";

describe("workspace path contract", () => {
  it.each([
    [adminPath("/schools"), "/admin/schools"],
    [teacherPath("/class-log"), "/teacher/class-log"],
    [studentPath("/assignments?tab=active"), "/student/assignments?tab=active"],
    [workspacePath("TEACHER", "/teacher/homework"), "/teacher/homework"],
  ])("returns canonical workspace paths", (actual, expected) => {
    expect(actual).toBe(expected);
  });

  it.each([
    [stripWorkspacePath("/admin/content/resources", "ADMIN"), "/content/resources"],
    [stripWorkspacePath("/teacher/class-log?week=2", "TEACHER"), "/class-log?week=2"],
    [stripWorkspacePath("/student", "STUDENT"), "/"],
  ])("strips only the selected workspace prefix", (actual, expected) => {
    expect(actual).toBe(expected);
  });
});

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const cancellationCallSites = [
  ["components/use-lms-teacher-shell-controller.ts", "loadLmsTeacherHomeworkWorkspace"],
  ["components/homework-progress-page.tsx", "loadLmsAssignmentProgressWorkspace"],
  ["components/use-assign-homework-controller.ts", "loadLmsClassWorkspace"],
  ["classroom/components/class-management-page.tsx", "loadLmsClassWorkspace"],
  ["classroom/components/class-students-workspace.tsx", "loadLmsClassWorkspace"],
  ["components/student-groups-page.tsx", "loadLmsClassWorkspace"],
  ["components/teaching-schedule/lms-erg-calendar-workspace.tsx", "loadLmsMyTeachingCalendar"],
  ["components/teaching-schedule/lms-erg-calendar-workspace.tsx", "loadTeachingCalendarReferenceCatalog"],
] as const;

describe("LMS query cancellation policy", () => {
  it.each(cancellationCallSites)("does not drop signal in %s for %s", (relativePath, loader) => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/lms", relativePath),
      "utf8",
    );
    const droppedSignal = new RegExp(`queryFn:\\s*\\(\\)\\s*=>[\\s\\S]{0,120}${loader}`);

    expect(source).not.toMatch(droppedSignal);
    expect(source).toMatch(new RegExp(`queryFn:\\s*\\(\\{\\s*signal\\s*\\}\\)\\s*=>[\\s\\S]{0,120}${loader}`));
  });
});

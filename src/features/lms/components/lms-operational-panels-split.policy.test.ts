import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lms/components");

function read(relativePath: string) {
  return readFileSync(resolve(ROOT, relativePath), "utf8");
}

describe("LMS operational panel ownership", () => {
  it.each([
    ["score-sheet-panel.tsx", "useScoreSheetController", "DesktopScoreSheetPanel"],
    ["attendance-sheet-panel.tsx", "useAttendanceSheetController", "DesktopAttendanceSheetPanel"],
    ["exercise-bank-page.tsx", "useExerciseBankController", "DesktopExerciseBankView"],
  ])("keeps %s as a thin composition shell", (fileName, controllerOwner, presentationOwner) => {
    const source = read(fileName);

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(250);
    expect(source).toContain(controllerOwner);
    expect(source).toContain(presentationOwner);
    expect(source).not.toMatch(/\buse(?:Memo|State|Ref)\b/);
  });

  it.each([
    "score/score-sheet-model.ts",
    "score/use-score-sheet-controller.ts",
    "score/desktop-score-sheet-panel.tsx",
    "score/score-sheet-overlays.tsx",
    "attendance/attendance-sheet-model.ts",
    "attendance/use-attendance-sheet-controller.ts",
    "attendance/desktop-attendance-sheet-panel.tsx",
    "attendance/attendance-sheet-overlays.tsx",
    "exercise-bank/exercise-bank-model.ts",
    "exercise-bank/use-exercise-bank-controller.ts",
    "exercise-bank/mobile-exercise-bank-view.tsx",
    "exercise-bank/desktop-exercise-bank-view.tsx",
  ])("has a dedicated %s owner", (fileName) => {
    expect(() => read(fileName)).not.toThrow();
  });

  it("keeps mobile score types independent from the public shell", () => {
    expect(read("score/mobile-score-sheet-panel.tsx")).not.toMatch(/from ["']@\/features\/lms\/components\/score-sheet-panel["']/);
  });

  it("keeps mobile attendance types independent from the public shell", () => {
    expect(read("attendance/mobile-attendance-sheet-panel.tsx")).not.toMatch(/from ["']@\/features\/lms\/components\/attendance-sheet-panel["']/);
  });
});

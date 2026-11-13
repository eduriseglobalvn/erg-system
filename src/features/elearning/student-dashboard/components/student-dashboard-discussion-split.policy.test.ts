import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const directory = resolve(process.cwd(), "src/features/elearning/student-dashboard/components");

function lines(fileName: string) {
  return readFileSync(resolve(directory, fileName), "utf8").trimEnd().split(/\r?\n/u).length;
}

describe("discussion view split policy", () => {
  it("keeps DiscussionView a small composition owner over focused thread modules", () => {
    const view = readFileSync(resolve(directory, "student-dashboard-discussion-view.tsx"), "utf8");

    expect(lines("student-dashboard-discussion-view.tsx")).toBeLessThanOrEqual(250);
    expect(view).toContain("ThreadList");
    expect(view).toContain("ThreadDetail");
    expect(view).toContain("AskQuestionDialog");
  });

  it("keeps each thread module under 300 lines", () => {
    for (const file of ["student-discussion-thread-list.tsx", "student-discussion-thread-detail.tsx", "student-discussion-replies.tsx", "student-discussion-thread-parts.tsx", "student-discussion-ask-dialog.tsx"]) {
      expect(lines(file), file).toBeLessThanOrEqual(300);
    }
  });
});

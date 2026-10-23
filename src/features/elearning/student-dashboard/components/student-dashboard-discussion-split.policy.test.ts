import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const directory = resolve(process.cwd(), "src/features/elearning/student-dashboard/components");

function source(fileName: string) {
  return readFileSync(resolve(directory, fileName), "utf8");
}

function lines(value: string) {
  return value.trimEnd().split(/\r?\n/u).length;
}

describe("discussion view split policy", () => {
  it("keeps DiscussionView as a small composition owner", () => {
    const view = source("student-dashboard-discussion-view.tsx");

    expect(lines(view)).toBeLessThanOrEqual(250);
    expect(view).toContain("DiscussionPostCard");
    expect(view).toContain("AttachmentPreview");
  });

  it("keeps feed, reactions and attachments in focused modules", () => {
    const postCard = source("student-dashboard-discussion-post-card.tsx");
    const reactions = source("student-dashboard-discussion-reactions.tsx");
    const composerTools = source("student-dashboard-discussion-composer-tools.tsx");

    expect(lines(postCard)).toBeLessThanOrEqual(360);
    expect(lines(reactions)).toBeLessThanOrEqual(380);
    expect(lines(composerTools)).toBeLessThanOrEqual(320);
    expect(postCard).toContain("export function DiscussionPostCard");
    expect(reactions).toContain("export function ReactionActionButton");
    expect(composerTools).toContain("export function AttachmentPreview");
  });
});

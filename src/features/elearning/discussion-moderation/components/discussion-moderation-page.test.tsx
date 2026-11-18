import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQuery } from "@/features/elearning/student-tier/components/tier-fixtures";
import { LmsTeacherShellContext } from "@/features/lms/components/lms-teacher-shell-context";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { DiscussionModerationPage } from "./discussion-moderation-page";

const api = vi.hoisted(() => ({ classes: vi.fn(), feed: vi.fn() }));
vi.mock("@/features/elearning/discussion-moderation/api/discussion-moderation-api", async (original) => ({
  ...(await original<object>()),
  loadModerationClasses: api.classes,
  loadModerationFeed: api.feed,
}));

beforeEach(() => {
  api.classes.mockResolvedValue([{ id: "a1", name: "Lớp 6A5" }, { id: "b1", name: "Lớp 7A1" }]);
  api.feed.mockResolvedValue({ items: [] });
});

describe("DiscussionModerationPage class scope (BUG-UI-004)", () => {
  it("opens on the class picked in the teacher top bar", async () => {
    const shell = { selectedClass: { id: "b1" } } as unknown as LmsTeacherShellController;
    renderWithQuery(<LmsTeacherShellContext.Provider value={shell}><DiscussionModerationPage portal="lms" /></LmsTeacherShellContext.Provider>);
    expect(await screen.findByText("Lớp 7A1")).toBeTruthy();
    expect(api.feed).toHaveBeenCalledWith("lms", "b1", expect.anything());
    expect(api.feed).not.toHaveBeenCalledWith("lms", "a1", expect.anything());
  });

  it("falls back to the first class without a shell (admin)", async () => {
    renderWithQuery(<DiscussionModerationPage portal="lcms" />);
    expect(await screen.findByText("Lớp 6A5")).toBeTruthy();
    expect(api.feed).toHaveBeenCalledWith("lcms", "a1", expect.anything());
  });
});

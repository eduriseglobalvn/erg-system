import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQuery } from "@/features/elearning/student-tier/components/tier-fixtures";
import { LmsTeacherShellContext } from "@/features/lms/components/lms-teacher-shell-context";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { ClassLeaderboardPage } from "./class-leaderboard-page";

const api = vi.hoisted(() => ({ classes: vi.fn(), board: vi.fn() }));
vi.mock("@/features/elearning/class-leaderboard/api/class-leaderboard-api", async (original) => ({ ...(await original<object>()), loadLeaderboardClasses: api.classes, loadClassLeaderboard: api.board }));

const all = [{ id: "a1", name: "Lớp 7A", leaderboardEnabled: true }, { id: "b1", name: "Lớp 8B", leaderboardEnabled: true }];
const shell = (selectedSchoolId: string) => ({ selectedSchoolId, classes: [{ id: "a1", schoolId: "s1" }, { id: "b1", schoolId: "s2" }] }) as unknown as LmsTeacherShellController;

beforeEach(() => {
  api.classes.mockResolvedValue(all);
  api.board.mockImplementation(async (_p: string, classId: string) => ({ classId, className: classId, enabled: true, period: "WEEK", scope: "CLASS", periodEndsAt: "", viewerHidden: false, entries: [{ rank: 1, studentId: "s", studentName: "An", xp: 10, streakDays: 0, rankChange: 0, isViewer: false, tierKey: null, division: null, frameKey: null, hidden: false }] }));
});

describe("ClassLeaderboardPage school scope", () => {
  it("offers only classes of the selected school", async () => {
    renderWithQuery(<LmsTeacherShellContext.Provider value={shell("s2")}><ClassLeaderboardPage portal="lms" /></LmsTeacherShellContext.Provider>);
    expect(await screen.findByText("Lớp 8B")).toBeTruthy();
    expect(screen.queryByText("Lớp 7A")).toBeNull();
    expect(api.board).toHaveBeenCalledWith("lms", "b1", "WEEK", expect.anything());
    expect(await screen.findByText("Chưa có học sinh nào được xếp bậc — bậc được cập nhật mỗi thứ Hai.")).toBeTruthy();
  });

  it("keeps every class without a shell (admin)", async () => {
    renderWithQuery(<ClassLeaderboardPage portal="lcms" />);
    expect(await screen.findByText("Lớp 7A")).toBeTruthy();
    expect(api.board).toHaveBeenCalledWith("lcms", "a1", "WEEK", expect.anything());
  });
});

import { useState } from "react";
import type { LeaderboardPeriod } from "@/features/elearning/class-leaderboard/api/class-leaderboard-api";
import { ClassFullBoardPage } from "@/features/elearning/class-leaderboard/components/class-full-board-page";
import { RankingView } from "@/features/elearning/student-dashboard/components/student-dashboard-ranking-view";
import type { DashboardCopy } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardAssignment, StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { FramePickerPage } from "@/features/elearning/student-tier/components/frame-picker-page";
import { MyTierPage } from "@/features/elearning/student-tier/components/my-tier-page";
import { TierTablePage } from "@/features/elearning/student-tier/components/tier-table-page";

export type TierView = "tier" | "table" | "frames" | "board";

/** Thi đua and its sub-pages (tier H15, tier table H18, frames H17, whole class H14); `view` null = the board itself. */
export function StudentRankingSurface({ accountId, copy, name, openAssignments, profile, view, onDoAssignments, onView }: {
  accountId: string;
  copy: DashboardCopy;
  name: string;
  openAssignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  view: TierView | null;
  onDoAssignments: () => void;
  onView: (view: TierView | null) => void;
}) {
  const [boardPeriod, setBoardPeriod] = useState<LeaderboardPeriod>("WEEK");
  const gradeLabel = profile.gradeLabel || "khối";
  if (view === "tier") {
    return (
      <MyTierPage
        accountId={accountId} gradeLabel={gradeLabel} studentName={name}
        openAssignments={openAssignments.length ? { count: openAssignments.length, xp: openAssignments.reduce((sum, a) => sum + (a.xpReward ?? 0), 0) } : null}
        onBack={() => onView(null)} onDoAssignments={onDoAssignments} onOpenFrames={() => onView("frames")}
        onOpenLeaderboard={() => onView(null)} onOpenTable={() => onView("table")}
      />
    );
  }
  if (view === "table") return <TierTablePage accountId={accountId} gradeLabel={gradeLabel} onBack={() => onView(null)} />;
  if (view === "frames") return <FramePickerPage accountId={accountId} className={profile.className} studentName={name} onBack={() => onView("tier")} onDone={() => onView("tier")} />;
  if (view === "board") return <ClassFullBoardPage accountId={accountId} classId={profile.classId ?? ""} gradeLabel={profile.gradeLabel || undefined} initialPeriod={boardPeriod} onBack={() => onView(null)} />;
  return (
    <RankingView
      accountId={accountId} classId={profile.classId ?? ""} copy={copy}
      onOpenFullBoard={(period) => { setBoardPeriod(period); onView("board"); }}
      onOpenTierTable={() => onView("table")}
      openAssignments={openAssignments} onDoAssignments={onDoAssignments}
    />
  );
}

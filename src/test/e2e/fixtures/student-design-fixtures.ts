// Sample student of the design canvas (Nguyen Minh Anh, 7A). Numbers copied from docs/design/student-portal/source/*.html.
// Rows 5-10 of the class board and the minXp of non-Dong tiers are NOT in the sources we parsed: placeholders, marked below.
export const DESIGN_NOW = "2026-11-12T16:00:00+07:00";

export const dashboard = {
  tenantId: "tenant-smoke",
  viewer: { userId: "elearning-smoke-user", tenantId: "tenant-smoke", accountType: "STUDENT", accessLevel: "LEARNER" },
  profile: {
    userId: "elearning-smoke-user", studentId: "student-smoke", studentCode: "STU-001", fullName: "Nguyễn Minh Anh",
    email: "minhanh@example.test", schoolId: "school-smoke", academicClassId: "class-7a", status: "ACTIVE",
    updatedAt: "2026-11-12T00:00:00Z", leaderboardEnabled: true,
  },
  summary: {
    enrolledCourseCount: 1, activeAssignmentCount: 3, pendingActionCount: 3, generatedAt: "2026-11-12T00:00:00Z",
    scoreSummary: { completedAttemptCount: 9, attemptedAssignmentCount: 9, passedAttemptCount: 8, averagePercent: 72.5, bestPercent: 95 },
  },
  courses: [], assignments: [], nextActions: [], announcements: [],
};

const row = (rank: number, studentName: string, xp: number, streakDays: number, extra: object = {}) => ({
  rank, studentId: `s-${rank}`, studentName, xp, streakDays, rankChange: 0, isViewer: false, rankDelta: 0,
  submittedInPeriod: true, xpToday: 0, tierKey: "dong", division: 2, frameKey: null, hidden: false, ...extra,
});

export const leaderboard = {
  classId: "class-7a", className: "7A", enabled: true, period: "WEEK", scope: "CLASS",
  periodEndsAt: "2026-11-16T23:59:59+07:00", viewerHidden: false,
  me: { rank: 4, size: 32, xp: 380, gradeRank: 12, gradeSize: 128, xpToNextRank: 40, nextRankName: "Gia Bảo" },
  entries: [
    row(1, "Khánh Thy", 512, 15),
    row(2, "Đức Huy", 486, 9, { xpToday: 120 }),
    row(3, "Gia Bảo", 420, 6),
    row(4, "Nguyễn Minh Anh", 380, 12, { isViewer: true, rankDelta: 2 }),
    // placeholders below: names/xp not taken from the canvas
    ...[360, 340, 322, 300, 285, 270].map((xp, i) => row(5 + i, `Bạn lớp ${5 + i}`, xp, 3)),
  ],
};

export const myTier = {
  tierKey: "dong", division: 2, gradeRank: 92, gradeSize: 128, courseXp: 1240, eligible: true, submittedCount: 9, protected: false,
  nextDivision: { tierKey: "dong", division: 1, minXp: 1325, studentsToPass: 3 },
  nextTier: { tierKey: "bac", division: 5, minXp: 1480, studentsToPass: 8 },
  pendingPromotion: null,
};

const TIER_KEYS = ["go", "sat", "dong", "bac", "vang", "bk", "kc", "ct"]; // = src/domain/student-tier/tiers TIER_KEYS
const SEATS = [7, 15, 22, 26, 25, 17, 12, 4];
const DONG_MIN = [905, 990, 1085, 1185, 1325];
export const tierTable = TIER_KEYS.map((tierKey, i) => ({
  tierKey, share: "", seats: SEATS[i],
  divisions: tierKey === "ct"
    ? [{ division: null, rankFrom: 1, rankTo: 4, minXp: 8795 }]
    : [5, 4, 3, 2, 1].map((division, d) => ({
      division, rankFrom: tierKey === "dong" ? [103, 99, 95, 90, 85][d] : 1, rankTo: tierKey === "dong" ? [106, 102, 98, 94, 89][d] : 1,
      minXp: tierKey === "dong" ? DONG_MIN[d] : 100 * (i + 1) + d,
    })),
}));

export const myFrames = {
  selected: "dong",
  frames: TIER_KEYS.map((tierKey) => ({ tierKey, unlocked: tierKey === "dong", unlockedAt: tierKey === "dong" ? "2026-09-07" : null, schoolYear: "2026-2027", studentsToPass: null })),
};

/** GraphQL operationName -> response `data`. Anything absent falls through to the shared smoke network. */
export const graphQlFixtures: Record<string, unknown> = {
  ElearningStudentDashboard: { elearning: { studentDashboard: dashboard } },
  ElearningStudentClassLeaderboard: { elearning: { studentClassLeaderboard: leaderboard } },
  ElearningMyTier: { elearning: { myTier } },
  ElearningTierTable: { elearning: { tierTable } },
  ElearningMyFrames: { elearning: { myFrames } },
};

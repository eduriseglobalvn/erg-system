// Sample student of the design canvas (Nguyen Minh Anh, 7A). Numbers copied from docs/design/student-portal/source/*.html.
// Rows 5-10 of the class board and the minXp of non-Dong tiers are NOT in the sources we parsed: placeholders, marked below.
export const DESIGN_NOW = "2026-11-12T16:00:00+07:00";
/** Clock of the level-up artboards H16/H16m (Monday after the week closes). */
export const LEVEL_UP_NOW = "2026-11-16T07:00:00+07:00";

// Assignment board of the canvas (H10/H09/H11 sources + gen-tabs.js): 4 todo, 5 handed in, 2 overdue. Dates are +07:00.
const asg = (id: string, o: Record<string, unknown>) => ({
  id, quizId: `quiz-${id}`, status: "not_started", scorePercent: null, submittedAt: null, answeredCount: null, score: null, maxScore: null,
  attemptCount: 0, onTime: null, minutesBeforeDue: null, xpReward: 0, closed: false, kind: "PRACTICE", teacherName: "cô Trần Thị Hạnh", ...o,
});
const done = (id: string, title: string, subjectName: string, q: number, at: string, before: number, pct: number, score: number, max: number, tries: number, kind = "PRACTICE") =>
  asg(id, { title, subjectName, questionCount: q, totalQuestions: q, status: "submitted", submittedAt: at, dueAt: new Date(Date.parse(at) + before * 60_000).toISOString(), scorePercent: pct, score, maxScore: max, attemptCount: tries, onTime: true, minutesBeforeDue: before, kind });
export const assignments = [
  asg("a1", { title: "Luyện tập: Phương trình bậc nhất một ẩn", subjectName: "Toán", questionCount: 20, totalQuestions: 20, estimatedMinutes: 15, status: "in_progress", answeredCount: 12, dueAt: "2026-11-12T20:00:00+07:00", xpReward: 50, attemptCount: 1 }),
  asg("a2", { title: "Kiểm tra 15 phút: Đơn thức", subjectName: "Toán", questionCount: 10, totalQuestions: 10, estimatedMinutes: 15, kind: "TEST", dueAt: "2026-11-12T20:00:00+07:00", xpReward: 40 }),
  asg("a3", { title: "Trắc nghiệm: Từ loại tiếng Việt", subjectName: "Ngữ văn", questionCount: 10, totalQuestions: 10, dueAt: "2026-11-13T21:00:00+07:00", xpReward: 30 }),
  asg("a4", { title: "Unit 4 · Vocabulary quiz", subjectName: "Tiếng Anh", questionCount: 25, totalQuestions: 25, estimatedMinutes: 10, dueAt: "2026-11-16T20:00:00+07:00", xpReward: 25 }),
  done("d1", "Unit 4 · Vocabulary quiz", "Tiếng Anh", 20, "2026-11-11T20:14:00+07:00", 5760, 95, 95, 100, 1),
  done("d2", "Luyện tập: Phương trình bậc nhất", "Toán", 22, "2026-11-10T19:02:00+07:00", 60, 72.5, 72.5, 100, 2),
  done("d3", "Trắc nghiệm: Từ loại tiếng Việt", "Ngữ văn", 25, "2026-11-09T21:40:00+07:00", 20, 68, 6.8, 10, 1),
  done("d4", "KHTN: Nguyên tử và phân tử", "KHTN", 25, "2026-11-08T15:30:00+07:00", 2880, 52, 13, 25, 1),
  done("d5", "Kiểm tra 15 phút: Đơn thức", "Toán", 20, "2026-11-07T08:15:00+07:00", 5, 45, 45, 100, 1, "TEST"),
  asg("o1", { title: "KHTN: Nguyên tử và phân tử", subjectName: "KHTN", teacherName: "thầy Lê Văn Nam", questionCount: 25, totalQuestions: 25, dueAt: "2026-11-10T21:00:00+07:00", xpReward: 30 }),
  asg("o2", { title: "Kiểm tra 15 phút: Phân số", subjectName: "Toán", kind: "TEST", questionCount: 10, totalQuestions: 10, dueAt: "2026-11-07T08:00:00+07:00", closed: true }),
];

export const dashboard = {
  tenantId: "tenant-smoke",
  viewer: { userId: "elearning-smoke-user", tenantId: "tenant-smoke", accountType: "STUDENT", accessLevel: "LEARNER" },
  profile: {
    userId: "elearning-smoke-user", studentId: "student-smoke", studentCode: "STU-001", fullName: "Nguyễn Minh Anh",
    email: "minhanh@example.test", schoolId: "school-smoke", academicClassId: "class-7a", status: "ACTIVE",
    updatedAt: "2026-11-12T00:00:00Z", leaderboardEnabled: true,
  },
  summary: {
    enrolledCourseCount: 1, activeAssignmentCount: 3, pendingActionCount: 3, generatedAt: DESIGN_NOW,
    scoreSummary: { completedAttemptCount: 9, attemptedAssignmentCount: 9, passedAttemptCount: 8, averagePercent: 72.5, bestPercent: 95 },
  },
  courses: [], assignments, nextActions: [], announcements: [],
};

const row = (rank: number, studentName: string, xp: number, streakDays: number, extra: object = {}) => ({
  rank, studentId: `s-${rank}`, studentName, xp, streakDays, rankChange: 0, isViewer: false, rankDelta: 0,
  submittedInPeriod: 2, xpToday: 0, tierKey: "dong", division: 2, frameKey: null, hidden: false, ...extra,
});

// Week board: top rows copied from H08 / H03b (gen-mobile.js); ranks 11-32 are filler (the canvas shows "Hiện 10 / 32").
const WEEK: [string, number, number, number, string][] = [
  ["Khánh Thy", 512, 15, 0, "dong"], ["Đức Huy", 486, 9, 0, "dong"], ["Gia Bảo", 420, 6, 0, "dong"], ["Minh Anh", 380, 12, 2, "dong"],
  ["Thảo Linh", 362, 9, -1, "vang"], ["Quang Hải", 318, 4, 3, "vang"], ["Ngọc Vy", 296, 15, 0, "bac"], ["Tuấn Kiệt", 241, 2, -2, "dong"],
  ["Phương Anh", 198, 5, 1, "dong"], ["Bảo Ngọc", 150, 1, 0, "dong"],
];
const weekEntries = [
  ...WEEK.map(([name, xp, streak, delta, tierKey], i) => row(i + 1, name, xp, streak, {
    isViewer: i === 3, rankDelta: delta, rankChange: delta, tierKey, xpToday: i === 1 ? 120 : 0,
  })),
  ...Array.from({ length: 22 }, (_, i) => row(11 + i, `Bạn lớp ${11 + i}`, 140 - 6 * i, 1)),
];

// Course board of H14: 14 students, tier by course XP (design tiers.js), "Hiện 14 / 32".
const TIER_MIN: [string, number][] = [["ct", 9000], ["kc", 6000], ["bk", 4000], ["vang", 2500], ["bac", 1500], ["dong", 800], ["sat", 300], ["go", 0]];
const COURSE: [string, number, number, number][] = [
  ["Khánh Thy", 9420, 15, 0], ["Đức Huy", 6880, 9, 1], ["Gia Bảo", 4310, 6, -1], ["Thảo Linh", 2900, 9, 0], ["Quang Hải", 2620, 4, 2], ["Ngọc Vy", 1720, 15, 0],
  ["Minh Anh", 1240, 12, 2], ["Tuấn Kiệt", 1010, 2, -1], ["Lan Chi", 860, 7, 1], ["Phương Anh", 640, 5, 0], ["Bảo Ngọc", 420, 1, -2],
  ["Bạn ẩn tên", 310, 3, 0], ["Hoàng Minh", 180, 0, 0], ["Đăng Khoa", 90, 1, 1],
];
// Division inside the tier, as printed in the H14 canvas (rank order).
const DIVISIONS = [null, 4, 5, 4, 5, 4, 2, 4, 5, 2, 4, 5, 2, 4];
const courseEntries = COURSE.map(([name, xp, streak, delta], i) => {
  const tierKey = TIER_MIN.find(([, min]) => xp >= min)![0];
  const hidden = name === "Bạn ẩn tên";
  return row(i + 1, name, xp, streak, { isViewer: name === "Minh Anh", rankDelta: delta, rankChange: delta, tierKey, division: DIVISIONS[i], frameKey: hidden ? null : tierKey, hidden });
});

export const leaderboard = {
  classId: "class-7a", className: "7A", enabled: true, period: "WEEK", scope: "CLASS",
  // Canvas countdown "2 ngày 14 giờ 32 phút" contradicts its own week label (10/11-16/11) and clock; the label wins, countdown is reported as a design inconsistency.
  periodEndsAt: "2026-11-16T23:59:59+07:00", viewerHidden: false,
  me: { rank: 4, size: 32, xp: 380, gradeRank: 12, gradeSize: 128, xpToNextRank: 40, nextRankName: "Gia Bảo" },
  entries: weekEntries,
};

export const courseLeaderboard = {
  ...leaderboard, period: "COURSE", periodEndsAt: null,
  me: { rank: 7, size: 32, xp: 1240, gradeRank: 92, gradeSize: 128, xpToNextRank: 85, nextRankName: "Tuấn Kiệt" },
  entries: courseEntries,
};

export const myTier = {
  tierKey: "dong", division: 2, gradeRank: 92, gradeSize: 128, courseXp: 1240, eligible: true, submittedCount: 9, protected: false,
  nextDivision: { tierKey: "dong", division: 1, minXp: 1325, studentsToPass: 3 },
  nextTier: { tierKey: "bac", division: 5, minXp: 1480, studentsToPass: 8 },
  pendingPromotion: null,
};

const TIER_KEYS = ["go", "sat", "dong", "bac", "vang", "bk", "kc", "ct"]; // = src/domain/student-tier/tiers TIER_KEYS
// Tier table of H18, computed once with docs/design/student-portal/generators/gen-extra.js (xpAt curve, grade of 128). [tier, seats, [division, rankFrom, rankTo, minXp][]]
const TABLE: [string, number, [number | null, number, number, number][]][] = [
  ["ct", 4, [[null, 1, 4, 8795]]],
  ["kc", 12, [[1, 5, 7, 8225], [2, 8, 10, 7695], [3, 11, 12, 7360], [4, 13, 14, 7035], [5, 15, 16, 6730]]],
  ["bk", 17, [[1, 17, 20, 6155], [2, 21, 24, 5630], [3, 25, 27, 5270], [4, 28, 30, 4930], [5, 31, 33, 4610]]],
  ["vang", 25, [[1, 34, 38, 4125], [2, 39, 43, 3690], [3, 44, 48, 3300], [4, 49, 53, 2950], [5, 54, 58, 2640]]],
  ["bac", 26, [[1, 59, 64, 2310], [2, 65, 69, 2065], [3, 70, 74, 1850], [4, 75, 79, 1655], [5, 80, 84, 1480]]],
  ["dong", 22, [[1, 85, 89, 1325], [2, 90, 94, 1185], [3, 95, 98, 1085], [4, 99, 102, 990], [5, 103, 106, 905]]],
  ["sat", 15, [[1, 107, 109, 780], [2, 110, 112, 660], [3, 113, 115, 535], [4, 116, 118, 410], [5, 119, 121, 290]]],
  ["go", 7, [[1, 122, 123, 205], [2, 124, 125, 125], [3, 126, 126, 80], [4, 127, 127, 40], [5, 128, 128, 0]]],
];
export const tierTable = TABLE.map(([tierKey, seats, divisions]) => ({
  tierKey, share: "", seats, divisions: divisions.map(([division, rankFrom, rankTo, minXp]) => ({ division, rankFrom, rankTo, minXp })),
}));

export const myFrames = {
  selected: "dong",
  frames: TIER_KEYS.map((tierKey) => ({ tierKey, unlocked: tierKey === "dong", unlockedAt: tierKey === "dong" ? "2026-09-07" : null, schoolYear: "2026-2027", studentsToPass: null })),
};

/** Leaderboard variant by request input: the full-board page reads the course board. */
export const leaderboardFor = (period: string | undefined) => (period === "COURSE" ? courseLeaderboard : leaderboard);

/** GraphQL operationName -> response `data`. Anything absent falls through to the shared smoke network. */
export const graphQlFixtures: Record<string, unknown> = {
  ElearningStudentDashboard: { elearning: { studentDashboard: dashboard } },
  
  ElearningMyTier: { elearning: { myTier } },
  ElearningTierTable: { elearning: { tierTable } },
  ElearningMyFrames: { elearning: { myFrames } },
};

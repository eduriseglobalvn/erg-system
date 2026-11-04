import { describe, expect, test } from "vitest";

import { seoCrmWorkspaceQueryOptions } from "@/features/crm/seo/api/seo-crm-query";
import { studentDashboardQueryOptions } from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import { studentDiscussionFeedQueryOptions } from "@/features/elearning/student-dashboard/api/student-engagement-query";
import { attendanceQueryOptions, gradebookQueryOptions } from "@/features/lms/api/lms-academic-record-query";
import { lmsAssignmentReadQueryKeys, lmsReadPersistMeta, lmsStudentGroupsQueryOptions } from "@/features/lms/api/lms-assignment-command-query";
import { questionBankQueryKeys } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { quizEditorQueryKeys } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { quizRuntimeQueryKeys } from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-query";
import { notificationQueryKeys } from "@/features/notifications/api/notification-query";
import { shouldDehydratePersistedQuery } from "@/lib/query-persistence";
import { QUERY_POLICIES } from "@/lib/query-policy";

const T = "tenant-a";
const A = "account-a";
type Built = { queryKey: readonly unknown[]; meta?: Record<string, unknown>; gcTime?: number };
const attendance = (accountId: string) => attendanceQueryOptions({ accountId, classId: "c", from: "2026-01-01", subjectId: "s", tenantId: T, to: "2026-01-02" });
const gradebook = (accountId: string) => gradebookQueryOptions({ accountId, classId: "c", subjectId: "s", tenantId: T });
// Inline useQuery sites in components build their meta with lmsReadPersistMeta(...) next to the matching key factory.
const classWs = (accountId: string): Built => ({
  queryKey: lmsAssignmentReadQueryKeys.classWorkspace({ accountId, classId: "c", schoolId: "sc", tenantId: T, usage: "class-management" }),
  meta: lmsReadPersistMeta(T, accountId),
});
const progress = (accountId: string): Built => ({ queryKey: lmsAssignmentReadQueryKeys.assignmentProgress("asg", T, accountId), meta: lmsReadPersistMeta(T, accountId) });
const homework = (accountId: string): Built => ({ queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace(T, accountId), meta: lmsReadPersistMeta(T, accountId) });
const unmarked = (queryKey: readonly unknown[]): Built => ({ queryKey });

// Pins the persisted set (unchanged since the key-parsing era): real query options/key factories and whether they persist.
const cases: Array<[string, Built, boolean]> = [
  ["student-dashboard", studentDashboardQueryOptions({ accountId: A, tenantId: T }), true],
  ["student-dashboard anonymous", studentDashboardQueryOptions({ accountId: null, tenantId: T }), false],
  ["student-engagement feed", studentDiscussionFeedQueryOptions({ accountId: A, tenantId: T }), true],
  ["student-engagement feed anonymous", studentDiscussionFeedQueryOptions({ tenantId: T }), false],
  ["crm workspace", seoCrmWorkspaceQueryOptions({ accountId: A, tenantId: T }), true],
  ["crm workspace anonymous", seoCrmWorkspaceQueryOptions({ accountId: "", tenantId: T }), false],
  ["lms attendance", attendance(A), true],
  ["lms attendance anonymous", attendance("anonymous"), false],
  ["lms gradebook", gradebook(A), true],
  ["lms gradebook anonymous", gradebook(""), false],
  ["lms class-workspace", classWs(A), true],
  ["lms class-workspace anonymous", classWs("anonymous"), false],
  ["lms student-groups", lmsStudentGroupsQueryOptions(T, "c", { accountId: A }), true],
  ["lms student-groups anonymous", lmsStudentGroupsQueryOptions(T, "c", { accountId: "anonymous" }), false],
  ["lms assignment-progress", progress(A), true],
  ["lms assignment-progress anonymous", progress("anonymous"), false],
  ["lms teacher homework", homework(A), true],
  ["lms teacher homework anonymous", homework("anonymous"), false],
  ["question bank", unmarked(questionBankQueryKeys.workspace(T)), false],
  ["quiz editor draft", unmarked(quizEditorQueryKeys.draft("q", T)), false],
  ["quiz runtime package", unmarked(quizRuntimeQueryKeys.package("elearning", "q", T)), false],
  ["notification unread", unmarked(notificationQueryKeys.unreadCount("lms", { accountId: A, tenantId: T } as never)), false],
];

describe("persisted query set", () => {
  test.each(cases)("%s", (_name, built, expected) => {
    expect(shouldDehydratePersistedQuery({ meta: built.meta, state: { status: "success" } } as never)).toBe(expected);
    expect(shouldDehydratePersistedQuery({ meta: built.meta, state: { status: "pending" } } as never)).toBe(false);
    // Persisted queries must outlive the 24h persistence maxAge, otherwise they are GC'd before restore.
    if (expected && built.gcTime !== undefined) expect(built.gcTime).toBeGreaterThanOrEqual(QUERY_POLICIES.offlineCore.gcTime);
  });
});

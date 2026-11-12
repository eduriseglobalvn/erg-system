/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type AttendanceWorkspaceInput = {
  readonly classId: string;
  readonly from?: string | null | undefined;
  readonly schoolId?: string | null | undefined;
  readonly subjectId: string;
  readonly tenantId?: string | null | undefined;
  readonly to?: string | null | undefined;
};

export type ClassLeaderboardInput = {
  readonly classId: string;
  readonly period?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type CreateStudentDiscussionInput = {
  readonly assignmentId?: string | null | undefined;
  readonly attachmentIds?: ReadonlyArray<string> | null | undefined;
  readonly content: string;
  readonly idempotencyKey: string;
  readonly tenantId?: string | null | undefined;
  readonly title: string;
};

export type DeleteStudentDiscussionItemInput = {
  readonly targetId: string;
  readonly targetType: string;
  readonly tenantId?: string | null | undefined;
};

export type GradebookWorkspaceInput = {
  readonly classId: string;
  readonly schoolId?: string | null | undefined;
  readonly subjectId: string;
  readonly tenantId?: string | null | undefined;
};

export type MarkStudentAnnouncementReadInput = {
  readonly announcementId: string;
  readonly tenantId?: string | null | undefined;
};

export type ReplyStudentDiscussionInput = {
  readonly attachmentIds?: ReadonlyArray<string> | null | undefined;
  readonly content: string;
  readonly idempotencyKey: string;
  readonly parentCommentId?: string | null | undefined;
  readonly postId: string;
  readonly tenantId?: string | null | undefined;
};

export type SetClassLeaderboardEnabledInput = {
  readonly classId: string;
  readonly enabled: boolean;
  readonly tenantId?: string | null | undefined;
};

export type SetMyLeaderboardHiddenInput = {
  readonly hidden: boolean;
  readonly tenantId?: string | null | undefined;
};

export type SetStudentDiscussionHiddenInput = {
  readonly hidden: boolean;
  readonly targetId: string;
  readonly targetType: string;
  readonly tenantId?: string | null | undefined;
};

export type SetStudentDiscussionReactionInput = {
  readonly reaction: string;
  readonly targetId: string;
  readonly targetType: string;
  readonly tenantId?: string | null | undefined;
};

/** period: WEEK (default), MONTH or TERM. scope: CLASS (default) or GRADE. */
export type StudentClassLeaderboardInput = {
  readonly classId?: string | null | undefined;
  readonly period?: string | null | undefined;
  readonly scope?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type StudentDashboardInput = {
  readonly classId?: string | null | undefined;
  readonly studentUserId?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type StudentDiscussionFeedInput = {
  readonly page?: number | null | undefined;
  readonly size?: number | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type StudentDiscussionModerationFeedInput = {
  readonly classId: string;
  readonly page?: number | null | undefined;
  readonly size?: number | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type UpsertAttendanceInput = {
  readonly attendanceDate: string;
  readonly classId: string;
  readonly expectedVersion?: number | null | undefined;
  readonly idempotencyKey?: string | null | undefined;
  readonly lessonIndex: number;
  readonly operationId?: string | null | undefined;
  readonly schoolId?: string | null | undefined;
  readonly status: string;
  readonly studentId: string;
  readonly subjectId: string;
  readonly tenantId?: string | null | undefined;
};

export type UpsertGradebookScoreInput = {
  readonly classId: string;
  readonly columnId: string;
  readonly expectedVersion?: number | null | undefined;
  readonly idempotencyKey?: string | null | undefined;
  readonly kind: string;
  readonly label: string;
  readonly maxScore: number;
  readonly operationId?: string | null | undefined;
  readonly position?: number | null | undefined;
  readonly schoolId?: string | null | undefined;
  readonly score: number;
  readonly studentId: string;
  readonly subjectId: string;
  readonly tenantId?: string | null | undefined;
};

export type ElearningStudentClassLeaderboardQueryVariables = Exact<{
  input?: StudentClassLeaderboardInput | null | undefined;
}>;


export type ElearningStudentClassLeaderboardQuery = { readonly elearning: { readonly studentClassLeaderboard: { readonly classId: string, readonly className: string | null, readonly enabled: boolean, readonly period: string, readonly scope: string, readonly periodEndsAt: string, readonly viewerHidden: boolean, readonly entries: ReadonlyArray<{ readonly rank: number | null, readonly studentId: string, readonly studentName: string | null, readonly xp: number, readonly streakDays: number, readonly rankChange: number | null, readonly isViewer: boolean }> } } };

export type ElearningLeaderboardClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type ElearningLeaderboardClassesQuery = { readonly elearning: { readonly leaderboardClasses: ReadonlyArray<{ readonly id: string, readonly name: string | null, readonly leaderboardEnabled: boolean }> } };

export type ElearningClassLeaderboardQueryVariables = Exact<{
  input: ClassLeaderboardInput;
}>;


export type ElearningClassLeaderboardQuery = { readonly elearning: { readonly classLeaderboard: { readonly classId: string, readonly className: string | null, readonly enabled: boolean, readonly period: string, readonly scope: string, readonly periodEndsAt: string, readonly viewerHidden: boolean, readonly entries: ReadonlyArray<{ readonly rank: number | null, readonly studentId: string, readonly studentName: string | null, readonly xp: number, readonly streakDays: number, readonly rankChange: number | null, readonly isViewer: boolean }> } } };

export type ElearningSetClassLeaderboardEnabledMutationVariables = Exact<{
  input: SetClassLeaderboardEnabledInput;
}>;


export type ElearningSetClassLeaderboardEnabledMutation = { readonly setClassLeaderboardEnabled: { readonly id: string, readonly name: string | null, readonly leaderboardEnabled: boolean } };

export type ElearningSetMyLeaderboardHiddenMutationVariables = Exact<{
  input: SetMyLeaderboardHiddenInput;
}>;


export type ElearningSetMyLeaderboardHiddenMutation = { readonly setMyLeaderboardHidden: boolean };

export type ElearningDiscussionModerationClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type ElearningDiscussionModerationClassesQuery = { readonly elearning: { readonly discussionModerationClasses: ReadonlyArray<{ readonly id: string, readonly name: string | null }> } };

export type ElearningDiscussionModerationFeedQueryVariables = Exact<{
  input: StudentDiscussionModerationFeedInput;
}>;


export type ElearningDiscussionModerationFeedQuery = { readonly elearning: { readonly discussionModerationFeed: { readonly page: number, readonly size: number, readonly totalItems: number, readonly hasNext: boolean, readonly items: ReadonlyArray<{ readonly id: string, readonly authorName: string | null, readonly authorInitials: string | null, readonly title: string | null, readonly content: string | null, readonly createdAt: string | null, readonly hidden: boolean, readonly comments: ReadonlyArray<{ readonly id: string, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly hidden: boolean, readonly replies: ReadonlyArray<{ readonly id: string, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly hidden: boolean }> }> }> } } };

export type ElearningSetStudentDiscussionHiddenMutationVariables = Exact<{
  input: SetStudentDiscussionHiddenInput;
}>;


export type ElearningSetStudentDiscussionHiddenMutation = { readonly setStudentDiscussionHidden: { readonly targetType: string, readonly targetId: string, readonly hidden: boolean, readonly deleted: boolean } };

export type ElearningDeleteStudentDiscussionItemMutationVariables = Exact<{
  input: DeleteStudentDiscussionItemInput;
}>;


export type ElearningDeleteStudentDiscussionItemMutation = { readonly deleteStudentDiscussionItem: { readonly targetType: string, readonly targetId: string, readonly hidden: boolean, readonly deleted: boolean } };

export type ElearningStudentDashboardQueryVariables = Exact<{
  input?: StudentDashboardInput | null | undefined;
}>;


export type ElearningStudentDashboardQuery = { readonly elearning: { readonly studentDashboard: { readonly tenantId: string, readonly viewer: { readonly userId: string, readonly tenantId: string, readonly accountType: string | null, readonly accessLevel: string | null }, readonly profile: { readonly userId: string, readonly studentId: string | null, readonly studentCode: string | null, readonly fullName: string | null, readonly email: string | null, readonly schoolId: string | null, readonly academicClassId: string | null, readonly status: string | null, readonly updatedAt: string | null, readonly leaderboardEnabled: boolean }, readonly summary: { readonly enrolledCourseCount: number, readonly activeAssignmentCount: number, readonly pendingActionCount: number, readonly generatedAt: string, readonly scoreSummary: { readonly completedAttemptCount: number, readonly attemptedAssignmentCount: number, readonly passedAttemptCount: number, readonly averagePercent: number, readonly bestPercent: number } }, readonly courses: ReadonlyArray<{ readonly id: string, readonly title: string, readonly status: string | null, readonly progressPercent: number, readonly updatedAt: string | null }>, readonly assignments: ReadonlyArray<{ readonly id: string, readonly quizId: string | null, readonly title: string, readonly status: string | null, readonly dueAt: string | null, readonly scorePercent: number | null, readonly submittedAt: string | null }>, readonly nextActions: ReadonlyArray<{ readonly id: string, readonly kind: string, readonly label: string, readonly targetId: string | null, readonly dueAt: string | null }>, readonly announcements: ReadonlyArray<{ readonly id: string, readonly title: string, readonly content: string | null, readonly pinned: boolean, readonly publishedAt: string | null, readonly updatedAt: string | null }> } } };

export type ElearningStudentDiscussionFeedQueryVariables = Exact<{
  input?: StudentDiscussionFeedInput | null | undefined;
}>;


export type ElearningStudentDiscussionFeedQuery = { readonly elearning: { readonly discussionFeed: { readonly page: number, readonly size: number, readonly totalItems: number, readonly hasNext: boolean, readonly items: ReadonlyArray<{ readonly id: string, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly academicClassId: string | null, readonly className: string | null, readonly title: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly assignmentId: string | null, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly comments: ReadonlyArray<{ readonly id: string, readonly parentId: string | null, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly replies: ReadonlyArray<{ readonly id: string, readonly parentId: string | null, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }> }> }> }> } } };

export type ElearningCreateStudentDiscussionMutationVariables = Exact<{
  input: CreateStudentDiscussionInput;
}>;


export type ElearningCreateStudentDiscussionMutation = { readonly createStudentDiscussion: { readonly id: string, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly academicClassId: string | null, readonly className: string | null, readonly title: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly assignmentId: string | null, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly comments: ReadonlyArray<{ readonly id: string }> } };

export type ElearningReplyStudentDiscussionMutationVariables = Exact<{
  input: ReplyStudentDiscussionInput;
}>;


export type ElearningReplyStudentDiscussionMutation = { readonly replyStudentDiscussion: { readonly id: string, readonly parentId: string | null, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly replies: ReadonlyArray<{ readonly id: string }> } };

export type ElearningSetStudentDiscussionReactionMutationVariables = Exact<{
  input: SetStudentDiscussionReactionInput;
}>;


export type ElearningSetStudentDiscussionReactionMutation = { readonly setStudentDiscussionReaction: { readonly targetType: string, readonly targetId: string, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }> } };

export type ElearningMarkStudentAnnouncementReadMutationVariables = Exact<{
  input: MarkStudentAnnouncementReadInput;
}>;


export type ElearningMarkStudentAnnouncementReadMutation = { readonly markStudentAnnouncementRead: { readonly announcementId: string, readonly read: boolean, readonly readAt: string } };

export type LmsAttendanceWorkspaceQueryVariables = Exact<{
  input: AttendanceWorkspaceInput;
}>;


export type LmsAttendanceWorkspaceQuery = { readonly lms: { readonly attendanceWorkspace: { readonly tenantId: string, readonly classId: string, readonly subjectId: string, readonly from: string, readonly to: string, readonly records: ReadonlyArray<{ readonly id: string, readonly studentId: string, readonly subjectId: string, readonly attendanceDate: string, readonly lessonIndex: number, readonly status: string, readonly version: number, readonly updatedAt: string }> } } };

export type LmsGradebookWorkspaceQueryVariables = Exact<{
  input: GradebookWorkspaceInput;
}>;


export type LmsGradebookWorkspaceQuery = { readonly lms: { readonly gradebookWorkspace: { readonly tenantId: string, readonly classId: string, readonly subjectId: string, readonly columns: ReadonlyArray<{ readonly id: string, readonly label: string, readonly maxScore: number, readonly kind: string, readonly position: number, readonly version: number, readonly updatedAt: string }>, readonly scores: ReadonlyArray<{ readonly studentId: string, readonly columnId: string, readonly score: number, readonly maxScore: number, readonly version: number, readonly updatedAt: string }> } } };

export type LmsUpsertAttendanceMutationVariables = Exact<{
  input: UpsertAttendanceInput;
}>;


export type LmsUpsertAttendanceMutation = { readonly upsertAttendance: { readonly id: string, readonly studentId: string, readonly subjectId: string, readonly attendanceDate: string, readonly lessonIndex: number, readonly status: string, readonly version: number, readonly updatedAt: string } };

export type LmsUpsertGradebookScoreMutationVariables = Exact<{
  input: UpsertGradebookScoreInput;
}>;


export type LmsUpsertGradebookScoreMutation = { readonly upsertGradebookScore: { readonly studentId: string, readonly columnId: string, readonly score: number, readonly maxScore: number, readonly version: number, readonly updatedAt: string } };

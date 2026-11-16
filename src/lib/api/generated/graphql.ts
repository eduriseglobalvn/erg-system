/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** questionIndex is 1-based. questionPrompt and studentAnswerText are what the student saw; the correct answer is added server-side. */
export type AskTeacherAboutQuestionInput = {
  readonly assignmentId: string;
  readonly attachmentIds?: ReadonlyArray<string> | null | undefined;
  readonly idempotencyKey: string;
  readonly message: string;
  readonly questionIndex: number;
  readonly questionPrompt?: string | null | undefined;
  readonly studentAnswerText?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

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
  readonly subject?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
  readonly title: string;
};

export type DeleteStudentDiscussionItemInput = {
  readonly targetId: string;
  readonly targetType: string;
  readonly tenantId?: string | null | undefined;
};

export type EditTeachingScheduleSlotInput = {
  readonly assistantId?: string | number | null | undefined;
  readonly dryRun?: boolean | null | undefined;
  readonly eventId: string | number;
  readonly expectedVersion?: number | null | undefined;
  readonly newDate?: string | null | undefined;
  readonly periodNo?: number | null | undefined;
  readonly reason?: string | null | undefined;
  readonly removeAssistant?: boolean | null | undefined;
  readonly roomId?: string | number | null | undefined;
  readonly scope: TeachingScheduleChangeScopeInput;
  readonly subjectId?: string | number | null | undefined;
};

export type FollowStudentDiscussionInput = {
  readonly follow: boolean;
  readonly postId: string;
  readonly tenantId?: string | null | undefined;
};

export type GradebookWorkspaceInput = {
  readonly classId: string;
  readonly schoolId?: string | null | undefined;
  readonly subjectId: string;
  readonly tenantId?: string | null | undefined;
};

export type LessonLogStatus =
  | 'CONFIRMED'
  | 'PENDING';

export type LessonReportState =
  | 'LATE'
  | 'MISSING'
  | 'NONE'
  | 'ON_TIME';

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

export type SaveSchoolPeriodTimesInput = {
  readonly effectiveFrom: string;
  readonly name: string;
  readonly schoolId: string | number;
  readonly slots: ReadonlyArray<TeachingPeriodSlotInput>;
};

export type SaveTeachingScheduleDraftInput = {
  readonly applyFrom: string;
  readonly batchId?: string | number | null | undefined;
  readonly expectedVersion?: number | null | undefined;
  readonly levelId?: string | number | null | undefined;
  readonly periodTemplateId: string | number;
  readonly repeatUntil: string;
  readonly rows: ReadonlyArray<TeachingScheduleDraftRowInput>;
  readonly schoolId: string | number;
  readonly subjectId?: string | number | null | undefined;
};

export type SendQuestionThreadMessageInput = {
  readonly attachmentIds?: ReadonlyArray<string> | null | undefined;
  readonly message: string;
  readonly tenantId?: string | null | undefined;
  readonly threadId: string;
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

/** period: WEEK (default), MONTH, TERM (teachers/admins) or COURSE (the school year, 1 Sep - 31 Aug). scope: CLASS (default) or GRADE. */
export type StudentClassLeaderboardInput = {
  readonly classId?: string | null | undefined;
  readonly period?: string | null | undefined;
  readonly scope?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type StudentDashboardInput = {
  /** How many assignments to return, oldest due first: default 50, at most 500 */
  readonly assignmentLimit?: number | null | undefined;
  readonly classId?: string | null | undefined;
  readonly studentUserId?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

/** filter: ALL (default), UNANSWERED (no reply yet) or MINE. subject narrows by the subject chip. */
export type StudentDiscussionFeedInput = {
  readonly filter?: string | null | undefined;
  readonly page?: number | null | undefined;
  readonly size?: number | null | undefined;
  readonly subject?: string | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type StudentDiscussionModerationFeedInput = {
  readonly classId: string;
  readonly page?: number | null | undefined;
  readonly size?: number | null | undefined;
  readonly tenantId?: string | null | undefined;
};

export type SwapTeachingScheduleTeacherInput = {
  readonly dryRun?: boolean | null | undefined;
  readonly eventId: string | number;
  readonly expectedVersion?: number | null | undefined;
  readonly newTeacherId: string | number;
  readonly note?: string | null | undefined;
  readonly reason?: TeachingScheduleSwapReason | null | undefined;
  readonly scope: TeachingScheduleChangeScopeInput;
};

export type TeachingAccessState =
  | 'EXISTING'
  | 'NEW'
  | 'REVOKE';

export type TeachingHolidayKind =
  | 'COMPANY'
  | 'COMPENSATORY'
  | 'STATE';

export type TeachingPeriodSlotInput = {
  readonly endTime?: string | null | undefined;
  readonly periodNo: number;
  readonly session: TeachingSession;
  readonly startTime?: string | null | undefined;
};

export type TeachingScheduleChangeScopeInput = {
  readonly dates?: ReadonlyArray<string> | null | undefined;
  readonly kind: TeachingScheduleChangeScopeKind;
};

export type TeachingScheduleChangeScopeKind =
  | 'FROM_DATE_TO_END'
  | 'SELECTED_DATES'
  | 'THIS_ONLY';

export type TeachingScheduleConflictKind =
  | 'CLASS_TIME'
  | 'ROOM_TIME'
  | 'TEACHER_ON_LEAVE'
  | 'TEACHER_TIME'
  | 'TRAVEL_TIME';

export type TeachingScheduleDraftRowInput = {
  readonly assistantId?: string | number | null | undefined;
  readonly classId: string | number;
  readonly clientRowId: string;
  readonly eventId?: string | number | null | undefined;
  readonly newRoomName?: string | null | undefined;
  readonly note?: string | null | undefined;
  readonly periodNo: number;
  readonly roomId?: string | number | null | undefined;
  readonly teacherId?: string | number | null | undefined;
  readonly weekday: number;
};

export type TeachingScheduleFixKind =
  | 'CHANGE_PREVIOUS_TEACHER'
  | 'CHANGE_ROOM'
  | 'CHANGE_TEACHER';

export type TeachingScheduleReuseInput = {
  readonly keepRoomAndAssistant: boolean;
  readonly mode: string;
  readonly repeatUntil?: string | null | undefined;
  readonly skipHolidays: boolean;
  readonly sourceSchoolId: string | number;
  readonly sourceWeekStart: string;
  readonly weekStarts?: ReadonlyArray<string> | null | undefined;
};

export type TeachingScheduleRole =
  | 'ASSISTANT'
  | 'MAIN';

export type TeachingScheduleSeverity =
  | 'ERROR'
  | 'WARNING';

export type TeachingScheduleStatus =
  | 'CANCELLED'
  | 'DRAFT'
  | 'PUBLISHED';

export type TeachingScheduleSwapReason =
  | 'REASSIGNMENT'
  | 'TEACHER_ON_LEAVE'
  | 'TIME_CONFLICT';

export type TeachingSession =
  | 'AFTERNOON'
  | 'EVENING'
  | 'MORNING';

export type TeachingSlotOptionState =
  | 'BUSY'
  | 'FREE'
  | 'LEAVE'
  | 'SUGGESTED'
  | 'TRAVEL';

export type UpdateLessonLogEntryInput = {
  readonly actualPeriod: number;
  readonly comment?: string | null | undefined;
  readonly date: string;
  readonly eventId: string | number;
  readonly expectedVersion?: number | null | undefined;
  readonly periodNo: number;
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

export type ClassLogPeriodFieldsFragment = { readonly eventId: string, readonly date: string, readonly periodNo: number, readonly classId: string, readonly className: string, readonly subjectName: string, readonly subjectId: string | null, readonly teacherName: string | null, readonly ppctPeriod: number, readonly actualPeriod: number, readonly lessonTitle: string | null, readonly comment: string | null, readonly status: LessonLogStatus, readonly late: boolean, readonly happened: boolean, readonly version: number, readonly curriculumPeriodCount: number | null, readonly absentees: ReadonlyArray<{ readonly studentId: string, readonly shortName: string, readonly excused: boolean }> };

export type ClassLogWeekFieldsFragment = { readonly weekStart: string, readonly weekEnd: string, readonly weekNo: number, readonly days: ReadonlyArray<{ readonly date: string, readonly session: string | null, readonly periods: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly classId: string, readonly className: string, readonly subjectName: string, readonly subjectId: string | null, readonly teacherName: string | null, readonly ppctPeriod: number, readonly actualPeriod: number, readonly lessonTitle: string | null, readonly comment: string | null, readonly status: LessonLogStatus, readonly late: boolean, readonly happened: boolean, readonly version: number, readonly curriculumPeriodCount: number | null, readonly absentees: ReadonlyArray<{ readonly studentId: string, readonly shortName: string, readonly excused: boolean }> }> }>, readonly stats: { readonly taught: number, readonly confirmed: number, readonly pending: number }, readonly lagChip: { readonly classId: string, readonly className: string, readonly lag: number } | null };

export type ClassLogTeacherWeekQueryVariables = Exact<{
  weekStart: string;
  session?: string | null | undefined;
  status?: LessonLogStatus | null | undefined;
}>;


export type ClassLogTeacherWeekQuery = { readonly lms: { readonly lessonLogTeacherWeek: { readonly weekStart: string, readonly weekEnd: string, readonly weekNo: number, readonly days: ReadonlyArray<{ readonly date: string, readonly session: string | null, readonly periods: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly classId: string, readonly className: string, readonly subjectName: string, readonly subjectId: string | null, readonly teacherName: string | null, readonly ppctPeriod: number, readonly actualPeriod: number, readonly lessonTitle: string | null, readonly comment: string | null, readonly status: LessonLogStatus, readonly late: boolean, readonly happened: boolean, readonly version: number, readonly curriculumPeriodCount: number | null, readonly absentees: ReadonlyArray<{ readonly studentId: string, readonly shortName: string, readonly excused: boolean }> }> }>, readonly stats: { readonly taught: number, readonly confirmed: number, readonly pending: number }, readonly lagChip: { readonly classId: string, readonly className: string, readonly lag: number } | null } } };

export type ClassLogClassWeekQueryVariables = Exact<{
  classId: string | number;
  weekStart: string;
}>;


export type ClassLogClassWeekQuery = { readonly lms: { readonly lessonLogClassWeek: { readonly weekStart: string, readonly weekEnd: string, readonly weekNo: number, readonly days: ReadonlyArray<{ readonly date: string, readonly session: string | null, readonly periods: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly classId: string, readonly className: string, readonly subjectName: string, readonly subjectId: string | null, readonly teacherName: string | null, readonly ppctPeriod: number, readonly actualPeriod: number, readonly lessonTitle: string | null, readonly comment: string | null, readonly status: LessonLogStatus, readonly late: boolean, readonly happened: boolean, readonly version: number, readonly curriculumPeriodCount: number | null, readonly absentees: ReadonlyArray<{ readonly studentId: string, readonly shortName: string, readonly excused: boolean }> }> }>, readonly stats: { readonly taught: number, readonly confirmed: number, readonly pending: number }, readonly lagChip: { readonly classId: string, readonly className: string, readonly lag: number } | null } } };

export type ClassLogChangesQueryVariables = Exact<{
  weekStart: string;
  classId?: string | number | null | undefined;
}>;


export type ClassLogChangesQuery = { readonly lms: { readonly lessonLogChanges: ReadonlyArray<{ readonly id: string, readonly at: string, readonly actorId: string, readonly actorName: string | null, readonly classId: string, readonly className: string, readonly date: string, readonly periodNo: number, readonly field: string, readonly oldValue: string | null, readonly newValue: string | null }> } };

export type ClassLogCurriculumQueryVariables = Exact<{
  classId: string | number;
  subjectId: string | number;
}>;


export type ClassLogCurriculumQuery = { readonly lms: { readonly lessonLogCurriculum: ReadonlyArray<{ readonly topic: string | null, readonly period: number, readonly title: string }> } };

export type ClassLogUpdateEntryMutationVariables = Exact<{
  input: UpdateLessonLogEntryInput;
}>;


export type ClassLogUpdateEntryMutation = { readonly updateLessonLogEntry: { readonly eventId: string, readonly date: string, readonly periodNo: number, readonly classId: string, readonly className: string, readonly subjectName: string, readonly subjectId: string | null, readonly teacherName: string | null, readonly ppctPeriod: number, readonly actualPeriod: number, readonly lessonTitle: string | null, readonly comment: string | null, readonly status: LessonLogStatus, readonly late: boolean, readonly happened: boolean, readonly version: number, readonly curriculumPeriodCount: number | null, readonly absentees: ReadonlyArray<{ readonly studentId: string, readonly shortName: string, readonly excused: boolean }> } };

export type ClassLogConfirmWeekMutationVariables = Exact<{
  weekStart: string;
}>;


export type ClassLogConfirmWeekMutation = { readonly confirmLessonLogWeek: { readonly taught: number, readonly confirmed: number, readonly pending: number } };

export type ClassLogLessonReportMatrixQueryVariables = Exact<{
  weekStart: string;
  schoolId?: string | number | null | undefined;
  subjectId?: string | number | null | undefined;
}>;


export type ClassLogLessonReportMatrixQuery = { readonly lms: { readonly lessonReportMatrix: { readonly weekStart: string, readonly days: ReadonlyArray<string>, readonly stats: { readonly periods: number, readonly teachers: number, readonly schools: number, readonly onTime: number, readonly late: number, readonly missing: number }, readonly rows: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly schoolName: string, readonly cells: ReadonlyArray<{ readonly date: string, readonly state: LessonReportState, readonly periods: number }> }> } } };

export type ClassLogRemindLessonReportMutationVariables = Exact<{
  teacherIds: ReadonlyArray<string | number> | string | number;
}>;


export type ClassLogRemindLessonReportMutation = { readonly remindLessonReport: number };

export type ElearningStudentClassLeaderboardQueryVariables = Exact<{
  input?: StudentClassLeaderboardInput | null | undefined;
}>;


export type ElearningStudentClassLeaderboardQuery = { readonly elearning: { readonly studentClassLeaderboard: { readonly classId: string, readonly className: string | null, readonly enabled: boolean, readonly period: string, readonly scope: string, readonly periodEndsAt: string, readonly viewerHidden: boolean, readonly me: { readonly rank: number | null, readonly size: number, readonly xp: number, readonly gradeRank: number | null, readonly gradeSize: number, readonly xpToNextRank: number | null, readonly nextRankName: string | null } | null, readonly entries: ReadonlyArray<{ readonly rank: number | null, readonly studentId: string, readonly studentName: string | null, readonly xp: number, readonly streakDays: number, readonly rankChange: number | null, readonly isViewer: boolean, readonly rankDelta: number | null, readonly submittedInPeriod: number, readonly xpToday: number, readonly tierKey: string | null, readonly division: number | null, readonly frameKey: string | null, readonly hidden: boolean }> } } };

export type ElearningLeaderboardClassesQueryVariables = Exact<{ [key: string]: never; }>;


export type ElearningLeaderboardClassesQuery = { readonly elearning: { readonly leaderboardClasses: ReadonlyArray<{ readonly id: string, readonly name: string | null, readonly leaderboardEnabled: boolean }> } };

export type ElearningClassLeaderboardQueryVariables = Exact<{
  input: ClassLeaderboardInput;
}>;


export type ElearningClassLeaderboardQuery = { readonly elearning: { readonly classLeaderboard: { readonly classId: string, readonly className: string | null, readonly enabled: boolean, readonly period: string, readonly scope: string, readonly periodEndsAt: string, readonly viewerHidden: boolean, readonly entries: ReadonlyArray<{ readonly rank: number | null, readonly studentId: string, readonly studentName: string | null, readonly xp: number, readonly streakDays: number, readonly rankChange: number | null, readonly isViewer: boolean, readonly tierKey: string | null, readonly division: number | null, readonly frameKey: string | null, readonly hidden: boolean }> } } };

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


export type ElearningStudentDashboardQuery = { readonly elearning: { readonly studentDashboard: { readonly tenantId: string, readonly assignmentsHasMore: boolean | null, readonly viewer: { readonly userId: string, readonly tenantId: string, readonly accountType: string | null, readonly accessLevel: string | null }, readonly profile: { readonly userId: string, readonly studentId: string | null, readonly studentCode: string | null, readonly fullName: string | null, readonly email: string | null, readonly schoolId: string | null, readonly academicClassId: string | null, readonly status: string | null, readonly updatedAt: string | null, readonly leaderboardEnabled: boolean }, readonly summary: { readonly enrolledCourseCount: number, readonly activeAssignmentCount: number, readonly pendingActionCount: number, readonly generatedAt: string, readonly scoreSummary: { readonly completedAttemptCount: number, readonly attemptedAssignmentCount: number, readonly passedAttemptCount: number, readonly averagePercent: number, readonly bestPercent: number } }, readonly courses: ReadonlyArray<{ readonly id: string, readonly title: string, readonly status: string | null, readonly progressPercent: number, readonly updatedAt: string | null }>, readonly assignments: ReadonlyArray<{ readonly id: string, readonly quizId: string | null, readonly title: string, readonly status: string | null, readonly dueAt: string | null, readonly scorePercent: number | null, readonly submittedAt: string | null, readonly subjectName: string | null, readonly teacherName: string | null, readonly questionCount: number | null, readonly estimatedMinutes: number | null, readonly kind: string, readonly answeredCount: number | null, readonly score: number | null, readonly maxScore: number | null, readonly totalQuestions: number | null, readonly correctCount: number | null, readonly attemptCount: number, readonly onTime: boolean | null, readonly minutesBeforeDue: number | null, readonly xpReward: number, readonly closed: boolean, readonly handedIn: boolean }>, readonly nextActions: ReadonlyArray<{ readonly id: string, readonly kind: string, readonly label: string, readonly targetId: string | null, readonly dueAt: string | null }>, readonly announcements: ReadonlyArray<{ readonly id: string, readonly title: string, readonly content: string | null, readonly pinned: boolean, readonly publishedAt: string | null, readonly updatedAt: string | null }> } } };

export type ElearningStudentDiscussionFeedQueryVariables = Exact<{
  input?: StudentDiscussionFeedInput | null | undefined;
}>;


export type ElearningStudentDiscussionFeedQuery = { readonly elearning: { readonly discussionFeed: { readonly page: number, readonly size: number, readonly totalItems: number, readonly hasNext: boolean, readonly items: ReadonlyArray<{ readonly id: string, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly academicClassId: string | null, readonly className: string | null, readonly title: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly assignmentId: string | null, readonly subject: string | null, readonly pinned: boolean, readonly acceptedReplyId: string | null, readonly following: boolean, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly comments: ReadonlyArray<{ readonly id: string, readonly parentId: string | null, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly replies: ReadonlyArray<{ readonly id: string, readonly parentId: string | null, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }> }> }> }> } } };

export type ElearningCreateStudentDiscussionMutationVariables = Exact<{
  input: CreateStudentDiscussionInput;
}>;


export type ElearningCreateStudentDiscussionMutation = { readonly createStudentDiscussion: { readonly id: string, readonly authorId: string | null, readonly authorName: string | null, readonly authorInitials: string | null, readonly academicClassId: string | null, readonly className: string | null, readonly title: string | null, readonly content: string | null, readonly createdAt: string | null, readonly attachmentIds: ReadonlyArray<string>, readonly assignmentId: string | null, readonly viewerReaction: string | null, readonly reactions: ReadonlyArray<{ readonly reaction: string, readonly count: number }>, readonly comments: ReadonlyArray<{ readonly id: string }> } };

export type ElearningFollowStudentDiscussionMutationVariables = Exact<{
  input: FollowStudentDiscussionInput;
}>;


export type ElearningFollowStudentDiscussionMutation = { readonly followStudentDiscussion: boolean };

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

export type ElearningMyQuestionThreadsQueryVariables = Exact<{
  status?: string | null | undefined;
  tenantId?: string | null | undefined;
}>;


export type ElearningMyQuestionThreadsQuery = { readonly elearning: { readonly myQuestionThreads: ReadonlyArray<{ readonly id: string, readonly assignmentId: string, readonly assignmentTitle: string | null, readonly subjectName: string | null, readonly className: string | null, readonly questionIndex: number, readonly questionPrompt: string | null, readonly studentAnswerText: string | null, readonly correctAnswerText: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly status: string, readonly lastMessageAt: string | null, readonly lastMessagePreview: string | null, readonly unread: boolean }> } };

export type ElearningQuestionThreadQueryVariables = Exact<{
  id: string;
  tenantId?: string | null | undefined;
}>;


export type ElearningQuestionThreadQuery = { readonly elearning: { readonly questionThread: { readonly id: string, readonly assignmentId: string, readonly assignmentTitle: string | null, readonly subjectName: string | null, readonly className: string | null, readonly questionIndex: number, readonly questionPrompt: string | null, readonly studentAnswerText: string | null, readonly correctAnswerText: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly status: string, readonly lastMessageAt: string | null, readonly lastMessagePreview: string | null, readonly unread: boolean, readonly messages: ReadonlyArray<{ readonly id: string, readonly senderId: string, readonly senderName: string | null, readonly senderRole: string, readonly mine: boolean, readonly body: string, readonly attachmentIds: ReadonlyArray<string>, readonly createdAt: string }> } } };

export type ElearningSendQuestionThreadMessageMutationVariables = Exact<{
  input: SendQuestionThreadMessageInput;
}>;


export type ElearningSendQuestionThreadMessageMutation = { readonly sendQuestionThreadMessage: { readonly id: string, readonly assignmentId: string, readonly assignmentTitle: string | null, readonly subjectName: string | null, readonly className: string | null, readonly questionIndex: number, readonly questionPrompt: string | null, readonly studentAnswerText: string | null, readonly correctAnswerText: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly status: string, readonly lastMessageAt: string | null, readonly lastMessagePreview: string | null, readonly unread: boolean, readonly messages: ReadonlyArray<{ readonly id: string, readonly senderId: string, readonly senderName: string | null, readonly senderRole: string, readonly mine: boolean, readonly body: string, readonly attachmentIds: ReadonlyArray<string>, readonly createdAt: string }> } };

export type ElearningAskTeacherAboutQuestionMutationVariables = Exact<{
  input: AskTeacherAboutQuestionInput;
}>;


export type ElearningAskTeacherAboutQuestionMutation = { readonly askTeacherAboutQuestion: { readonly id: string, readonly assignmentId: string, readonly assignmentTitle: string | null, readonly subjectName: string | null, readonly className: string | null, readonly questionIndex: number, readonly questionPrompt: string | null, readonly studentAnswerText: string | null, readonly correctAnswerText: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly status: string, readonly lastMessageAt: string | null, readonly lastMessagePreview: string | null, readonly unread: boolean, readonly messages: ReadonlyArray<{ readonly id: string, readonly senderId: string, readonly senderName: string | null, readonly senderRole: string, readonly mine: boolean, readonly body: string, readonly attachmentIds: ReadonlyArray<string>, readonly createdAt: string }> } };

export type ElearningMarkQuestionThreadReadMutationVariables = Exact<{
  threadId: string | number;
  tenantId?: string | null | undefined;
}>;


export type ElearningMarkQuestionThreadReadMutation = { readonly markStudentQuestionThreadRead: boolean };

export type ElearningMyTierQueryVariables = Exact<{
  tenantId?: string | null | undefined;
}>;


export type ElearningMyTierQuery = { readonly elearning: { readonly myTier: { readonly tierKey: string | null, readonly division: number | null, readonly gradeRank: number | null, readonly gradeSize: number | null, readonly courseXp: number, readonly eligible: boolean, readonly submittedCount: number, readonly protected: boolean, readonly nextDivision: { readonly tierKey: string, readonly division: number | null, readonly minXp: number, readonly studentsToPass: number } | null, readonly nextTier: { readonly tierKey: string, readonly division: number | null, readonly minXp: number, readonly studentsToPass: number } | null, readonly pendingPromotion: { readonly weekStart: string, readonly fromKey: string, readonly fromDivision: number | null, readonly toKey: string, readonly toDivision: number | null, readonly studentsPassed: number, readonly gradePercentile: number } | null } } };

export type ElearningTierTableQueryVariables = Exact<{
  weekStart?: string | null | undefined;
  tenantId?: string | null | undefined;
}>;


export type ElearningTierTableQuery = { readonly elearning: { readonly tierTable: ReadonlyArray<{ readonly tierKey: string, readonly share: string, readonly seats: number, readonly divisions: ReadonlyArray<{ readonly division: number | null, readonly rankFrom: number, readonly rankTo: number, readonly minXp: number }> }> } };

export type ElearningMyFramesQueryVariables = Exact<{
  tenantId?: string | null | undefined;
}>;


export type ElearningMyFramesQuery = { readonly elearning: { readonly myFrames: { readonly selected: string | null, readonly frames: ReadonlyArray<{ readonly tierKey: string, readonly unlocked: boolean, readonly unlockedAt: string | null, readonly schoolYear: string | null, readonly studentsToPass: number | null }> } } };

export type ElearningSelectFrameMutationVariables = Exact<{
  tierKey?: string | null | undefined;
  tenantId?: string | null | undefined;
}>;


export type ElearningSelectFrameMutation = { readonly selectFrame: { readonly selected: string | null, readonly frames: ReadonlyArray<{ readonly tierKey: string, readonly unlocked: boolean, readonly unlockedAt: string | null, readonly schoolYear: string | null, readonly studentsToPass: number | null }> } };

export type ElearningAcknowledgeTierPromotionMutationVariables = Exact<{
  weekStart: string;
  tenantId?: string | null | undefined;
}>;


export type ElearningAcknowledgeTierPromotionMutation = { readonly acknowledgeTierPromotion: boolean };

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

export type TeachingCalendarSideFieldsFragment = { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null };

export type TeachingCalendarTravelFieldsFragment = { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number };

export type TeachingCalendarConflictFieldsFragment = { readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null };

export type TeachingCalendarAccessFieldsFragment = { readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> };

export type TeachingCalendarDraftResultFieldsFragment = { readonly version: number, readonly savedAt: string, readonly batch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number }, readonly rowIdMap: ReadonlyArray<{ readonly clientRowId: string, readonly eventId: string }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }>, readonly accessChanges: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> }> };

export type TeachingCalendarSchoolRowFieldsFragment = { readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number };

export type TeachingCalendarTemplateFieldsFragment = { readonly id: string, readonly name: string, readonly periodsPerDay: number, readonly slots: ReadonlyArray<{ readonly periodNo: number, readonly session: TeachingSession, readonly startTime: string | null, readonly endTime: string | null }> };

export type TeachingCalendarSlotChangeFieldsFragment = { readonly applied: boolean, readonly blocking: boolean, readonly affectedCount: number, readonly events: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly version: number | null }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }> };

export type TeachingCalendarAssignmentFieldsFragment = { readonly schoolId: string, readonly schoolName: string, readonly templateId: string, readonly templateName: string, readonly effectiveFrom: string | null, readonly current: boolean };

export type TeachingCalendarDayLoadsQueryVariables = Exact<{
  from: string;
  to: string;
}>;


export type TeachingCalendarDayLoadsQuery = { readonly lcms: { readonly teachingScheduleDayLoads: ReadonlyArray<{ readonly date: string, readonly periods: number, readonly schools: number }> } };

export type TeachingCalendarOverviewSchoolsQueryVariables = Exact<{
  weekStart: string;
  search?: string | null | undefined;
  quick?: string | null | undefined;
  page: number;
  size: number;
}>;


export type TeachingCalendarOverviewSchoolsQuery = { readonly lcms: { readonly teachingScheduleOverviewSchools: { readonly total: number, readonly items: ReadonlyArray<{ readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number }>, readonly quickCounts: { readonly conflicts: number, readonly travel: number, readonly drafts: number, readonly empty: number } } } };

export type TeachingCalendarOverviewGridQueryVariables = Exact<{
  weekStart: string;
  schoolIds: ReadonlyArray<string | number> | string | number;
}>;


export type TeachingCalendarOverviewGridQuery = { readonly lcms: { readonly teachingScheduleOverviewGrid: { readonly weekStart: string, readonly template: { readonly id: string, readonly name: string, readonly periodsPerDay: number, readonly slots: ReadonlyArray<{ readonly periodNo: number, readonly session: TeachingSession, readonly startTime: string | null, readonly endTime: string | null }> }, readonly schools: ReadonlyArray<{ readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number }>, readonly cells: ReadonlyArray<{ readonly schoolId: string, readonly weekday: number, readonly periodNo: number, readonly eventId: string | null, readonly className: string | null, readonly roomName: string | null, readonly teacherName: string | null, readonly assistantName: string | null, readonly status: string | null, readonly conflictKinds: ReadonlyArray<TeachingScheduleConflictKind>, readonly note: string | null, readonly batchLabel: string | null }>, readonly holidays: ReadonlyArray<{ readonly date: string, readonly name: string, readonly kind: TeachingHolidayKind }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }> } } };

export type TeachingCalendarOverviewTeachersQueryVariables = Exact<{
  weekStart: string;
  search?: string | null | undefined;
  quick?: string | null | undefined;
  sort?: string | null | undefined;
  page: number;
  size: number;
}>;


export type TeachingCalendarOverviewTeachersQuery = { readonly lcms: { readonly teachingScheduleOverviewTeachers: { readonly total: number, readonly quickCounts: { readonly conflicts: number, readonly travel: number, readonly multiSchool: number, readonly overload: number, readonly empty: number }, readonly items: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly initials: string, readonly schoolCount: number, readonly conflictCount: number, readonly weeklyPeriods: number, readonly maxPeriods: number, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly revokeNotice: { readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> } | null, readonly days: ReadonlyArray<{ readonly weekday: number, readonly schoolShortNames: ReadonlyArray<string>, readonly multiSchoolSameSession: boolean, readonly onLeave: boolean, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null }>, readonly slots: ReadonlyArray<{ readonly weekday: number, readonly periodNo: number, readonly eventIds: ReadonlyArray<string>, readonly classNames: ReadonlyArray<string>, readonly schoolShortNames: ReadonlyArray<string>, readonly conflict: boolean, readonly travel: boolean, readonly onLeave: boolean, readonly status: string | null, readonly roles: ReadonlyArray<TeachingScheduleRole> }> }> } } };

export type TeachingCalendarScheduleLoadSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type TeachingCalendarScheduleLoadSettingsQuery = { readonly lcms: { readonly teachingScheduleLoadSettings: { readonly loadWarn: number, readonly loadMax: number, readonly updatedAt: string | null } } };

export type TeachingCalendarUpdateScheduleLoadSettingsMutationVariables = Exact<{
  loadWarn: number;
  loadMax: number;
}>;


export type TeachingCalendarUpdateScheduleLoadSettingsMutation = { readonly updateTeachingScheduleLoadSettings: { readonly loadWarn: number, readonly loadMax: number, readonly updatedAt: string | null } };

export type TeachingCalendarSchoolPeriodAssignmentsQueryVariables = Exact<{
  schoolIds?: ReadonlyArray<string | number> | string | number | null | undefined;
}>;


export type TeachingCalendarSchoolPeriodAssignmentsQuery = { readonly lcms: { readonly schoolPeriodAssignments: ReadonlyArray<{ readonly schoolId: string, readonly schoolName: string, readonly templateId: string, readonly templateName: string, readonly effectiveFrom: string | null, readonly current: boolean }> } };

export type TeachingCalendarSaveSchoolPeriodTimesMutationVariables = Exact<{
  input: SaveSchoolPeriodTimesInput;
}>;


export type TeachingCalendarSaveSchoolPeriodTimesMutation = { readonly saveSchoolPeriodTimes: { readonly schoolId: string, readonly schoolName: string, readonly templateId: string, readonly templateName: string, readonly effectiveFrom: string | null, readonly current: boolean } };

export type TeachingCalendarReusePreviewQueryVariables = Exact<{
  input: TeachingScheduleReuseInput;
}>;


export type TeachingCalendarReusePreviewQuery = { readonly lcms: { readonly previewTeachingScheduleReuse: { readonly sourcePeriods: number, readonly totalToCreate: number, readonly perTeacher: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly periods: number }>, readonly excludedConflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }>, readonly weeks: ReadonlyArray<{ readonly weekStart: string, readonly weekEnd: string, readonly toCreate: number, readonly skipped: number, readonly conflicts: number, readonly holidays: ReadonlyArray<{ readonly date: string, readonly name: string }>, readonly conflictDetails: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }> }> } } };

export type TeachingCalendarReuseScheduleWeekMutationVariables = Exact<{
  input: TeachingScheduleReuseInput;
}>;


export type TeachingCalendarReuseScheduleWeekMutation = { readonly reuseTeachingScheduleWeek: { readonly version: number, readonly savedAt: string, readonly batch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number }, readonly rowIdMap: ReadonlyArray<{ readonly clientRowId: string, readonly eventId: string }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }>, readonly accessChanges: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> }> } };

export type TeachingCalendarPeriodTemplatesQueryVariables = Exact<{ [key: string]: never; }>;


export type TeachingCalendarPeriodTemplatesQuery = { readonly lcms: { readonly teachingPeriodTemplates: ReadonlyArray<{ readonly id: string, readonly name: string, readonly periodsPerDay: number, readonly slots: ReadonlyArray<{ readonly periodNo: number, readonly session: TeachingSession, readonly startTime: string | null, readonly endTime: string | null }> }> } };

export type TeachingCalendarScheduleDraftQueryVariables = Exact<{
  batchId: string | number;
}>;


export type TeachingCalendarScheduleDraftQuery = { readonly lcms: { readonly teachingScheduleDraft: { readonly version: number, readonly savedAt: string, readonly batch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number }, readonly rowIdMap: ReadonlyArray<{ readonly clientRowId: string, readonly eventId: string }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }>, readonly accessChanges: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> }> } } };

export type TeachingCalendarSaveScheduleDraftMutationVariables = Exact<{
  input: SaveTeachingScheduleDraftInput;
}>;


export type TeachingCalendarSaveScheduleDraftMutation = { readonly saveTeachingScheduleDraft: { readonly version: number, readonly savedAt: string, readonly batch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number }, readonly rowIdMap: ReadonlyArray<{ readonly clientRowId: string, readonly eventId: string }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }>, readonly accessChanges: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly weeklyPeriods: number, readonly lastPeriodDate: string | null, readonly schoolId: string, readonly schoolState: TeachingAccessState, readonly schoolRevokeOn: string | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly state: TeachingAccessState, readonly revokeOn: string | null }> }> } };

export type TeachingCalendarPublishScheduleBatchV2MutationVariables = Exact<{
  batchId: string | number;
  expectedVersion: number;
}>;


export type TeachingCalendarPublishScheduleBatchV2Mutation = { readonly publishTeachingScheduleBatch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number } };

export type TeachingCalendarCancelScheduleBatchV2MutationVariables = Exact<{
  batchId: string | number;
  expectedVersion: number;
}>;


export type TeachingCalendarCancelScheduleBatchV2Mutation = { readonly cancelTeachingScheduleBatch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number } };

export type TeachingCalendarRenameScheduleBatchMutationVariables = Exact<{
  batchId: string | number;
  label: string;
  expectedVersion: number;
}>;


export type TeachingCalendarRenameScheduleBatchMutation = { readonly renameTeachingScheduleBatch: { readonly id: string, readonly schoolId: string, readonly label: string, readonly status: TeachingScheduleStatus, readonly version: number, readonly periodTemplateId: string | null, readonly applyFrom: string | null, readonly repeatWeeks: number | null, readonly publishedAt: string | null, readonly affectedEventCount: number } };

export type TeachingCalendarEditScheduleSlotMutationVariables = Exact<{
  input: EditTeachingScheduleSlotInput;
}>;


export type TeachingCalendarEditScheduleSlotMutation = { readonly editTeachingScheduleSlot: { readonly applied: boolean, readonly blocking: boolean, readonly affectedCount: number, readonly events: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly version: number | null }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }> } };

export type TeachingCalendarSwapScheduleTeacherMutationVariables = Exact<{
  input: SwapTeachingScheduleTeacherInput;
}>;


export type TeachingCalendarSwapScheduleTeacherMutation = { readonly swapTeachingScheduleTeacher: { readonly applied: boolean, readonly blocking: boolean, readonly affectedCount: number, readonly events: ReadonlyArray<{ readonly eventId: string, readonly date: string, readonly periodNo: number, readonly version: number | null }>, readonly conflicts: ReadonlyArray<{ readonly id: string, readonly kind: TeachingScheduleConflictKind, readonly severity: TeachingScheduleSeverity, readonly clientRowId: string | null, readonly weekday: number, readonly periodNo: number, readonly startTime: string | null, readonly endTime: string | null, readonly firstDate: string, readonly affectedWeeks: number, readonly totalWeeks: number, readonly message: string, readonly mine: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null }, readonly other: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null, readonly fix: { readonly kind: TeachingScheduleFixKind, readonly targetEventId: string | null, readonly targetClientRowId: string | null, readonly targetClassName: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly reason: string } | null }> } };

export type TeachingCalendarSlotOptionsQueryVariables = Exact<{
  schoolId: string | number;
  batchId?: string | number | null | undefined;
  date: string;
  periodNo: number;
  classId?: string | number | null | undefined;
  excludeEventId?: string | number | null | undefined;
}>;


export type TeachingCalendarSlotOptionsQuery = { readonly lcms: { readonly teachingScheduleSlotOptions: { readonly schoolName: string, readonly grade: number | null, readonly classes: ReadonlyArray<{ readonly classId: string, readonly className: string, readonly grade: number | null, readonly state: TeachingSlotOptionState, readonly busy: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null }>, readonly teachers: ReadonlyArray<{ readonly teacherId: string, readonly teacherName: string, readonly initials: string, readonly state: TeachingSlotOptionState, readonly weeklyPeriods: number, readonly taughtHereLastWeek: boolean, readonly classAccess: TeachingAccessState, readonly sameSchoolNeighbor: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly busy: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null, readonly travel: { readonly fromSchoolId: string, readonly fromSchoolShortName: string, readonly fromSchoolName: string, readonly toSchoolId: string, readonly toSchoolShortName: string, readonly toSchoolName: string, readonly previousEndTime: string, readonly gapMinutes: number, readonly requiredMinutes: number } | null, readonly leave: { readonly fromDate: string, readonly toDate: string, readonly part: string } | null }>, readonly rooms: ReadonlyArray<{ readonly roomId: string, readonly roomName: string, readonly seatCount: number | null, readonly state: TeachingSlotOptionState, readonly usualForClass: boolean, readonly busy: { readonly eventId: string | null, readonly teacherId: string | null, readonly teacherName: string | null, readonly classId: string | null, readonly className: string | null, readonly roomId: string | null, readonly roomName: string | null, readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly subjectName: string | null, readonly batchId: string | null, readonly batchLabel: string | null, readonly batchStatus: string | null, readonly createdByName: string | null, readonly createdByRole: string | null, readonly createdAt: string | null, readonly periodNo: number | null, readonly startTime: string | null, readonly endTime: string | null } | null }> } } };

export type TeachingCalendarSchoolTravelTimesQueryVariables = Exact<{
  search?: string | null | undefined;
  page: number;
  size: number;
}>;


export type TeachingCalendarSchoolTravelTimesQuery = { readonly lcms: { readonly schoolTravelTimes: ReadonlyArray<{ readonly minutes: number, readonly updatedAt: string | null, readonly schoolA: { readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number }, readonly schoolB: { readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number } }> } };

export type TeachingCalendarUpsertSchoolTravelTimeMutationVariables = Exact<{
  schoolAId: string | number;
  schoolBId: string | number;
  minutes: number;
}>;


export type TeachingCalendarUpsertSchoolTravelTimeMutation = { readonly upsertSchoolTravelTime: { readonly minutes: number, readonly updatedAt: string | null, readonly schoolA: { readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number }, readonly schoolB: { readonly schoolId: string, readonly schoolName: string, readonly schoolShortName: string, readonly conflictCount: number, readonly hasDraft: boolean, readonly periodCount: number } } };

export type TeachingCalendarDeleteSchoolTravelTimeMutationVariables = Exact<{
  schoolAId: string | number;
  schoolBId: string | number;
}>;


export type TeachingCalendarDeleteSchoolTravelTimeMutation = { readonly deleteSchoolTravelTime: boolean };

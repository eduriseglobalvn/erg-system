import type { components } from "@/lib/api/generated/erg-openapi";

type Schemas = components["schemas"];

export type ClockView = Schemas["ClockView"];
export type TodayView = Schemas["TodayView"];
export type SiteView = Schemas["SiteView"];
export type PunchView = Schemas["PunchView"];
export type PunchResult = Schemas["PunchResult"];
export type MonthView = Schemas["MonthView"];
export type MonthDayView = Schemas["MonthDayView"];
export type DayDetailView = Schemas["DayDetailView"];
export type DayPunchView = Schemas["DayPunchView"];
export type DayStatus = NonNullable<Schemas["MonthDayView"]["status"]>;

export type RequestCommand = Schemas["RequestCommand"];
export type RequestView = Schemas["RequestView"];
export type RequestPage = Schemas["RequestPage"];
export type RequestType = NonNullable<RequestView["type"]>;
export type LeaveKind = NonNullable<RequestView["leaveKind"]>;
export type LeavePreview = Schemas["LeavePreview"];
export type ExplanationContext = Schemas["ExplanationContext"];

export type ApprovalPage = Schemas["ApprovalPage"];
export type ApprovalItem = Schemas["ApprovalItem"];
export type ApprovalDetail = Schemas["ApprovalDetail"];
export type ApprovalComment = Schemas["ApprovalComment"];
export type BulkApproveCommand = Schemas["BulkApproveCommand"];
export type BulkApproveResult = Schemas["BulkApproveResult"];

export type TodayDashboard = Schemas["TodayDashboard"];
export type Timesheet = Schemas["Timesheet"];
export type TimesheetRow = Schemas["TimesheetRow"];
export type ActionItem = Schemas["ActionItem"];
export type RecentPunch = Schemas["RecentPunch"];
export type PunchReviewCommand = Schemas["PunchReviewCommand"];
export type PeriodLockView = Schemas["PeriodLockView"];
export type RemindResult = Schemas["RemindResult"];

export type PunchDirection = "IN" | "OUT";
export type ApprovalBox = "MINE" | "DONE" | "ALL";

/** Fields of the multipart punch body. The server ignores any client-side clock, so none is sent. */
export type PunchInput = {
  direction: PunchDirection;
  lat?: number;
  lng?: number;
  accuracyM?: number;
  mockReported?: boolean;
  reason?: string;
  photo?: Blob;
};

/** Error `code` values the backend puts in the error body (ApiClientError.code). */
export const TIMEKEEPING_ERROR_CODES = [
  "FACE_CONSENT_REQUIRED",
  "FACE_REQUIRED",
  "IDEMPOTENCY_KEY_REQUIRED",
  "INVALID_PHOTO",
  "PUNCH_REJECTED",
  "OUTSIDE_PUNCH_WINDOW",
  "PERIOD_LOCKED",
  "NO_APPROVER",
  "REQUEST_OVERLAP",
  "REMIND_TOO_SOON",
  "INSUFFICIENT_BALANCE", // approval side (bulk approve)
  "INSUFFICIENT_LEAVE", // teacher request submit
  "EXPLANATION_LIMIT",
  "EXPLANATION_WINDOW",
] as const;

export type TimekeepingErrorCode = (typeof TIMEKEEPING_ERROR_CODES)[number];

export function timekeepingErrorCode(error: unknown): TimekeepingErrorCode | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return TIMEKEEPING_ERROR_CODES.find((known) => known === code);
}

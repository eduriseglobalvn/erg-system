import { isAudienceEmpty } from "../api/campaign-query";
import type { CampaignAudience, CampaignDraftRequest, CampaignPriority, CampaignResponse } from "../api/campaign-types";
import { type AudienceDraft, type AudienceRole, type AudienceScope, emptyDraft, toCampaignAudience } from "./audience-draft";

/** Mirrors CampaignDraftRequest (title <= 120, body <= 2000) and the backend schedule window (now, now + 30 days]. */
export const TITLE_MAX = 120;
export const BODY_MAX = 2000;
const SCHEDULE_MAX_MS = 30 * 24 * 3600_000;

export type SendMode = "now" | "schedule";

export type CampaignFormValues = {
  title: string;
  body: string;
  priority: CampaignPriority;
  requireReadAck: boolean;
  pushEnabled: boolean;
  sendMode: SendMode;
  /** Local wall-clock time "yyyy-MM-ddTHH:mm" (Vietnam time on the user's device); "" when unset. */
  scheduledAt: string;
  audience: AudienceDraft;
};

export type CampaignFormErrors = Partial<Record<keyof CampaignFormValues, string>>;

export const emptyCampaignForm = (): CampaignFormValues => ({
  title: "",
  body: "",
  priority: "INFO",
  requireReadAck: false,
  pushEnabled: true,
  sendMode: "now",
  scheduledAt: "",
  audience: emptyDraft(),
});

const numberVi = new Intl.NumberFormat("vi-VN");
export const formatCountVi = (n: number) => numberVi.format(n);

const pad = (n: number) => String(n).padStart(2, "0");

/** "yyyy-MM-ddTHH:mm" read as local time, parsed by hand (Safari 15 is unreliable with offset-less strings). */
export function localInputToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [y, mo, d, h, mi] = match.slice(1).map(Number) as [number, number, number, number, number];
  const date = new Date(y, mo - 1, d, h, mi);
  const sameFields = date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d && date.getHours() === h;
  return sameFields ? date.toISOString() : null;
}

export function isoToLocalInput(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Next full hour + 1, a sensible first value when the sender switches to "Hẹn giờ". */
export function defaultScheduleInput(now: Date): string {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 2);
  return isoToLocalInput(next.toISOString());
}

export function validateCampaignForm(v: CampaignFormValues, now: Date): CampaignFormErrors {
  const errors: CampaignFormErrors = {};
  const title = v.title.trim();
  if (!title) errors.title = "Nhập tiêu đề";
  else if (title.length > TITLE_MAX) errors.title = `Tối đa ${TITLE_MAX} ký tự`;
  const body = v.body.trim();
  if (!body) errors.body = "Nhập nội dung";
  else if (v.body.length > BODY_MAX) errors.body = `Tối đa ${formatCountVi(BODY_MAX)} ký tự`;
  if (v.sendMode === "schedule") {
    const iso = localInputToIso(v.scheduledAt);
    const at = iso ? new Date(iso).getTime() : NaN;
    if (Number.isNaN(at)) errors.scheduledAt = "Chọn thời điểm hẹn";
    else if (at <= now.getTime()) errors.scheduledAt = "Thời điểm hẹn phải ở tương lai";
    else if (at > now.getTime() + SCHEDULE_MAX_MS) errors.scheduledAt = "Chỉ hẹn trong 30 ngày tới";
  }
  if (isAudienceEmpty(toCampaignAudience(v.audience))) errors.audience = "Chọn ít nhất một người nhận";
  return errors;
}

export const toDraftRequest = (v: CampaignFormValues): CampaignDraftRequest => ({
  title: v.title.trim(),
  body: v.body.trim(),
  priority: v.priority,
  requireReadAck: v.requireReadAck,
  pushEnabled: v.pushEnabled,
  audience: toCampaignAudience(v.audience),
});

function scopeOf(a: CampaignAudience): AudienceScope {
  if (a.wholeTenant) return "TENANT";
  if (a.schoolIds?.length) return "SCHOOL";
  if (a.gradeIds?.length) return "GRADE";
  if (a.classIds?.length) return "CLASS";
  if (a.roles?.length) return "ROLE";
  if (a.groupIds?.length) return "GROUP";
  return a.userIds?.length ? "PEOPLE" : "CLASS";
}

/** Saved campaign -> form. Picked people come back as ids only (the API returns no names for a draft). */
export function fromCampaign(c: CampaignResponse): CampaignFormValues {
  const a = c.audience ?? {};
  return {
    ...emptyCampaignForm(),
    title: c.title ?? "",
    body: c.body ?? "",
    priority: c.priority ?? "INFO",
    requireReadAck: c.requireReadAck ?? false,
    pushEnabled: c.pushEnabled ?? true,
    sendMode: c.status === "SCHEDULED" && c.scheduledAt ? "schedule" : "now",
    scheduledAt: c.status === "SCHEDULED" ? isoToLocalInput(c.scheduledAt) : "",
    audience: {
      ...emptyDraft(scopeOf(a)),
      schoolIds: [...(a.schoolIds ?? [])],
      gradeIds: [...(a.gradeIds ?? [])],
      classIds: [...(a.classIds ?? [])],
      groupIds: [...(a.groupIds ?? [])],
      roles: [...(a.roles ?? [])] as AudienceRole[],
      picked: (a.userIds ?? []).map((userId) => ({ userId, displayName: "Người nhận đã lưu" })),
    },
  };
}

import type { CampaignAudience, RecipientCard } from "../api/campaign-types";

export type AudienceScope = "TENANT" | "SCHOOL" | "GRADE" | "CLASS" | "ROLE" | "GROUP" | "PEOPLE";
export type AudienceRole = "TEACHER" | "STUDENT" | "STAFF";

export type AudienceDraft = {
  scope: AudienceScope;
  schoolIds: string[];
  /** Grade CODES (academic_classes.grade, e.g. "7"), not school_grades ids: that is what the backend matches on. */
  gradeIds: string[];
  classIds: string[];
  groupIds: string[];
  roles: AudienceRole[];
  picked: RecipientCard[];
  /** Pasted / imported lines that matched nobody or several people. */
  errors: string[];
};

export const SCOPE_LABELS: Record<AudienceScope, string> = {
  TENANT: "Toàn hệ thống",
  SCHOOL: "Trường",
  GRADE: "Khối",
  CLASS: "Lớp",
  ROLE: "Vai trò",
  GROUP: "Nhóm học sinh",
  PEOPLE: "Từng người",
};

export const ROLE_LABELS: Record<AudienceRole, string> = { TEACHER: "Giáo viên", STUDENT: "Học sinh", STAFF: "Nhân viên" };

export const emptyDraft = (scope: AudienceScope = "CLASS"): AudienceDraft => ({
  scope, schoolIds: [], gradeIds: [], classIds: [], groupIds: [], roles: [], picked: [], errors: [],
});

export function allowedScopes(isAdminLike: boolean): AudienceScope[] {
  return isAdminLike ? ["TENANT", "SCHOOL", "GRADE", "CLASS", "ROLE", "GROUP", "PEOPLE"] : ["CLASS", "GROUP", "PEOPLE"];
}

/** Only the active scope's selection is sent; people picked one by one always merge in (the backend de-duplicates). */
export function toCampaignAudience(d: AudienceDraft): CampaignAudience {
  const tenant = d.scope === "TENANT";
  const pick = <T,>(scope: AudienceScope, list: T[]) => (d.scope === scope ? list : []);
  return {
    wholeTenant: tenant,
    schoolIds: pick("SCHOOL", d.schoolIds),
    gradeIds: pick("GRADE", d.gradeIds),
    classIds: pick("CLASS", d.classIds),
    groupIds: pick("GROUP", d.groupIds),
    roles: pick("ROLE", d.roles),
    userIds: tenant ? [] : d.picked.flatMap((c) => (c.userId ? [c.userId] : [])),
  };
}

export function addPicked(d: AudienceDraft, cards: readonly RecipientCard[]): AudienceDraft {
  const seen = new Set(d.picked.map((c) => c.userId));
  const fresh = cards.filter((c) => c.userId && !seen.has(c.userId) && seen.add(c.userId));
  return fresh.length ? { ...d, picked: [...d.picked, ...fresh] } : d;
}

/** Students group by class (second part of "Học sinh · 7A · HS0712"); everyone else by role label. */
export function groupKeyOf(card: RecipientCard): string {
  if (card.role === "STUDENT") return card.meta?.split(" · ")[1]?.trim() || ROLE_LABELS.STUDENT;
  return ROLE_LABELS[card.role as AudienceRole] ?? "Khác";
}

export const removePickedGroup = (d: AudienceDraft, groupKey: string): AudienceDraft => ({
  ...d, picked: d.picked.filter((c) => groupKeyOf(c) !== groupKey),
});

export const removePicked = (d: AudienceDraft, userId: string): AudienceDraft => ({
  ...d, picked: d.picked.filter((c) => c.userId !== userId),
});

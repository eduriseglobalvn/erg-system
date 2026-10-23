import type { components } from "@/lib/api/generated/erg-openapi";
import type {
  SeoCostLine,
  SeoCrmWorkspace,
  SeoFollowUp,
  SeoFollowUpType,
  SeoHandoverRequest,
  SeoLeadStatus,
  SeoOpportunity,
  SeoOpportunityStage,
  SeoRevenueLine,
  SeoSchoolLead,
} from "@/features/crm/seo/types/seo-crm-types";

type WorkspaceDto = components["schemas"]["WorkspaceResponse"];
type UnknownRecord = Record<string, unknown>;

const leadStatuses = new Set<SeoLeadStatus>([
  "new_lead", "consulted", "waiting_decision", "negotiating", "won_pending_setup", "active", "paused", "lost",
]);
const opportunityStages = new Set<SeoOpportunityStage>(["discovery", "proposal", "pnl_review", "contracting", "handover", "active"]);
const followUpTypes = new Set<SeoFollowUpType>(["call", "meeting", "proposal", "contract", "handover"]);
const handoverStatuses = new Set<SeoHandoverRequest["status"]>(["draft", "ready", "approved"]);

export function mapSeoCrmWorkspaceDto(value: unknown): SeoCrmWorkspace {
  const dto = record(value, "CRM workspace");
  return {
    leads: array(dto.leads).map(mapLead),
    opportunities: array(dto.opportunities).map(mapOpportunity),
    followUps: array(dto.followUps).map(mapFollowUp),
    handovers: array(dto.handovers).map(mapHandover),
  };
}

export function mapSeoLeadDto(value: unknown): SeoSchoolLead {
  return mapLead(value);
}

function mapLead(value: unknown): SeoSchoolLead {
  const dto = record(value, "CRM lead");
  const status = enumValue(dto.status, leadStatuses, "lead status");
  return {
    id: requiredString(dto.id, "lead id"),
    schoolId: requiredString(dto.schoolId, "school id"),
    schoolName: optionalString(dto.schoolName),
    district: optionalString(dto.district),
    province: optionalString(dto.province),
    segment: optionalString(dto.segment),
    contactName: optionalString(dto.contactName),
    contactRole: optionalString(dto.contactRole),
    phone: optionalString(dto.phone),
    source: optionalString(dto.source),
    ownerName: optionalString(dto.ownerName) || "SEO ERG",
    status,
    probability: finiteNumber(dto.probability),
    expectedStudents: finiteNumber(dto.expectedStudents),
    expectedClasses: finiteNumber(dto.expectedClasses),
    nextFollowUpAt: dateOnly(dto.nextFollowUpAt),
    lastTouchAt: dateOnly(dto.lastTouchAt),
    notes: optionalString(dto.notes),
    risks: array(dto.risks).map((item) => requiredString(item, "lead risk")),
    version: nonNegativeInteger(dto.version, "lead version"),
  };
}

function mapOpportunity(value: unknown): SeoOpportunity {
  const dto = record(value, "CRM opportunity");
  return {
    id: requiredString(dto.id, "opportunity id"),
    leadId: requiredString(dto.leadId, "opportunity lead id"),
    code: optionalString(dto.code),
    stage: enumValue(dto.stage, opportunityStages, "opportunity stage"),
    academicYear: optionalString(dto.academicYear),
    contractTerm: optionalString(dto.contractTerm),
    startMonth: optionalString(dto.startMonth),
    ownerName: optionalString(dto.ownerName) || "SEO ERG",
    revenueLines: array(dto.revenueLines).map(mapRevenueLine),
    costLines: array(dto.costLines).map(mapCostLine),
    version: nonNegativeInteger(dto.version, "opportunity version"),
  };
}

function mapRevenueLine(value: unknown): SeoRevenueLine {
  const dto = record(value, "CRM revenue line");
  return {
    id: requiredString(dto.id, "revenue line id"),
    program: optionalString(dto.program),
    packageName: optionalString(dto.packageName),
    classCount: finiteNumber(dto.classCount),
    studentsPerClass: finiteNumber(dto.studentsPerClass),
    pricePerStudent: finiteNumber(dto.pricePerStudent),
    discountRate: finiteNumber(dto.discountRate),
    durationMonths: finiteNumber(dto.durationMonths),
  };
}

function mapCostLine(value: unknown): SeoCostLine {
  const dto = record(value, "CRM cost line");
  return {
    id: requiredString(dto.id, "cost line id"),
    category: optionalString(dto.category),
    description: optionalString(dto.description),
    quantity: finiteNumber(dto.quantity),
    unitCost: finiteNumber(dto.unitCost),
    durationMonths: finiteNumber(dto.durationMonths),
    requiredForHandover: dto.requiredForHandover === true,
  };
}

function mapFollowUp(value: unknown): SeoFollowUp {
  const dto = record(value, "CRM follow-up");
  return {
    id: requiredString(dto.id, "follow-up id"),
    leadId: requiredString(dto.leadId, "follow-up lead id"),
    type: enumValue(dto.type, followUpTypes, "follow-up type"),
    title: optionalString(dto.title),
    dueAt: dateOnly(dto.dueAt),
    ownerName: optionalString(dto.ownerName) || "SEO ERG",
    done: dto.done === true,
    version: nonNegativeInteger(dto.version, "follow-up version"),
  };
}

function mapHandover(value: unknown): SeoHandoverRequest {
  const dto = record(value, "CRM handover");
  return {
    id: requiredString(dto.id, "handover id"),
    leadId: requiredString(dto.leadId, "handover lead id"),
    opportunityId: requiredString(dto.opportunityId, "handover opportunity id"),
    requestedBy: optionalString(dto.requestedBy),
    requestedAt: dateOnly(dto.requestedAt),
    status: enumValue(dto.status, handoverStatuses, "handover status"),
    checklist: array(dto.checklist).map((item) => {
      const entry = record(item, "CRM handover checklist item");
      return { id: requiredString(entry.id, "checklist id"), label: optionalString(entry.label), done: entry.done === true };
    }),
    version: nonNegativeInteger(dto.version, "handover version"),
  };
}

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as UnknownRecord;
}

function array(value: unknown): unknown[] {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [];
}

function requiredString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`CRM ${label} is missing`);
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function dateOnly(value: unknown) {
  const text = optionalString(value);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function nonNegativeInteger(value: unknown, label: string) {
  const number = finiteNumber(value);
  if (!Number.isInteger(number) || number < 0) throw new Error(`CRM ${label} is invalid`);
  return number;
}

function enumValue<T extends string>(value: unknown, allowed: Set<T>, label: string): T {
  const normalized = optionalString(value) as T;
  if (!allowed.has(normalized)) throw new Error(`CRM ${label} is invalid`);
  return normalized;
}

export type { WorkspaceDto };

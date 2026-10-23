import type { components } from "@/lib/api/generated/erg-openapi";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ApiResponseData } from "@/lib/api/contract-types";
import { apiRequest } from "@/lib/api-client";

export type LearningOutcomesPortal = "lms" | "lcms" | "elearning";
export type LearningPathResponse = components["schemas"]["LearningPathResponse"];
export type PathNodeResponse = components["schemas"]["PathNodeResponse"];
export type PathDetailResponse = components["schemas"]["PathDetailResponse"];
export type CompetencyResponse = components["schemas"]["CompetencyResponse"];
export type AttainmentResponse = components["schemas"]["AttainmentResponse"];
export type CompletionResponse = components["schemas"]["CompletionResponse"];
export type CertificateResponse = components["schemas"]["CertificateResponse"];

export type CreateLearningPathInput = components["schemas"]["CreateLearningPathRequest"];
export type PublishLearningPathInput = components["schemas"]["PublishLearningPathRequest"];
export type AddPathNodeInput = components["schemas"]["AddPathNodeRequest"];
export type CreateCompetencyInput = components["schemas"]["CreateCompetencyRequest"];
export type RecordAttainmentInput = components["schemas"]["RecordAttainmentRequest"];
export type EvaluateCompletionInput = components["schemas"]["EvaluateCompletionRequest"];
export type IssueCertificateInput = components["schemas"]["IssueCertificateRequest"];
export type RevokeCertificateInput = components["schemas"]["RevokeCertificateRequest"];

type PathsResponse = ApiResponseData<"/api/v1/learning-outcomes/paths", "get">;
type PathResponse = ApiResponseData<"/api/v1/learning-outcomes/paths/{pathId}", "get">;
type PathCommandResponse = ApiResponseData<"/api/v1/learning-outcomes/paths", "post">;
type PublishPathResponse = ApiResponseData<"/api/v1/learning-outcomes/paths/{pathId}/publish", "post">;
type NodeResponse = ApiResponseData<"/api/v1/learning-outcomes/paths/{pathId}/nodes", "post">;
type CompletionCommandResponse = ApiResponseData<"/api/v1/learning-outcomes/paths/{pathId}/completion", "post">;
type CompetenciesResponse = ApiResponseData<"/api/v1/learning-outcomes/competencies", "get">;
type CompetencyResponseData = ApiResponseData<"/api/v1/learning-outcomes/competencies/{competencyId}", "get">;
type CompetencyCommandResponse = ApiResponseData<"/api/v1/learning-outcomes/competencies", "post">;
type AttainmentCommandResponse = ApiResponseData<"/api/v1/learning-outcomes/attainments", "post">;
type AttainmentsResponse = ApiResponseData<"/api/v1/learning-outcomes/learners/{learnerId}/attainments", "get">;
type CompletionsResponse = ApiResponseData<"/api/v1/learning-outcomes/learners/{learnerId}/completions", "get">;
type CertificatesResponse = ApiResponseData<"/api/v1/learning-outcomes/learners/{learnerId}/certificates", "get">;
type CertificateCommandResponse = ApiResponseData<"/api/v1/learning-outcomes/certificates", "post">;
type CertificateResponseData = ApiResponseData<"/api/v1/learning-outcomes/certificates/verify/{verificationId}", "get">;
type CertificateRevokeResponse = ApiResponseData<"/api/v1/learning-outcomes/certificates/{certificateId}/revoke", "post">;

export type LearningOutcomeRequestContext = {
  portal?: LearningOutcomesPortal;
  signal?: AbortSignal;
};

export type LearningPathRecord = {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  status: string;
  classId?: string;
  educationUnitId?: string;
  nodeCount: number;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PathNodeRecord = {
  id: string;
  pathId?: string;
  contentKind: string;
  contentRefId: string;
  required: boolean;
  sortOrder: number;
  tenantId?: string;
  createdAt?: string;
};

export type LearningPathDetail = {
  path: LearningPathRecord;
  nodes: PathNodeRecord[];
};

export type CompetencyRecord = {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  description: string;
  status: string;
  educationUnitId?: string;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AttainmentRecord = {
  id: string;
  tenantId?: string;
  learnerId: string;
  competencyId: string;
  learningPathId?: string;
  classId?: string;
  status: string;
  evidenceRef: string;
  progressPercent: number;
  achievedAt?: string;
  recordVersion: number;
};

export type CompletionRecord = {
  id: string;
  tenantId?: string;
  learnerId: string;
  learningPathId: string;
  status: string;
  evidenceRef: string;
  progressPercent: number;
  completedNodeCount: number;
  requiredNodeCount: number;
  evaluatedAt?: string;
  recordVersion: number;
};

export type CertificateRecord = {
  id: string;
  tenantId?: string;
  learnerId: string;
  learningPathId: string;
  certificateNumber: string;
  verificationId: string;
  status: string;
  evidenceRef: string;
  issuedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
  recordVersion: number;
};

export type LearningPathFilters = {
  status?: string;
  educationUnitId?: string;
  classId?: string;
};

export const learningOutcomesQueryKeys = {
  root: (tenantId: string, accountId: string, workspace: string) =>
    ["learning-outcomes", tenantId, accountId, workspace] as const,
  paths: (tenantId: string, accountId: string, workspace: string, filters: LearningPathFilters = {}) =>
    [...learningOutcomesQueryKeys.root(tenantId, accountId, workspace), "paths", normalizeFilters(filters)] as const,
  path: (tenantId: string, accountId: string, workspace: string, pathId: string) =>
    [...learningOutcomesQueryKeys.root(tenantId, accountId, workspace), "path", pathId] as const,
  competencies: (tenantId: string, accountId: string, workspace: string, educationUnitId = "") =>
    [...learningOutcomesQueryKeys.root(tenantId, accountId, workspace), "competencies", educationUnitId] as const,
  learner: (tenantId: string, accountId: string, workspace: string, learnerId: string) =>
    [...learningOutcomesQueryKeys.root(tenantId, accountId, workspace), "learner", learnerId] as const,
  attainments: (tenantId: string, accountId: string, workspace: string, learnerId: string) =>
    [...learningOutcomesQueryKeys.learner(tenantId, accountId, workspace, learnerId), "attainments"] as const,
  completions: (tenantId: string, accountId: string, workspace: string, learnerId: string) =>
    [...learningOutcomesQueryKeys.learner(tenantId, accountId, workspace, learnerId), "completions"] as const,
  certificates: (tenantId: string, accountId: string, workspace: string, learnerId: string) =>
    [...learningOutcomesQueryKeys.learner(tenantId, accountId, workspace, learnerId), "certificates"] as const,
};

export async function listLearningPaths(
  filters: LearningPathFilters = {},
  context: LearningOutcomeRequestContext = {},
): Promise<LearningPathRecord[]> {
  const response = await apiRequest<PathsResponse>(withQuery(API_ENDPOINTS.learningOutcomes.paths, filters), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeLearningPath).filter(isDefined);
}

export async function getLearningPath(pathId: string, context: LearningOutcomeRequestContext = {}): Promise<LearningPathDetail> {
  const id = requiredId(pathId, "pathId");
  const response = await apiRequest<PathResponse>(API_ENDPOINTS.learningOutcomes.path(id), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  const path = response?.path ? normalizeLearningPath(response.path) : undefined;
  if (!path) throw new Error("Learning path response is missing path data.");
  return {
    path,
    nodes: (response?.nodes ?? []).map(normalizePathNode).filter(isDefined),
  };
}

export async function createLearningPath(
  input: CreateLearningPathInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<LearningPathRecord> {
  const response = await apiRequest<PathCommandResponse>(API_ENDPOINTS.learningOutcomes.paths, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeLearningPath(response) : undefined, "create learning path");
}

export async function publishLearningPath(
  pathId: string,
  input: PublishLearningPathInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<LearningPathRecord> {
  const id = requiredId(pathId, "pathId");
  const response = await apiRequest<PublishPathResponse>(API_ENDPOINTS.learningOutcomes.publishPath(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeLearningPath(response) : undefined, "publish learning path");
}

export async function addPathNode(
  pathId: string,
  input: AddPathNodeInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<PathNodeRecord> {
  const id = requiredId(pathId, "pathId");
  const response = await apiRequest<NodeResponse>(API_ENDPOINTS.learningOutcomes.nodes(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePathNode(response) : undefined, "add learning path node");
}

export async function listCompetencies(
  educationUnitId = "",
  context: LearningOutcomeRequestContext = {},
): Promise<CompetencyRecord[]> {
  const response = await apiRequest<CompetenciesResponse>(withQuery(API_ENDPOINTS.learningOutcomes.competencies, { educationUnitId }), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeCompetency).filter(isDefined);
}

export async function getCompetency(competencyId: string, context: LearningOutcomeRequestContext = {}): Promise<CompetencyRecord> {
  const id = requiredId(competencyId, "competencyId");
  const response = await apiRequest<CompetencyResponseData>(API_ENDPOINTS.learningOutcomes.competency(id), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCompetency(response) : undefined, "get competency");
}

export async function createCompetency(
  input: CreateCompetencyInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<CompetencyRecord> {
  const response = await apiRequest<CompetencyCommandResponse>(API_ENDPOINTS.learningOutcomes.competencies, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCompetency(response) : undefined, "create competency");
}

export async function recordAttainment(
  input: RecordAttainmentInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<AttainmentRecord> {
  const response = await apiRequest<AttainmentCommandResponse>(API_ENDPOINTS.learningOutcomes.attainments, {
    method: "POST",
    portal: context.portal ?? "lms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeAttainment(response) : undefined, "record attainment");
}

export async function listAttainments(learnerId: string, context: LearningOutcomeRequestContext = {}): Promise<AttainmentRecord[]> {
  const id = requiredId(learnerId, "learnerId");
  const response = await apiRequest<AttainmentsResponse>(API_ENDPOINTS.learningOutcomes.learnerAttainments(id), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeAttainment).filter(isDefined);
}

export async function evaluateCompletion(
  pathId: string,
  input: EvaluateCompletionInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<CompletionRecord> {
  const id = requiredId(pathId, "pathId");
  const response = await apiRequest<CompletionCommandResponse>(API_ENDPOINTS.learningOutcomes.completion(id), {
    method: "POST",
    portal: context.portal ?? "lms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCompletion(response) : undefined, "evaluate completion");
}

export async function listCompletions(learnerId: string, context: LearningOutcomeRequestContext = {}): Promise<CompletionRecord[]> {
  const id = requiredId(learnerId, "learnerId");
  const response = await apiRequest<CompletionsResponse>(API_ENDPOINTS.learningOutcomes.learnerCompletions(id), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeCompletion).filter(isDefined);
}

export async function issueCertificate(
  input: IssueCertificateInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<CertificateRecord> {
  const response = await apiRequest<CertificateCommandResponse>(API_ENDPOINTS.learningOutcomes.certificates, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCertificate(response) : undefined, "issue certificate");
}

export async function revokeCertificate(
  certificateId: string,
  input: RevokeCertificateInput,
  idempotencyKey: string,
  context: LearningOutcomeRequestContext = {},
): Promise<CertificateRecord> {
  const id = requiredId(certificateId, "certificateId");
  const response = await apiRequest<CertificateRevokeResponse>(API_ENDPOINTS.learningOutcomes.revokeCertificate(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCertificate(response) : undefined, "revoke certificate");
}

export async function verifyCertificate(verificationId: string, context: LearningOutcomeRequestContext = {}): Promise<CertificateRecord> {
  const id = requiredId(verificationId, "verificationId");
  const response = await apiRequest<CertificateResponseData>(API_ENDPOINTS.learningOutcomes.verifyCertificate(id), {
    portal: context.portal ?? "elearning",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeCertificate(response) : undefined, "verify certificate");
}

export async function listCertificates(learnerId: string, context: LearningOutcomeRequestContext = {}): Promise<CertificateRecord[]> {
  const id = requiredId(learnerId, "learnerId");
  const response = await apiRequest<CertificatesResponse>(API_ENDPOINTS.learningOutcomes.learnerCertificates(id), {
    portal: context.portal ?? "lms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeCertificate).filter(isDefined);
}

function normalizeLearningPath(value: LearningPathResponse): LearningPathRecord | undefined {
  const id = value.id?.trim();
  if (!id) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    title: value.title?.trim() || "Chưa đặt tên lộ trình",
    description: value.description?.trim() || "",
    status: value.status?.trim().toUpperCase() || "DRAFT",
    classId: value.classId?.trim() || undefined,
    educationUnitId: value.educationUnitId?.trim() || undefined,
    nodeCount: finiteNumber(value.nodeCount),
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizePathNode(value: PathNodeResponse): PathNodeRecord | undefined {
  const id = value.id?.trim();
  const contentRefId = value.contentRefId?.trim();
  if (!id || !contentRefId) return undefined;
  return {
    id,
    pathId: value.pathId?.trim() || undefined,
    contentKind: value.contentKind?.trim() || "CONTENT",
    contentRefId,
    required: value.required !== false,
    sortOrder: finiteNumber(value.sortOrder),
    tenantId: value.tenantId?.trim() || undefined,
    createdAt: value.createdAt,
  };
}

function normalizeCompetency(value: CompetencyResponse): CompetencyRecord | undefined {
  const id = value.id?.trim();
  if (!id) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    code: value.code?.trim() || "-",
    name: value.name?.trim() || "Năng lực chưa đặt tên",
    description: value.description?.trim() || "",
    status: value.status?.trim().toUpperCase() || "ACTIVE",
    educationUnitId: value.educationUnitId?.trim() || undefined,
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeAttainment(value: AttainmentResponse): AttainmentRecord | undefined {
  const id = value.id?.trim();
  const learnerId = value.learnerId?.trim();
  const competencyId = value.competencyId?.trim();
  if (!id || !learnerId || !competencyId) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    learnerId,
    competencyId,
    learningPathId: value.learningPathId?.trim() || undefined,
    classId: value.classId?.trim() || undefined,
    status: value.status?.trim().toUpperCase() || "RECORDED",
    evidenceRef: value.evidenceRef?.trim() || "-",
    progressPercent: clampPercent(value.progressPercent),
    achievedAt: value.achievedAt,
    recordVersion: finiteNumber(value.recordVersion),
  };
}

function normalizeCompletion(value: CompletionResponse): CompletionRecord | undefined {
  const id = value.id?.trim();
  const learnerId = value.learnerId?.trim();
  const learningPathId = value.learningPathId?.trim();
  if (!id || !learnerId || !learningPathId) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    learnerId,
    learningPathId,
    status: value.status?.trim().toUpperCase() || "IN_PROGRESS",
    evidenceRef: value.evidenceRef?.trim() || "-",
    progressPercent: clampPercent(value.progressPercent),
    completedNodeCount: finiteNumber(value.completedNodeCount),
    requiredNodeCount: finiteNumber(value.requiredNodeCount),
    evaluatedAt: value.evaluatedAt,
    recordVersion: finiteNumber(value.recordVersion),
  };
}

function normalizeCertificate(value: CertificateResponse): CertificateRecord | undefined {
  const id = value.id?.trim();
  const learnerId = value.learnerId?.trim();
  const learningPathId = value.learningPathId?.trim();
  if (!id || !learnerId || !learningPathId) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    learnerId,
    learningPathId,
    certificateNumber: value.certificateNumber?.trim() || "-",
    verificationId: value.verificationId?.trim() || "-",
    status: value.status?.trim().toUpperCase() || "ISSUED",
    evidenceRef: value.evidenceRef?.trim() || "-",
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
    revokedAt: value.revokedAt,
    revokedBy: value.revokedBy,
    revocationReason: value.revocationReason,
    recordVersion: finiteNumber(value.recordVersion),
  };
}

function normalizeFilters(filters: LearningPathFilters) {
  return {
    status: filters.status?.trim().toUpperCase() || "",
    educationUnitId: filters.educationUnitId?.trim() || "",
    classId: filters.classId?.trim() || "",
  };
}

function withQuery(basePath: string, query: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const value = rawValue?.trim();
    if (value) search.set(key, value);
  }
  const encoded = search.toString();
  return encoded ? `${basePath}?${encoded}` : basePath;
}

function idempotencyHeaders(idempotencyKey: string): HeadersInit {
  const value = idempotencyKey.trim();
  if (!value) throw new Error("idempotencyKey is required for learning-outcome commands.");
  return { "X-Idempotency-Key": value };
}

function requiredId(value: string, label: string) {
  const id = value.trim();
  if (!id) throw new Error(`${label} is required.`);
  return id;
}

function requiredRecord<T>(value: T | undefined, operation: string): T {
  if (!value) throw new Error(`${operation} response is missing data.`);
  return value;
}

function finiteNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function clampPercent(value: number | undefined) {
  return Math.min(100, Math.max(0, finiteNumber(value)));
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

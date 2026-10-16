import type { components } from "@/lib/api/generated/erg-openapi";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ApiResponseData } from "@/lib/api/contract-types";
import { apiRequest } from "@/lib/api-client";

export type LearningStandardsPortal = "lcms" | "lms" | "elearning";
export type LearningStandard = "SCORM_12" | "SCORM_2004";
export type LearningPackageStatus = "UPLOADING" | "VALIDATING" | "READY" | "QUARANTINED";
export type LtiRegistrationStatus = "ACTIVE" | "DISABLED" | string;
export type XapiStatementStatus = "ACCEPTED" | "REJECTED" | string;

export type LearningStandardPackageResponse = components["schemas"]["PackageResponse"];
export type CreateLearningStandardPackageInput = components["schemas"]["CreatePackageRequest"];
export type ValidateLearningStandardPackageInput = components["schemas"]["ValidatePackageRequest"];
export type CreateLtiRegistrationInput = components["schemas"]["CreateLtiRegistrationRequest"];
export type LtiLaunchInput = components["schemas"]["LtiLaunchRequest"];
export type XapiStatementInput = components["schemas"]["XapiStatementRequest"];

type PackagesResponse = ApiResponseData<"/api/v1/learning-standards/packages", "get">;
type PackageResponse = ApiResponseData<"/api/v1/learning-standards/packages/{packageId}", "get">;
type PackageCommandResponse = ApiResponseData<"/api/v1/learning-standards/packages", "post">;
type PackageValidationResponse = ApiResponseData<"/api/v1/learning-standards/packages/{packageId}/validate", "post">;
type PackageLaunchResponse = ApiResponseData<"/api/v1/learning-standards/packages/{packageId}/launch", "get">;
type LtiRegistrationResponse = ApiResponseData<"/api/v1/learning-standards/lti/registrations", "post">;
type LtiLaunchResponse = ApiResponseData<"/api/v1/learning-standards/lti/registrations/{registrationId}/launch", "post">;
type XapiStatementResponse = ApiResponseData<"/api/v1/learning-standards/xapi/statements", "post">;

export type LearningStandardsRequestContext = {
  portal?: LearningStandardsPortal;
  signal?: AbortSignal;
};

export type LearningStandardPackage = {
  id: string;
  tenantId?: string;
  title: string;
  standard: LearningStandard | string;
  packageVersion: string;
  artifactKey: string;
  artifactSha256: string;
  byteSize: number;
  manifestSha256: string;
  manifestIdentifier?: string;
  launchPath: string;
  status: LearningPackageStatus;
  quarantineReason?: string;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LtiRegistration = {
  id: string;
  tenantId?: string;
  issuer: string;
  clientId: string;
  deploymentId: string;
  allowedTargetHost: string;
  status: LtiRegistrationStatus;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type LtiLaunchResult = {
  registrationId: string;
  subject: string;
  targetLinkUri: string;
  status: string;
  acceptedAt?: string;
};

export type XapiStatementResult = {
  id: string;
  tenantId?: string;
  statementId: string;
  actorHash: string;
  verb: string;
  objectId: string;
  payloadSha256: string;
  status: XapiStatementStatus;
  occurredAt?: string;
  receivedAt?: string;
  recordVersion: number;
};

export const learningStandardsQueryKeys = {
  root: (tenantId: string, accountId: string, workspace: string) =>
    ["learning-standards", tenantId, accountId, workspace] as const,
  packages: (tenantId: string, accountId: string, workspace: string, status = "") =>
    [...learningStandardsQueryKeys.root(tenantId, accountId, workspace), "packages", status.trim().toUpperCase()] as const,
  package: (tenantId: string, accountId: string, workspace: string, packageId: string) =>
    [...learningStandardsQueryKeys.root(tenantId, accountId, workspace), "package", packageId] as const,
};

export async function listLearningStandardPackages(
  status = "",
  context: LearningStandardsRequestContext = {},
): Promise<LearningStandardPackage[]> {
  const response = await apiRequest<PackagesResponse>(withQuery(API_ENDPOINTS.learningStandards.packages, { status }), {
    portal: context.portal ?? "lcms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizePackage).filter(isDefined);
}

export async function getLearningStandardPackage(
  packageId: string,
  context: LearningStandardsRequestContext = {},
): Promise<LearningStandardPackage> {
  const id = requiredId(packageId, "packageId");
  const response = await apiRequest<PackageResponse>(API_ENDPOINTS.learningStandards.package(id), {
    portal: context.portal ?? "lcms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePackage(response) : undefined, "get learning-standard package");
}

export async function createLearningStandardPackage(
  input: CreateLearningStandardPackageInput,
  idempotencyKey: string,
  context: LearningStandardsRequestContext = {},
): Promise<LearningStandardPackage> {
  const response = await apiRequest<PackageCommandResponse>(API_ENDPOINTS.learningStandards.packages, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePackage(response) : undefined, "create learning-standard package");
}

export async function validateLearningStandardPackage(
  packageId: string,
  input: ValidateLearningStandardPackageInput,
  idempotencyKey: string,
  context: LearningStandardsRequestContext = {},
): Promise<LearningStandardPackage> {
  const id = requiredId(packageId, "packageId");
  const response = await apiRequest<PackageValidationResponse>(API_ENDPOINTS.learningStandards.validatePackage(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePackage(response) : undefined, "validate learning-standard package");
}

export async function launchLearningStandardPackage(
  packageId: string,
  context: LearningStandardsRequestContext = {},
): Promise<LearningStandardPackage> {
  const id = requiredId(packageId, "packageId");
  const response = await apiRequest<PackageLaunchResponse>(API_ENDPOINTS.learningStandards.launchPackage(id), {
    portal: context.portal ?? "elearning",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePackage(response) : undefined, "launch learning-standard package");
}

export async function createLtiRegistration(
  input: CreateLtiRegistrationInput,
  idempotencyKey: string,
  context: LearningStandardsRequestContext = {},
): Promise<LtiRegistration> {
  const response = await apiRequest<LtiRegistrationResponse>(API_ENDPOINTS.learningStandards.ltiRegistrations, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeLtiRegistration(response) : undefined, "create LTI registration");
}

export async function launchLtiRegistration(
  registrationId: string,
  input: LtiLaunchInput,
  idempotencyKey: string,
  context: LearningStandardsRequestContext = {},
): Promise<LtiLaunchResult> {
  const id = requiredId(registrationId, "registrationId");
  const response = await apiRequest<LtiLaunchResponse>(API_ENDPOINTS.learningStandards.ltiLaunch(id), {
    method: "POST",
    portal: context.portal ?? "lms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeLtiLaunch(response) : undefined, "launch LTI registration");
}

export async function ingestXapiStatement(
  input: XapiStatementInput,
  idempotencyKey: string,
  context: LearningStandardsRequestContext = {},
): Promise<XapiStatementResult> {
  const response = await apiRequest<XapiStatementResponse>(API_ENDPOINTS.learningStandards.xapiStatements, {
    method: "POST",
    portal: context.portal ?? "lms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeXapiStatement(response) : undefined, "ingest xAPI statement");
}

function normalizePackage(value: LearningStandardPackageResponse): LearningStandardPackage | undefined {
  const id = value.id?.trim();
  if (!id) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    title: value.title?.trim() || "Learning package chưa đặt tên",
    standard: value.standard?.trim().toUpperCase() || "SCORM_12",
    packageVersion: value.packageVersion?.trim() || "-",
    artifactKey: value.artifactKey?.trim() || "-",
    artifactSha256: value.artifactSha256?.trim().toLowerCase() || "-",
    byteSize: finiteNumber(value.byteSize),
    manifestSha256: value.manifestSha256?.trim().toLowerCase() || "-",
    manifestIdentifier: value.manifestIdentifier?.trim() || undefined,
    launchPath: value.launchPath?.trim() || "",
    status: normalizeStatus(value.status),
    quarantineReason: value.quarantineReason?.trim() || undefined,
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeLtiRegistration(value: NonNullable<LtiRegistrationResponse>): LtiRegistration | undefined {
  const id = value.id?.trim();
  if (!id) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    issuer: value.issuer?.trim() || "-",
    clientId: value.clientId?.trim() || "-",
    deploymentId: value.deploymentId?.trim() || "-",
    allowedTargetHost: value.allowedTargetHost?.trim().toLowerCase() || "-",
    status: value.status?.trim().toUpperCase() || "UNKNOWN",
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeLtiLaunch(value: NonNullable<LtiLaunchResponse>): LtiLaunchResult | undefined {
  const registrationId = value.registrationId?.trim();
  if (!registrationId) return undefined;
  return {
    registrationId,
    subject: value.subject?.trim() || "-",
    targetLinkUri: value.targetLinkUri?.trim() || "",
    status: value.status?.trim().toUpperCase() || "UNKNOWN",
    acceptedAt: value.acceptedAt,
  };
}

function normalizeXapiStatement(value: NonNullable<XapiStatementResponse>): XapiStatementResult | undefined {
  const id = value.id?.trim();
  const statementId = value.statementId?.trim();
  if (!id || !statementId) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    statementId,
    actorHash: value.actorHash?.trim() || "-",
    verb: value.verb?.trim() || "-",
    objectId: value.objectId?.trim() || "-",
    payloadSha256: value.payloadSha256?.trim().toLowerCase() || "-",
    status: value.status?.trim().toUpperCase() || "UNKNOWN",
    occurredAt: value.occurredAt,
    receivedAt: value.receivedAt,
    recordVersion: finiteNumber(value.recordVersion),
  };
}

function normalizeStatus(value: string | undefined): LearningPackageStatus {
  const normalized = value?.trim().toUpperCase();
  return normalized === "VALIDATING" || normalized === "READY" || normalized === "QUARANTINED"
    ? normalized
    : "UPLOADING";
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
  if (!value) throw new Error("idempotencyKey is required for learning-standards commands.");
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

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiRequest }));

import {
  createLearningStandardPackage,
  ingestXapiStatement,
  launchLearningStandardPackage,
  launchLtiRegistration,
  learningStandardsQueryKeys,
  listLearningStandardPackages,
  validateLearningStandardPackage,
} from "@/features/lcms/integrations/learning-standards/api/learning-standards-api";

describe("learning standards REST adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists and normalizes SCORM packages without inventing invalid rows", async () => {
    apiRequest.mockResolvedValueOnce([
      {
        id: "pkg-1",
        tenantId: "tenant-a",
        title: "  SCORM onboarding  ",
        standard: "scorm_2004",
        packageVersion: " 1.0 ",
        artifactKey: "packages/pkg-1.zip",
        artifactSha256: "A".repeat(64),
        byteSize: 1024,
        manifestSha256: "B".repeat(64),
        launchPath: "index.html",
        status: "ready",
        recordVersion: 4,
      },
      { title: "missing-id" },
    ]);

    await expect(listLearningStandardPackages(" ready ", { portal: "lcms" })).resolves.toEqual([
      expect.objectContaining({
        id: "pkg-1",
        title: "SCORM onboarding",
        standard: "SCORM_2004",
        status: "READY",
        recordVersion: 4,
      }),
    ]);
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/learning-standards/packages?status=ready",
      expect.objectContaining({ portal: "lcms", auth: "required" }),
    );
  });

  it("sends idempotency and expected-version payloads for package commands", async () => {
    apiRequest.mockResolvedValueOnce({ id: "pkg-1", title: "Package", standard: "SCORM_12", status: "UPLOADING" });
    await createLearningStandardPackage({
      title: "Package",
      standard: "SCORM_12",
      packageVersion: "1.0",
      artifactKey: "packages/pkg.zip",
      artifactSha256: "a".repeat(64),
      byteSize: 42,
      manifestSha256: "b".repeat(64),
      launchPath: "index.html",
    }, "create-key", { portal: "lcms" });
    expect(apiRequest.mock.calls[0][1]).toEqual(expect.objectContaining({
      method: "POST",
      portal: "lcms",
      headers: { "X-Idempotency-Key": "create-key" },
    }));

    apiRequest.mockResolvedValueOnce({ id: "pkg-1", title: "Package", standard: "SCORM_12", status: "READY", recordVersion: 2 });
    await validateLearningStandardPackage("pkg-1", { expectedVersion: 1, manifestXml: "<manifest identifier=\"m\"/>" }, "validate-key", { portal: "lcms" });
    expect(apiRequest.mock.calls[1][0]).toBe("/api/v1/learning-standards/packages/pkg-1/validate");
    expect(JSON.parse(apiRequest.mock.calls[1][1].body)).toEqual({ expectedVersion: 1, manifestXml: "<manifest identifier=\"m\"/>" });
    expect(apiRequest.mock.calls[1][1].headers).toEqual({ "X-Idempotency-Key": "validate-key" });
  });

  it("keeps launch and xAPI transports server-confirmed and never stores actor material", async () => {
    apiRequest.mockResolvedValueOnce({ id: "pkg-1", title: "Package", standard: "SCORM_12", status: "READY", launchPath: "index.html" });
    await expect(launchLearningStandardPackage("pkg-1", { portal: "elearning" })).resolves.toMatchObject({ id: "pkg-1", status: "READY" });
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/learning-standards/packages/pkg-1/launch",
      expect.objectContaining({ portal: "elearning", auth: "required" }),
    );

    apiRequest.mockResolvedValueOnce({ id: "statement-1", statementId: "statement-1", actorHash: "hash", verb: "completed", objectId: "pkg-1", payloadSha256: "c".repeat(64), status: "ACCEPTED" });
    await ingestXapiStatement({ statementId: "statement-1", actorId: "learner@example.com", verb: "completed", objectId: "pkg-1", payloadSha256: "c".repeat(64) }, "xapi-key", { portal: "lms" });
    expect(JSON.parse(apiRequest.mock.calls[1][1].body)).toEqual(expect.objectContaining({ actorId: "learner@example.com" }));
    expect(apiRequest.mock.calls[1][1].headers).toEqual({ "X-Idempotency-Key": "xapi-key" });
  });

  it("uses the contract LTI launch path and rejects missing idempotency keys", async () => {
    apiRequest.mockResolvedValueOnce({ registrationId: "lti-1", subject: "learner-1", targetLinkUri: "https://lti.example.test/launch", status: "ACCEPTED" });
    await expect(launchLtiRegistration("lti-1", { signedToken: "token", nonce: "nonce" }, "lti-key", { portal: "lms" })).resolves.toMatchObject({ registrationId: "lti-1", status: "ACCEPTED" });
    expect(apiRequest.mock.calls[0][0]).toBe("/api/v1/learning-standards/lti/registrations/lti-1/launch");
    await expect(launchLtiRegistration("lti-1", { signedToken: "token", nonce: "nonce" }, "  ")).rejects.toThrow("idempotencyKey");
  });

  it("scopes query keys by tenant, account and workspace", () => {
    expect(learningStandardsQueryKeys.packages("tenant-a", "account-a", "ADMIN", "ready")).toEqual([
      "learning-standards", "tenant-a", "account-a", "ADMIN", "packages", "READY",
    ]);
    expect(learningStandardsQueryKeys.package("tenant-a", "account-a", "STUDENT", "pkg-1")).toEqual([
      "learning-standards", "tenant-a", "account-a", "STUDENT", "package", "pkg-1",
    ]);
  });
});

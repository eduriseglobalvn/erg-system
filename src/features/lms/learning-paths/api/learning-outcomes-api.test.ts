import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiRequest }));

import {
  createLearningPath,
  getLearningPath,
  learningOutcomesQueryKeys,
  listLearningPaths,
  publishLearningPath,
} from "@/features/lms/learning-paths/api/learning-outcomes-api";

describe("learning outcomes REST adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("serializes scoped path filters and normalizes optional contract fields", async () => {
    apiRequest.mockResolvedValueOnce([
      { id: "path-1", title: "  Toán 10 ", status: "published", nodeCount: undefined, recordVersion: 3 },
      { title: "missing-id" },
    ]);

    await expect(listLearningPaths({ status: "published", educationUnitId: "unit-1", classId: "class-1" }, { portal: "lcms" })).resolves.toEqual([
      expect.objectContaining({ id: "path-1", title: "Toán 10", status: "PUBLISHED", nodeCount: 0, recordVersion: 3 }),
    ]);
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/learning-outcomes/paths?status=published&educationUnitId=unit-1&classId=class-1",
      expect.objectContaining({ portal: "lcms", auth: "required" }),
    );
  });

  it("keeps detail nodes and rejects an empty server payload", async () => {
    apiRequest.mockResolvedValueOnce({ path: { id: "p1", title: "Path", status: "DRAFT" }, nodes: [{ id: "n1", contentRefId: "q1", contentKind: "QUIZ", required: true }] });
    await expect(getLearningPath("p1")).resolves.toMatchObject({ path: { id: "p1" }, nodes: [{ id: "n1", contentRefId: "q1" }] });

    apiRequest.mockResolvedValueOnce(undefined);
    await expect(getLearningPath("p1")).rejects.toThrow("missing path data");
  });

  it("sends idempotency and expected version for commands", async () => {
    apiRequest.mockResolvedValueOnce({ id: "p1", title: "Path", status: "DRAFT", recordVersion: 1 });
    await createLearningPath({ title: "Path" }, "create-key", { portal: "lcms" });
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/learning-outcomes/paths",
      expect.objectContaining({ method: "POST", headers: { "X-Idempotency-Key": "create-key" }, portal: "lcms" }),
    );

    apiRequest.mockResolvedValueOnce({ id: "p1", title: "Path", status: "PUBLISHED", recordVersion: 2 });
    await publishLearningPath("p1", { expectedVersion: 1 }, "publish-key", { portal: "lcms" });
    expect(JSON.parse(apiRequest.mock.calls[1][1].body)).toEqual({ expectedVersion: 1 });
    expect(apiRequest.mock.calls[1][1].headers).toEqual({ "X-Idempotency-Key": "publish-key" });
  });

  it("scopes query keys by tenant, account and workspace", () => {
    expect(learningOutcomesQueryKeys.paths("tenant-a", "account-a", "ADMIN", { status: "published" })).toEqual([
      "learning-outcomes", "tenant-a", "account-a", "ADMIN", "paths", { status: "PUBLISHED", educationUnitId: "", classId: "" },
    ]);
    expect(learningOutcomesQueryKeys.learner("tenant-a", "account-a", "STUDENT", "learner-a")).toEqual([
      "learning-outcomes", "tenant-a", "account-a", "STUDENT", "learner", "learner-a",
    ]);
  });
});

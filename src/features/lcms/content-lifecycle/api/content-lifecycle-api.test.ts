import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiRequest }));

import {
  normalizeContentLifecycleResponse,
  transitionContentLifecycle,
} from "@/features/lcms/content-lifecycle/api/content-lifecycle-api";

describe("content lifecycle REST adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends the contract body, idempotency header and expected version", async () => {
    apiRequest.mockResolvedValueOnce({
      resourceKind: "CONTENT_ITEM",
      resourceId: "content-1",
      tenantId: "tenant-a",
      previousState: "DRAFT",
      state: "IN_REVIEW",
      version: 4,
      actorId: "admin-1",
      replayed: false,
      reason: "ready for review",
    });

    await expect(transitionContentLifecycle({
      resourceKind: "CONTENT_ITEM",
      resourceId: "content-1",
      targetState: "IN_REVIEW",
      expectedVersion: 3,
      reason: " ready for review ",
      idempotencyKey: "lifecycle-key-1",
    })).resolves.toMatchObject({ resourceId: "content-1", state: "IN_REVIEW", version: 4 });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/content/CONTENT_ITEM/content-1/lifecycle",
      expect.objectContaining({
        method: "POST",
        portal: "lcms",
        auth: "required",
        headers: { "X-Idempotency-Key": "lifecycle-key-1" },
      }),
    );
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toEqual({
      targetState: "IN_REVIEW",
      idempotencyKey: "lifecycle-key-1",
      expectedVersion: 3,
      reason: "ready for review",
    });
  });

  it("rejects incomplete server responses instead of inventing state", () => {
    expect(() => normalizeContentLifecycleResponse({
      resourceKind: "CONTENT_ITEM",
      resourceId: "content-1",
      state: "PUBLISHED",
    } as never)).toThrow("Invalid content lifecycle response");
  });
});


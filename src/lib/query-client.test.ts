import { beforeEach, expect, it, vi } from "vitest";

const error = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error } }));

import { reportUnhandledMutationError } from "@/lib/query-client";

beforeEach(() => error.mockClear());

it("toasts a failed mutation nobody handles", () => {
  reportUnhandledMutationError(new Error("boom"), {});
  expect(error).toHaveBeenCalledWith("boom");
});

it("stays quiet when the mutation handles its own error or is silent", () => {
  reportUnhandledMutationError(new Error("x"), { onError: () => {} });
  reportUnhandledMutationError(new Error("x"), { meta: { silent: true } });
  expect(error).not.toHaveBeenCalled();
});

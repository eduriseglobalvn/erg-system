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

import { reportQueryError } from "@/lib/query-client";

const query = (over: Record<string, unknown> = {}) =>
  ({ queryHash: "h1", meta: undefined, state: { data: undefined }, ...over }) as never;

it("toasts a failed background refetch once per query hash", () => {
  reportQueryError(new Error("x"), query({ state: { data: [1] } }));
  expect(error).toHaveBeenCalledWith(expect.stringContaining("Không thể"), { id: "query-error:h1" });
});

it("toasts first-load failures only with meta.toastOnError", () => {
  reportQueryError(new Error("x"), query());
  expect(error).not.toHaveBeenCalled();
  reportQueryError(new Error("x"), query({ meta: { toastOnError: true } }));
  expect(error).toHaveBeenCalledTimes(1);
});

it("never toasts silent queries or 401s", () => {
  reportQueryError(new Error("x"), query({ meta: { silent: true, toastOnError: true }, state: { data: 1 } }));
  reportQueryError(Object.assign(new Error("x"), { status: 401 }), query({ state: { data: 1 } }));
  expect(error).not.toHaveBeenCalled();
});

const rateLimitError = (seconds?: number) =>
  Object.assign(new Error("Too many requests"), { status: 429, details: seconds ? { retryAfterSeconds: seconds } : undefined });

it("shows one 'system busy' toast for a rate-limited mutation, with the wait in seconds", () => {
  reportUnhandledMutationError(rateLimitError(30), {});
  expect(error).toHaveBeenCalledTimes(1);
  expect(error).toHaveBeenCalledWith("Hệ thống đang đông, vui lòng thử lại sau 30 giây", { id: "rate-limited" });
});

it("shows the 'system busy' toast for a rate-limited query even on first load", () => {
  reportQueryError(rateLimitError(30), query());
  expect(error).toHaveBeenCalledWith("Hệ thống đang đông, vui lòng thử lại sau 30 giây", { id: "rate-limited" });
});

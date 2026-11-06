import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { notificationQueryKeys, resolveNotificationQueryScope } from "@/features/notifications/api/notification-api";
import { TEACHER_LOCAL_SESSION_KEY, portalSessionKey } from "@/platform/auth/api/auth-token-storage";

import {
  campaignKeys,
  isAudienceEmpty,
  normalizeAudience,
  useAckNotification,
  useCampaignEstimate,
  useCancelCampaign,
  useCreateCampaign,
  usePeopleSearch,
  useResolvePeople,
  useScheduleCampaign,
  useSendCampaign,
  useUpdateCampaign,
} from "./campaign-query";
import type { CampaignAudience } from "./campaign-types";

let client: QueryClient;
let fetchMock: ReturnType<typeof vi.fn>;

const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);

function respond(data: unknown) {
  fetchMock.mockImplementation(
    async () => new Response(JSON.stringify({ data }), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
}

function calls() {
  return fetchMock.mock.calls.map(([url, init]) => ({ url: String(url), method: ((init as RequestInit | undefined)?.method ?? "GET").toUpperCase(), body: (init as RequestInit | undefined)?.body }));
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({ accountId: "lms-user", accessToken: "lms-token", loggedInAt: new Date().toISOString(), portal: "lms", portals: ["lms"], rememberMe: true }),
  );
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  client.clear();
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("useSendCampaign POSTs /{id}/send and invalidates every SENT/SCHEDULED/DRAFT list, the summary and the detail", async () => {
  respond({ id: "c1", status: "SENT" });
  client.setQueryData(campaignKeys.list("SENT", false), { items: [] });
  client.setQueryData(campaignKeys.list("SENT", true), { items: [] });
  client.setQueryData(campaignKeys.list("DRAFT", true), { items: [] });
  client.setQueryData(campaignKeys.detail("c1"), { id: "c1" });
  client.setQueryData(campaignKeys.summary(), {});

  const { result } = renderHook(() => useSendCampaign(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync("c1");
  });

  const [call] = calls();
  expect(call?.method).toBe("POST");
  expect(call?.url).toBe("https://api.erg.test/api/v1/notification-campaigns/c1/send");
  for (const key of [campaignKeys.list("SENT", false), campaignKeys.list("SENT", true), campaignKeys.list("DRAFT", true), campaignKeys.detail("c1"), campaignKeys.summary()]) {
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  }
});

function seedCampaignCaches(id: string) {
  const keys = [campaignKeys.list("SENT", false), campaignKeys.list("SCHEDULED", true), campaignKeys.list("DRAFT", true), campaignKeys.summary(), campaignKeys.detail(id)];
  for (const key of keys) client.setQueryData(key, {});
  return keys;
}

test.each([
  ["useCreateCampaign", () => useCreateCampaign(), (m: unknown) => (m as ReturnType<typeof useCreateCampaign>).mutateAsync({ title: "t", body: "b", audience: { wholeTenant: true } }), "POST", "/api/v1/notification-campaigns", false],
  ["useUpdateCampaign", () => useUpdateCampaign(), (m: unknown) => (m as ReturnType<typeof useUpdateCampaign>).mutateAsync({ id: "c1", draft: { title: "t", body: "b", audience: { wholeTenant: true } } }), "PUT", "/api/v1/notification-campaigns/c1", true],
  ["useCancelCampaign", () => useCancelCampaign(), (m: unknown) => (m as ReturnType<typeof useCancelCampaign>).mutateAsync("c1"), "POST", "/api/v1/notification-campaigns/c1/cancel", true],
] as const)("%s calls the API and invalidates lists and summary", async (_name, useHook, run, method, path, hasDetail) => {
  respond({ id: "c1" });
  const keys = seedCampaignCaches("c1");
  const { result } = renderHook(() => useHook(), { wrapper });
  await act(async () => {
    await run(result.current);
  });
  expect(calls()[0]?.method).toBe(method);
  expect(calls()[0]?.url).toBe("https://api.erg.test" + path);
  for (const key of keys.slice(0, 4)) expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  // create has no id yet, so only the list-wide keys are guaranteed
  expect(client.getQueryState(campaignKeys.detail("c1"))?.isInvalidated).toBe(hasDetail);
});

test("useScheduleCampaign sends scheduledAt in the body", async () => {
  respond({ id: "c1", status: "SCHEDULED" });
  const { result } = renderHook(() => useScheduleCampaign("2026-11-10T01:00:00.000Z"), { wrapper });
  await act(async () => {
    await result.current.mutateAsync("c1");
  });
  const [call] = calls();
  expect(call?.url).toBe("https://api.erg.test/api/v1/notification-campaigns/c1/schedule");
  expect(JSON.parse(String(call?.body))).toEqual({ scheduledAt: "2026-11-10T01:00:00.000Z" });
});

test("usePeopleSearch makes no request for fewer than 2 characters, and one for 2+", async () => {
  respond([{ userId: "u1", displayName: "Mai" }]);
  const short = renderHook(() => usePeopleSearch(" M "), { wrapper });
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(short.result.current.fetchStatus).toBe("idle");

  const long = renderHook(() => usePeopleSearch("Ma"), { wrapper });
  await waitFor(() => expect(long.result.current.data).toEqual([{ userId: "u1", displayName: "Mai" }]));
  expect(calls()).toHaveLength(1);
  expect(calls()[0]?.url).toBe("https://api.erg.test/api/v1/notification-campaigns/people?q=Ma");
});

test("usePeopleSearch clears results when the term drops below 2 characters, without another request", async () => {
  respond([{ userId: "u1", displayName: "Mai" }]);
  const { result, rerender } = renderHook(({ q }: { q: string }) => usePeopleSearch(q), { wrapper, initialProps: { q: "Ma" } });
  await waitFor(() => expect(result.current.data).toHaveLength(1));
  rerender({ q: "M" });
  expect(result.current.data).toBeUndefined();
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(result.current.data).toBeUndefined();
  expect(calls()).toHaveLength(1);
});

test("useResolvePeople POSTs the pasted lines", async () => {
  respond({ matched: [], notFound: ["x"], ambiguous: [] });
  const { result } = renderHook(() => useResolvePeople(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync(["x"]);
  });
  expect(calls()[0]?.url).toBe("https://api.erg.test/api/v1/notification-campaigns/people/resolve");
  expect(JSON.parse(String(calls()[0]?.body))).toEqual({ lines: ["x"] });
});

test("isAudienceEmpty mirrors the backend rule", () => {
  expect(isAudienceEmpty({})).toBe(true);
  expect(isAudienceEmpty({ classIds: [], roles: [] })).toBe(true);
  expect(isAudienceEmpty({ wholeTenant: false })).toBe(true);
  expect(isAudienceEmpty({ wholeTenant: true })).toBe(false);
  expect(isAudienceEmpty({ gradeIds: ["10"] })).toBe(false);
  expect(isAudienceEmpty({ userIds: ["u1"] })).toBe(false);
});

test("useCampaignEstimate stays idle for an empty audience", async () => {
  respond({ total: 0 });
  const { result } = renderHook(() => useCampaignEstimate({ classIds: [] }), { wrapper });
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.current.fetchStatus).toBe("idle");
});

test("useCampaignEstimate sends nothing before 300 ms and one request (last audience) after", async () => {
  vi.useFakeTimers();
  try {
    respond({ total: 7, students: 7 });
    const { result, rerender } = renderHook(({ audience }: { audience: CampaignAudience }) => useCampaignEstimate(audience), {
      wrapper,
      initialProps: { audience: {} as CampaignAudience },
    });
    rerender({ audience: { classIds: ["a"] } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    rerender({ audience: { classIds: ["a", "b"] } });
    rerender({ audience: { classIds: ["a", "b", "c"] } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(calls()).toHaveLength(1);
    expect(calls()[0]?.method).toBe("POST");
    expect(JSON.parse(String(calls()[0]?.body))).toEqual({ classIds: ["a", "b", "c"] });
    expect(result.current.data).toEqual({ total: 7, students: 7 });
  } finally {
    vi.useRealTimers();
  }
});

test("useCampaignEstimate drops the previous breakdown as soon as the audience is cleared", async () => {
  respond({ total: 3 });
  const { result, rerender } = renderHook(({ audience }: { audience: CampaignAudience }) => useCampaignEstimate(audience), {
    wrapper,
    initialProps: { audience: { classIds: ["a"] } as CampaignAudience },
  });
  await waitFor(() => expect(result.current.data).toEqual({ total: 3 }));
  rerender({ audience: { classIds: [], wholeTenant: false } });
  expect(result.current.data).toBeUndefined();
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(result.current.data).toBeUndefined();
  expect(calls()).toHaveLength(1);
});

test("normalizeAudience makes element order irrelevant and drops empty parts", () => {
  expect(normalizeAudience({ classIds: ["b", "a", "a"], userIds: [], wholeTenant: false })).toEqual({ classIds: ["a", "b"] });
  expect(JSON.stringify(normalizeAudience({ roles: ["STUDENT"], classIds: ["x"], wholeTenant: true }))).toBe(
    JSON.stringify(normalizeAudience({ wholeTenant: true, classIds: ["x"], roles: ["STUDENT"] })),
  );
});

test("useCampaignEstimate shares one request between [a,b] and [b,a]", async () => {
  respond({ total: 2 });
  const first = renderHook(() => useCampaignEstimate({ classIds: ["a", "b"] }), { wrapper });
  const second = renderHook(() => useCampaignEstimate({ classIds: ["b", "a"] }), { wrapper });
  await waitFor(() => expect(first.result.current.data).toEqual({ total: 2 }));
  await waitFor(() => expect(second.result.current.data).toEqual({ total: 2 }));
  expect(calls()).toHaveLength(1);
});

test("useAckNotification POSTs /notifications/{id}/ack and refreshes the inbox and unread badge", async () => {
  respond({ id: "n1", ackedAt: "2026-11-07T01:00:00Z", readAt: "2026-11-07T01:00:00Z" });
  const scope = resolveNotificationQueryScope("lms");
  const inbox = notificationQueryKeys.inbox("lms", "all", 0, 20, scope);
  const unread = notificationQueryKeys.unreadCount("lms", scope);
  const otherPortal = notificationQueryKeys.unreadCount("elearning", scope);
  client.setQueryData(inbox, {});
  client.setQueryData(unread, {});
  client.setQueryData(otherPortal, {});

  const { result } = renderHook(() => useAckNotification("lms"), { wrapper });
  await act(async () => {
    await result.current.mutateAsync("n1");
  });

  expect(calls()[0]?.method).toBe("POST");
  expect(calls()[0]?.url).toContain("/api/v1/notifications/n1/ack?portal=lms");
  expect(result.current.data).toBeUndefined();
  await waitFor(() => expect(client.getQueryState(inbox)?.isInvalidated).toBe(true));
  expect(client.getQueryState(unread)?.isInvalidated).toBe(true);
  expect(client.getQueryState(otherPortal)?.isInvalidated).toBe(false);
});

import { QueryClient } from "@tanstack/react-query";

import {
  clearStoredAuthSessions,
  writeStoredAuthIdentity,
  type StoredAuthIdentity,
} from "@/platform/auth/api/auth-token-storage";

export function createTransportIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
        staleTime: 0,
      },
    },
  });
}

export function storeIntegrationSession(overrides: Partial<StoredAuthIdentity> = {}) {
  const session: StoredAuthIdentity = {
    accountId: "teacher-1",
    accessToken: "access-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    loggedInAt: new Date().toISOString(),
    portal: "lms",
    portals: ["lms"],
    rememberMe: true,
    tenantId: "tenant-a",
    ...overrides,
  };
  writeStoredAuthIdentity(session);
  return session;
}

export function resetTransportIntegrationState() {
  clearStoredAuthSessions();
  window.localStorage.clear();
  window.sessionStorage.clear();
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

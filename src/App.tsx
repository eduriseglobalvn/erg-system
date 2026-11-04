import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// Update banner is not needed for first paint.
const GlobalPwaBanner = lazy(() => import("@/components/pwa/global-pwa-banner").then((m) => ({ default: m.GlobalPwaBanner })));

import { PortalNotificationsSourceContext } from "@/components/portal/use-portal-notifications";
import { usePortalNotifications } from "@/features/notifications/hooks/use-portal-notifications";
import { I18nProvider } from "@/platform/i18n";
import { appQueryClient } from "@/lib/query-client";
import { createAppRouter } from "@/routes/app-routes";
import { hasApiBase } from "@/lib/api-client";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";
import { clearPersistedQueryScope, createQueryPersister, QUERY_CACHE_BUSTER, shouldDehydratePersistedQuery, queryCacheScopeKey } from "@/lib/query-persistence";
import { getAuthScope, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { resolveCurrentPortal } from "@/platform/auth/api/auth-token-storage";
import { AUTH_ACCOUNT_CHANGED_EVENT } from "@/platform/auth/api/auth-storage";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT } from "@/lib/api-client";
import { canonicalWorkspaceForPath } from "@/platform/workspaces/workspace-route";
import { workspaceFromLegacyPortal } from "@/platform/workspaces/legacy-portal-compat";

function currentQueryScopeKey() {
  const portal = resolveCurrentPortal();
  const session = getAuthScope(portal).session;
  const account = getCurrentAccount(portal);
  const workspace = typeof window === "undefined"
    ? workspaceFromLegacyPortal(portal)
    : canonicalWorkspaceForPath(window.location.pathname) ?? workspaceFromLegacyPortal(portal);
  return queryCacheScopeKey({ portal, workspace, tenantId: session?.tenantId ?? "default", accountId: account?.id ?? "anonymous" });
}

export default function App() {
  const router = useMemo(() => createAppRouter(), []);
  const showQueryDevtools = import.meta.env.DEV && import.meta.env.VITE_SHOW_QUERY_DEVTOOLS !== "false";
  const [scopeKey, setScopeKey] = useState(currentQueryScopeKey);
  const persistOptions = useMemo(() => {
    return {
      persister: createQueryPersister(scopeKey),
      maxAge: 24 * 60 * 60 * 1000,
      buster: QUERY_CACHE_BUSTER,
      dehydrateOptions: { shouldDehydrateQuery: shouldDehydratePersistedQuery },
    };
  }, [scopeKey]);

  useEffect(() => {
    const handleScopeChange = () => {
      const previousScope = scopeKey;
      appQueryClient.clear();
      setScopeKey(currentQueryScopeKey());
      void clearPersistedQueryScope(previousScope);
    };
    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleScopeChange);
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, handleScopeChange);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, handleScopeChange);
    return () => {
      window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleScopeChange);
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, handleScopeChange);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, handleScopeChange);
    };
  }, [scopeKey]);

  return (
    <PersistQueryClientProvider client={appQueryClient} persistOptions={persistOptions}>
      <I18nProvider>
        <PortalNotificationsSourceContext.Provider value={usePortalNotifications}>
          <AppRouterProvider router={router} />
        </PortalNotificationsSourceContext.Provider>
        <Suspense fallback={null}><GlobalPwaBanner /></Suspense>
      </I18nProvider>
      {showQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
    </PersistQueryClientProvider>
  );
}

function AppRouterProvider({ router }: { router: ReturnType<typeof createAppRouter> }) {
  const authSession = useAuthSession();
  // Login persists the server session before the mutation promise resolves.
  // During the same tick, the hook state can still represent the pre-login
  // render while TanStack Router evaluates a deep-link guard. Hydrate the
  // route context from the persisted session as a synchronous fallback so a
  // valid login cannot be redirected through the public index first.
  const currentPortal = resolveCurrentPortal();
  const persistedAuth = useMemo(
    () => ({ account: getCurrentAccount(currentPortal), session: getAuthScope(currentPortal).session }),
    [currentPortal],
  );
  const effectiveAccount = authSession.account ?? persistedAuth.account;
  const effectiveSession = authSession.session ?? persistedAuth.session;
  const auth = useMemo(
    () => createAuthRouteState({ account: effectiveAccount, session: effectiveSession, apiBacked: hasApiBase() }),
    [effectiveAccount, effectiveSession],
  );
  const authSignature = useMemo(
    () => JSON.stringify({
      authenticated: auth.authenticated,
      lifecycle: auth.lifecycle?.status ?? null,
      permissions: auth.permissions,
      deniedPermissions: auth.deniedPermissions,
      portals: auth.portals,
      workspaces: auth.workspaces,
    }),
    [auth],
  );

  useEffect(() => {
    void router.invalidate();
  }, [authSignature, router]);

  return <RouterProvider context={{ auth }} router={router} />;
}

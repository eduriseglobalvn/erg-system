import { useEffect, useMemo } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { I18nProvider } from "@/platform/i18n";
import { appQueryClient } from "@/lib/query-client";
import { createAppRouter } from "@/routes/app-routes";
import { hasApiBase } from "@/lib/api-client";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { createAuthRouteState } from "@/platform/auth/router/auth-route-context";

export default function App() {
  const router = useMemo(() => createAppRouter(), []);
  const showQueryDevtools = import.meta.env.DEV && import.meta.env.VITE_SHOW_QUERY_DEVTOOLS !== "false";

  return (
    <QueryClientProvider client={appQueryClient}>
      <I18nProvider>
        <AppRouterProvider router={router} />
      </I18nProvider>
      {showQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}

function AppRouterProvider({ router }: { router: ReturnType<typeof createAppRouter> }) {
  const authSession = useAuthSession();
  const auth = useMemo(
    () => createAuthRouteState({ account: authSession.account, session: authSession.session, apiBacked: hasApiBase() }),
    [authSession.account, authSession.session],
  );

  useEffect(() => {
    void router.invalidate();
  }, [auth, router]);

  return <RouterProvider context={{ auth }} router={router} />;
}

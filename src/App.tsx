import { HashRouter, BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { I18nProvider } from "@/platform/i18n";
import { shouldUseHashRouter } from "@/lib/platform";
import { appQueryClient } from "@/lib/query-client";
import { AppRoutes } from "@/routes/app-routes";

export default function App() {
  const Router = shouldUseHashRouter() ? HashRouter : BrowserRouter;
  const showQueryDevtools = import.meta.env.DEV && import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === "true";

  return (
    <QueryClientProvider client={appQueryClient}>
      <I18nProvider>
        <Router>
          <AppRoutes />
        </Router>
      </I18nProvider>
      {showQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}

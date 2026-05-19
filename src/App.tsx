import { HashRouter, BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { I18nProvider } from "@/features/i18n";
import { shouldUseHashRouter } from "@/lib/platform";
import { appQueryClient } from "@/lib/query-client";
import { AppRoutes } from "@/routes/app-routes";

export default function App() {
  const Router = shouldUseHashRouter() ? HashRouter : BrowserRouter;

  return (
    <QueryClientProvider client={appQueryClient}>
      <I18nProvider>
        <Router>
          <AppRoutes />
        </Router>
      </I18nProvider>
    </QueryClientProvider>
  );
}

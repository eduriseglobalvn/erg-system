import { useMemo } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { ErgFluentProvider } from "@/components/erg-fluent";
import { I18nProvider } from "@/platform/i18n";
import { appQueryClient } from "@/lib/query-client";
import { createAppRouter } from "@/routes/app-routes";

export default function App() {
  const router = useMemo(() => createAppRouter(), []);
  const showQueryDevtools = import.meta.env.DEV && import.meta.env.VITE_SHOW_QUERY_DEVTOOLS === "true";

  return (
    <QueryClientProvider client={appQueryClient}>
      <ErgFluentProvider>
        <I18nProvider>
          <RouterProvider router={router} />
        </I18nProvider>
      </ErgFluentProvider>
      {showQueryDevtools ? <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /> : null}
    </QueryClientProvider>
  );
}

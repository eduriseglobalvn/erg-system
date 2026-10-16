import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

import "./styles/globals.css";
import "./index.css";

import { PortableArtifactApp } from "@/features/elearning/portable-exam/components/portable-artifact-app";
import { appQueryClient } from "@/lib/query-client";
import { I18nProvider } from "@/platform/i18n";
import ErgMuiProvider from "@/themes/ErgMuiProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={appQueryClient}>
      <I18nProvider>
        <ErgMuiProvider>
          <PortableArtifactApp />
        </ErgMuiProvider>
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
);

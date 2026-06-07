import { FluentProvider } from "@fluentui/react-components";
import type { ReactNode } from "react";

import { ergFluentTheme } from "@/components/erg-fluent/fluent-theme";

export function ErgFluentProvider({ children }: { children: ReactNode }) {
  return (
    <FluentProvider className="erg-fluent-root" theme={ergFluentTheme}>
      {children}
    </FluentProvider>
  );
}


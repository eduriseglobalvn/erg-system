import type { ReactNode } from "react";
import Box from "@mui/material/Box";

import { ErgPageHeader } from "@/components/erg-mui/erg-page-header";

/**
 * Page frame of a Teacher screen (the shell renders pages flush): one margin and one header
 * position for every screen. The phone keeps its own top bar title, so the header shows from md up.
 */
export function TeacherPageFrame({
  actions,
  children,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, pb: 3, pt: { md: 3, xs: 2 }, px: { md: 4, xs: 2 } }}>
      <Box sx={{ display: { md: "block", xs: "none" }, mb: -3 }}>
        <ErgPageHeader description={description} primaryAction={actions} title={title} />
      </Box>
      {children}
    </Box>
  );
}

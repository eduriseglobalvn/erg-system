import Box from "@mui/material/Box";
import { BackToWorkspaceBar } from "@/app/pages/shared/back-to-workspace-bar";
import { HelpGuideView } from "@/features/help/components/help-guide-view";
import type { Workspace } from "@/platform/workspaces/workspace-domain";

export default function HelpGuidePage({ workspace }: { workspace: Workspace }) {
  if (workspace !== "STUDENT") return <HelpGuideView workspace={workspace} />;
  // The student dashboard has no route shell: this page stands alone with its own way back.
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <BackToWorkspaceBar href="/student" />
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <HelpGuideView workspace={workspace} />
      </Box>
    </Box>
  );
}

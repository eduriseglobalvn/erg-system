import { DesktopReleaseDownloadPage, type DesktopReleaseWorkspace } from "@/features/desktop-release";
import { BackToWorkspaceBar } from "@/app/pages/shared/back-to-workspace-bar";

export function DesktopReleasePage({ workspace }: { workspace: DesktopReleaseWorkspace }) {
  return (
    <>
      <BackToWorkspaceBar href={workspace === "STUDENT" ? "/student" : "/teacher"} />
      <DesktopReleaseDownloadPage workspace={workspace} />
    </>
  );
}

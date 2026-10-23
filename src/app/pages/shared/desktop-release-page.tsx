import { DesktopReleaseDownloadPage, type DesktopReleaseWorkspace } from "@/features/desktop-release";

export function DesktopReleasePage({ workspace }: { workspace: DesktopReleaseWorkspace }) {
  return <DesktopReleaseDownloadPage workspace={workspace} />;
}


export {
  DESKTOP_ALLOWED_ORIGINS,
  DESKTOP_WORKSPACES,
  desktopPathFromLocation,
  desktopWorkspaceFromLocation,
  desktopWorkspaceFromPath,
  getDesktopCapabilities,
  getDesktopRuntime,
  isAllowedDesktopOrigin,
  isDesktopWorkspace,
  resolveDesktopRuntime,
  type DesktopCapabilities,
  type DesktopRuntime,
  type DesktopWorkspace,
} from "./runtime";

export {
  desktopLoginPortal,
  desktopWorkspaceFromLoginSearch,
  resolveDesktopWorkspaceLanding,
  type DesktopWorkspaceClaims,
  type DesktopWorkspaceLanding,
} from "./entry";

export {
  canUseDesktopUpdater,
  checkDesktopUpdate,
  createDesktopUpdaterController,
  DESKTOP_UPDATER_CHANNELS,
  getDesktopUpdaterState,
  installDesktopUpdate,
  type DesktopUpdateHandle,
  type DesktopUpdateInstallResult,
  type DesktopUpdateProgress,
  type DesktopUpdateResult,
  type DesktopReleaseChannel,
  type DesktopUpdaterAdapters,
  type DesktopUpdaterDownloadEvent,
  type DesktopUpdaterState,
} from "./updater";

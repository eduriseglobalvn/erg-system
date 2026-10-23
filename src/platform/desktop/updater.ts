import { getDesktopCapabilities } from "@/platform/desktop/runtime";

export const DESKTOP_UPDATER_CHANNELS = ["stable", "beta", "internal"] as const;
export type DesktopReleaseChannel = (typeof DESKTOP_UPDATER_CHANNELS)[number];

export type DesktopUpdaterState =
  | "unavailable"
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installed"
  | "up-to-date"
  | "error";

export type DesktopUpdateProgress = {
  chunkLength?: number;
  downloadedBytes: number;
  phase: "started" | "progress" | "finished";
  totalBytes?: number;
};

export type DesktopUpdateHandle = {
  body?: string;
  close?: () => Promise<void>;
  currentVersion: string;
  date?: string;
  downloadAndInstall: (
    onEvent?: (event: DesktopUpdaterDownloadEvent) => void,
    options?: { headers?: HeadersInit; timeout?: number },
  ) => Promise<void>;
  version: string;
};

export type DesktopUpdaterDownloadEvent =
  | { event: "Started"; data: { contentLength?: number } }
  | { event: "Progress"; data: { chunkLength: number } }
  | { event: "Finished" };

export type DesktopUpdaterAdapters = {
  check: (options?: { headers?: HeadersInit; timeout?: number }) => Promise<DesktopUpdateHandle | null>;
  relaunch: () => Promise<void>;
};

export type DesktopUpdateResult =
  | { status: "unavailable"; state: "unavailable" }
  | { status: "up-to-date"; state: "up-to-date"; currentVersion?: string }
  | {
      status: "available";
      state: "available";
      update: DesktopUpdateHandle;
      currentVersion: string;
      version: string;
      body?: string;
      date?: string;
    }
  | { status: "error"; state: "error"; error: string };

export type DesktopUpdateInstallResult =
  | { status: "unavailable"; state: "unavailable" }
  | { status: "installed"; state: "installed"; version: string }
  | { status: "error"; state: "error"; error: string };

export type DesktopUpdaterController = {
  getState: () => DesktopUpdaterState;
  check: (options?: { channel?: DesktopReleaseChannel; timeoutMs?: number }) => Promise<DesktopUpdateResult>;
  install: (
    update?: DesktopUpdateHandle,
    onProgress?: (progress: DesktopUpdateProgress) => void,
  ) => Promise<DesktopUpdateInstallResult>;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_TIMEOUT_MS = 120_000;

function defaultAdapters(): DesktopUpdaterAdapters {
  return {
    check: async (options) => {
      const module = await import("@tauri-apps/plugin-updater");
      return (await module.check(options)) as DesktopUpdateHandle | null;
    },
    relaunch: async () => {
      const module = await import("@tauri-apps/plugin-process");
      await module.relaunch();
    },
  };
}

export function canUseDesktopUpdater(): boolean {
  return getDesktopCapabilities().canUseUpdater;
}

export function createDesktopUpdaterController(adapters: DesktopUpdaterAdapters = defaultAdapters()): DesktopUpdaterController {
  let state: DesktopUpdaterState = canUseDesktopUpdater() ? "idle" : "unavailable";
  let activeUpdate: DesktopUpdateHandle | undefined;

  return {
    getState: () => state,
    check: async (options = {}) => {
      if (!canUseDesktopUpdater()) {
        state = "unavailable";
        return { status: "unavailable", state };
      }
      if (state === "checking" || state === "downloading") {
        return { status: "error", state: "error", error: "An update operation is already in progress." };
      }

      const timeout = normalizeTimeout(options.timeoutMs);
      if (options.channel !== undefined && !DESKTOP_UPDATER_CHANNELS.includes(options.channel)) {
        state = "error";
        return { status: "error", state, error: "The requested release channel is not supported." };
      }

      state = "checking";
      try {
        const update = await adapters.check({
          timeout,
          ...(options.channel ? { headers: { "X-ERG-Release-Channel": options.channel } } : {}),
        });
        activeUpdate = update ?? undefined;
        if (!update) {
          state = "up-to-date";
          return { status: "up-to-date", state };
        }
        state = "available";
        return {
          status: "available",
          state,
          update,
          currentVersion: update.currentVersion,
          version: update.version,
          ...(update.body ? { body: update.body } : {}),
          ...(update.date ? { date: update.date } : {}),
        };
      } catch (error) {
        activeUpdate = undefined;
        state = "error";
        return { status: "error", state, error: toSafeErrorMessage(error) };
      }
    },
    install: async (update = activeUpdate, onProgress) => {
      if (!canUseDesktopUpdater()) {
        state = "unavailable";
        return { status: "unavailable", state };
      }
      if (!update) {
        state = "error";
        return { status: "error", state, error: "No desktop update is available to install." };
      }

      state = "downloading";
      let downloadedBytes = 0;
      try {
        await update.downloadAndInstall((event) => {
          if (event.event === "Started") {
            onProgress?.({ phase: "started", downloadedBytes, ...(event.data.contentLength ? { totalBytes: event.data.contentLength } : {}) });
            return;
          }
          if (event.event === "Progress") {
            downloadedBytes += event.data.chunkLength;
            onProgress?.({ phase: "progress", chunkLength: event.data.chunkLength, downloadedBytes });
            return;
          }
          onProgress?.({ phase: "finished", downloadedBytes });
        });
        state = "installed";
        await adapters.relaunch();
        activeUpdate = undefined;
        return { status: "installed", state, version: update.version };
      } catch (error) {
        state = "error";
        return { status: "error", state, error: toSafeErrorMessage(error) };
      } finally {
        await update.close?.().catch(() => undefined);
      }
    },
  };
}

const desktopUpdater = createDesktopUpdaterController();

export function getDesktopUpdaterState(): DesktopUpdaterState {
  return desktopUpdater.getState();
}

export function checkDesktopUpdate(options?: { channel?: DesktopReleaseChannel; timeoutMs?: number }) {
  return desktopUpdater.check(options);
}

export function installDesktopUpdate(
  update?: DesktopUpdateHandle,
  onProgress?: (progress: DesktopUpdateProgress) => void,
) {
  return desktopUpdater.install(update, onProgress);
}

function normalizeTimeout(value: number | undefined) {
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.min(MAX_TIMEOUT_MS, Math.max(1_000, Math.trunc(value as number)));
}

function toSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.slice(0, 300);
  if (typeof error === "string" && error.trim()) return error.slice(0, 300);
  return "Desktop update failed.";
}

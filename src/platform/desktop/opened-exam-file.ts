import { isTauriRuntime } from "@/lib/platform";

/** Bytes of the `.ergquiz` file the OS opened the desktop player with, or null outside Tauri / when none was passed. */
export async function readOpenedExamFile(): Promise<ArrayBuffer | null> {
  if (!isTauriRuntime()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  const bytes = await invoke<ArrayBuffer>("opened_exam_file");
  return bytes.byteLength > 0 ? bytes : null;
}

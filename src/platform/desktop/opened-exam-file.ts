import { isTauriRuntime } from "@/lib/platform";

/** Bytes of the `.ergquiz` file the OS opened the desktop player with, or null outside Tauri / when none was passed. */
export async function readOpenedExamFile(): Promise<ArrayBuffer | null> {
  if (!isTauriRuntime()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  // Windows WebView2 delivers the raw response as a number array, not an ArrayBuffer.
  const raw = await invoke<ArrayBuffer | number[]>("opened_exam_file");
  const bytes = raw instanceof ArrayBuffer ? raw : new Uint8Array(raw).buffer;
  return bytes.byteLength > 0 ? bytes : null;
}

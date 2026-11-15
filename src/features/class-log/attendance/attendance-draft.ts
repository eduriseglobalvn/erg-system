import type { MarkMap } from "./attendance-model";

export type AttendanceDraft = { actualPeriod?: number; at: number; comment?: string; marks?: MarkMap };

const storageKey = (accountId: string, key: string) => `erg:attendance-draft:${accountId}:${key}`;

/** Per-device draft of an unsaved period; storage can be blocked (private mode), so every access is guarded. */
export function readDraft(accountId: string, key: string): AttendanceDraft | null {
  try {
    const raw = window.localStorage.getItem(storageKey(accountId, key));
    const parsed = raw ? (JSON.parse(raw) as AttendanceDraft) : null;
    return parsed && typeof parsed.at === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(accountId: string, key: string, draft: AttendanceDraft): void {
  try {
    window.localStorage.setItem(storageKey(accountId, key), JSON.stringify(draft));
  } catch {
    // Draft is a convenience; losing it must not block the teacher.
  }
}

export function clearDraft(accountId: string, key: string): void {
  try {
    window.localStorage.removeItem(storageKey(accountId, key));
  } catch {
    // see writeDraft
  }
}

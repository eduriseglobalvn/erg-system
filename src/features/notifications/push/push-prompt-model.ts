const STORAGE_PREFIX = "erg-push-prompt:";
const SNOOZE_MS = 7 * 24 * 60 * 60_000;

/** Per-account prompt memory: app loads seen, and each «Để sau» / × (at most two, 7 days apart). */
export type PushPromptRecord = { visits: number; snoozedAt: number[] };

/** Mockup rule: ask from the second visit; after «Để sau» ask once more 7 days later, then never. */
export function shouldOfferPushPrompt(record: PushPromptRecord, now: number) {
  if (record.visits < 2 || record.snoozedAt.length >= 2) return false;
  const lastSnooze = record.snoozedAt.at(-1);
  return lastSnooze === undefined || now - lastSnooze >= SNOOZE_MS;
}

export function readPushPromptRecord(accountId: string): PushPromptRecord {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + accountId) ?? "null");
    if (parsed && typeof parsed === "object") {
      const { visits, snoozedAt } = parsed as Partial<PushPromptRecord>;
      return {
        visits: typeof visits === "number" ? visits : 0,
        snoozedAt: Array.isArray(snoozedAt) ? snoozedAt.filter((value) => typeof value === "number") : [],
      };
    }
  } catch {
    // Private mode / blocked storage: behave as a first visit (no prompt).
  }
  return { visits: 0, snoozedAt: [] };
}

export function writePushPromptRecord(accountId: string, record: PushPromptRecord) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + accountId, JSON.stringify(record));
  } catch {
    // Storage unavailable: the prompt simply is not remembered.
  }
}

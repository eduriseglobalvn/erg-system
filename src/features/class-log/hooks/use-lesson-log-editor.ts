import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateLessonLogEntry, type ClassLogPeriod, type ClassLogWeek } from "../api/class-log-api";
import { classLogQueryKeys } from "../api/class-log-query-keys";
import { lessonLogErrorText } from "../domain/class-log-copy";
import { findPeriod, periodKey, replacePeriod } from "../domain/class-log-cache";

export const AUTOSAVE_DELAY_MS = 600;
const BUSY_RETRY_MS = 300;

export type EntryPatch = { actualPeriod?: number; comment?: string };

/**
 * Autosave of "Tiết thực tế" and "Nhận xét": edits show at once from a draft, are sent 600 ms after the last
 * keystroke with the version the row was read at, and the draft is dropped once the server copy has it.
 */
export function useLessonLogEditor(weekKey: readonly unknown[]) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, EntryPatch>>({});
  const draftsRef = useRef(drafts);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const busy = useRef(new Set<string>());
  const weekKeyRef = useRef(weekKey);
  useEffect(() => { weekKeyRef.current = weekKey; });
  const sendRef = useRef<(key: string) => Promise<void>>(async () => {});

  const commitDrafts = useCallback((next: Record<string, EntryPatch>) => {
    draftsRef.current = next;
    setDrafts(next);
  }, []);

  const send = useCallback(async (key: string) => {
    timers.current.delete(key);
    const patch = draftsRef.current[key];
    const period = findPeriod(queryClient.getQueryData<ClassLogWeek>(weekKeyRef.current), key);
    if (!patch || !period) return;
    if (busy.current.has(key)) {
      timers.current.set(key, setTimeout(() => void sendRef.current(key), BUSY_RETRY_MS));
      return;
    }
    const actualPeriod = patch.actualPeriod ?? period.actualPeriod;
    const comment = patch.comment ?? period.comment ?? "";
    busy.current.add(key);
    try {
      const saved = await updateLessonLogEntry({
        eventId: period.eventId, date: period.date, periodNo: period.periodNo, actualPeriod, comment, expectedVersion: period.version,
      });
      queryClient.setQueryData<ClassLogWeek>(weekKeyRef.current, (week) => (week ? replacePeriod(week, saved) : week));
      const current = draftsRef.current[key];
      const rest = { ...draftsRef.current };
      // Keep whatever was typed while the request was in flight; it has its own timer.
      const remaining: EntryPatch = {
        ...(current?.actualPeriod !== undefined && current.actualPeriod !== actualPeriod ? { actualPeriod: current.actualPeriod } : {}),
        ...(current?.comment !== undefined && current.comment !== comment ? { comment: current.comment } : {}),
      };
      if (Object.keys(remaining).length) rest[key] = remaining; else delete rest[key];
      commitDrafts(rest);
      void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all });
    } catch (error) {
      toast.error(lessonLogErrorText(error));
      const rest = { ...draftsRef.current };
      delete rest[key];
      commitDrafts(rest);
      void queryClient.invalidateQueries({ queryKey: classLogQueryKeys.all });
    } finally {
      busy.current.delete(key);
    }
  }, [commitDrafts, queryClient]);
  useEffect(() => { sendRef.current = send; }, [send]);

  const edit = useCallback((period: ClassLogPeriod, patch: EntryPatch) => {
    const key = periodKey(period);
    commitDrafts({ ...draftsRef.current, [key]: { ...draftsRef.current[key], ...patch } });
    const pending = timers.current.get(key);
    if (pending) clearTimeout(pending);
    timers.current.set(key, setTimeout(() => void send(key), AUTOSAVE_DELAY_MS));
  }, [commitDrafts, send]);

  useEffect(() => {
    const live = timers.current;
    // Leaving the page flushes edits still waiting for their 600 ms instead of dropping them.
    return () => [...live].forEach(([key, timer]) => { clearTimeout(timer); void send(key); });
  }, [send]);

  return { drafts, edit };
}

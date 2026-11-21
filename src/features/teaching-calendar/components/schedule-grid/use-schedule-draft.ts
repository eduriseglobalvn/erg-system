import { useCallback, useEffect, useRef, useState } from "react";

import { createClientIdempotencyKey } from "@/features/teaching-calendar/api/teaching-calendar-transport-utils";
import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import type { TeachingScheduleDraftInput, TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { applyRowIdMap, toDraftRowInputs, type GridRow, type ScheduleConflict } from "@/features/teaching-calendar/domain/schedule-grid-model";

export type DraftMeta = {
  applyFrom: string;
  batchId?: string;
  levelId?: string;
  periodTemplateId: string;
  repeatUntil: string;
  schoolId: string;
  subjectId?: string;
  version?: number;
};

export type DraftStatus = "idle" | "dirty" | "saving" | "error" | "stale" | "needsSubject";
type AccessChanges = TeachingScheduleDraftResult["accessChanges"];

type Options = {
  /** Debounce 1,5 s (6.2). */
  debounceMs?: number;
  save: (input: TeachingScheduleDraftInput) => Promise<TeachingScheduleDraftResult>;
};

const EMPTY_META: DraftMeta = { applyFrom: "", periodTemplateId: "", repeatUntil: "", schoolId: "" };

/**
 * State cua luoi xep lich: map o -> dong, tu luu nhap sau `debounceMs`, hang doi luu tuan tu (khong gui song song),
 * giu `expectedVersion`, ap `rowIdMap`, giu conflicts / accessChanges tu response gan nhat.
 */
export function useScheduleDraft({ debounceMs = 1500, save }: Options) {
  const [rows, setRowsState] = useState<GridRow[]>([]);
  const [meta, setMetaState] = useState<DraftMeta>(EMPTY_META);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<readonly ScheduleConflict[]>([]);
  const [accessChanges, setAccessChanges] = useState<AccessChanges>([]);
  const [batchLabel, setBatchLabel] = useState("");

  const rowsRef = useRef(rows);
  const metaRef = useRef(meta);
  const saveRef = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queued = useRef(false);
  // Khoa cho lan luu DAU cua dot moi: gui lai/bam doi van ra mot dot; doi khi da co batchId.
  const newDraftKey = useRef<string | null>(null);
  saveRef.current = save;

  const inFlightPromise = useRef<Promise<void> | null>(null);
  const failed = useRef(false);

  /** Gui tuan tu cho den khi het thay doi xep hang; dung o loi dau tien. */
  const drain = useCallback(async () => {
    do {
      const current = metaRef.current;
      if (!current.schoolId || !current.periodTemplateId || !current.applyFrom || !current.repeatUntil) return;
      if (!rowsRef.current.length && !current.batchId) { setStatus("idle"); return; }
      // BE tu choi luu tiet khi chua co mon (SUBJECT_REQUIRED): bao ro thay vi gui request hong.
      if (rowsRef.current.length && !current.subjectId) { setStatus("needsSubject"); return; }
      queued.current = false;
      // Khoa cu = lan truoc co the da ghi o server: server tra lai dot cu va bo qua rows moi.
      const replay = !current.batchId && newDraftKey.current !== null;
      if (!current.batchId) newDraftKey.current ??= createClientIdempotencyKey();
      setStatus("saving");
      try {
        const result = await saveRef.current({
          applyFrom: current.applyFrom,
          batchId: current.batchId ?? null,
          expectedVersion: current.version ?? null,
          ...(current.batchId ? {} : { idempotencyKey: newDraftKey.current }),
          levelId: current.levelId ?? null,
          periodTemplateId: current.periodTemplateId,
          repeatUntil: current.repeatUntil,
          rows: toDraftRowInputs(rowsRef.current),
          schoolId: current.schoolId,
          subjectId: current.subjectId ?? null,
        });
        failed.current = false;
        newDraftKey.current = null;
        metaRef.current = { ...metaRef.current, batchId: result.batch.id, version: result.version };
        rowsRef.current = applyRowIdMap(rowsRef.current, result.rowIdMap);
        setMetaState(metaRef.current);
        setRowsState(rowsRef.current);
        setConflicts(result.conflicts);
        setAccessChanges(result.accessChanges);
        setBatchLabel(result.batch.label);
        setSavedAt(result.savedAt);
        if (replay) queued.current = true; // gui lai noi dung day du, nay da co batchId
      } catch (error) {
        failed.current = true;
        setStatus(teachingScheduleErrorCode(error) === "STALE_VERSION" ? "stale" : "error");
        return;
      }
    } while (queued.current);
    // Con thay doi dang cho debounce thi chua phai «Da luu».
    setStatus(timer.current ? "dirty" : "idle");
  }, []);

  const run = useCallback((): Promise<void> => {
    if (inFlightPromise.current) { queued.current = true; return inFlightPromise.current; }
    const promise = drain().finally(() => { inFlightPromise.current = null; });
    inFlightPromise.current = promise;
    return promise;
  }, [drain]);

  const schedule = useCallback(() => {
    setStatus((current) => (current === "saving" || current === "stale" ? current : "dirty"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = undefined; void run(); }, debounceMs);
  }, [debounceMs, run]);

  // Roi trang con thay doi cho debounce thi luu not, khong bo.
  useEffect(() => () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = undefined;
    void run();
  }, [run]);

  const setRows = useCallback((updater: (rows: GridRow[]) => GridRow[]) => {
    rowsRef.current = updater(rowsRef.current);
    setRowsState(rowsRef.current);
    schedule();
  }, [schedule]);

  const setMeta = useCallback((patch: Partial<DraftMeta>) => {
    if (patch.schoolId !== undefined && patch.schoolId !== metaRef.current.schoolId) newDraftKey.current = null;
    metaRef.current = { ...metaRef.current, ...patch };
    setMetaState(metaRef.current);
    schedule();
  }, [schedule]);

  /** Nap trang thai da luu tu server (mo lai dot), khong danh dau nhap. */
  const hydrate = useCallback((next: { batchLabel?: string; conflicts?: readonly ScheduleConflict[]; accessChanges?: AccessChanges; meta: DraftMeta; rows: GridRow[] }) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    failed.current = false;
    newDraftKey.current = null;
    rowsRef.current = next.rows;
    metaRef.current = next.meta;
    setRowsState(next.rows);
    setMetaState(next.meta);
    setConflicts(next.conflicts ?? []);
    setAccessChanges(next.accessChanges ?? []);
    setBatchLabel(next.batchLabel ?? "");
    setStatus("idle");
  }, []);

  /** Ap phien ban / ten moi tu server (doi ten, tai lai) ma khong danh dau nhap. */
  const applyBatch = useCallback((batch: { label: string; version: number }) => {
    metaRef.current = { ...metaRef.current, version: batch.version };
    setMetaState(metaRef.current);
    setBatchLabel(batch.label);
  }, []);

  /** Luu ngay (nut «Thử lại», truoc khi xuat ban). */
  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = undefined;
    await run();
    return !failed.current;
  }, [run]);

  return { accessChanges, applyBatch, getMeta: () => metaRef.current, batchLabel, conflicts, flush, hydrate, meta, rows, savedAt, setBatchLabel, setMeta, setRows, status };
}

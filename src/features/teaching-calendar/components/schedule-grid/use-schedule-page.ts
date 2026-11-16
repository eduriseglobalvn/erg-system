import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingOverviewGrid, loadTeachingOverviewSchools } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { loadTeachingPeriodTemplates, loadTeachingScheduleDraft, saveTeachingScheduleDraft } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import { addDaysToDate, weekStartOf, weekdayIndex } from "@/features/teaching-calendar/domain/schedule-copy";
import { cellStates, eventsToRows, rowsByCell } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { todayInput } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { useScheduleDraft } from "./use-schedule-draft";

/** Lich lap 10 tuan mac dinh: 09/11 -> 17/01 (69 ngay sau). */
const DEFAULT_SPAN_DAYS = 69;

/** Du lieu va state cua trang xep lich: query, nap dot cu vao luoi, tinh o/ngay le/trang thai mau. */
export function useSchedulePage() {
  const tenantId = getDefaultTenantId();
  const params = new URLSearchParams(useLocation().searchStr);
  const urlBatchId = params.get("batchId") ?? undefined;
  const urlSchoolId = params.get("schoolId") ?? "";
  const urlWeek = params.get("week") ?? undefined;
  const draft = useScheduleDraft({ save: saveTeachingScheduleDraft });
  const { hydrate, meta } = draft;
  // Dot da nap (theo ?batchId): doi batchId tren cung trang thi nap lai, khong de autosave ghi de dot cu.
  const hydratedKey = useRef<string | null>(null);
  const batchKey = urlBatchId ?? "";

  const templates = useQuery({ queryFn: ({ signal }) => loadTeachingPeriodTemplates(signal), queryKey: teachingCalendarQueryKeys.periodTemplates(tenantId), staleTime: 5 * 60_000 });
  const weekStart = weekStartOf(meta.applyFrom || urlWeek || todayInput());
  const schools = useQuery({
    queryFn: ({ signal }) => loadTeachingOverviewSchools({ page: 0, size: 200, weekStart }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "schools", { page: 0, size: 200, weekStart }),
    staleTime: 60_000,
  });
  const saved = useQuery({
    enabled: Boolean(urlBatchId),
    queryFn: ({ signal }) => loadTeachingScheduleDraft(urlBatchId as string, signal),
    queryKey: teachingCalendarQueryKeys.scheduleDraft(tenantId, urlBatchId ?? ""),
    staleTime: 0,
  });
  const schoolId = meta.schoolId || saved.data?.batch.schoolId || urlSchoolId;
  const workspaceFrom = saved.data?.batch.applyFrom ? weekStartOf(saved.data.batch.applyFrom) : weekStart;
  const workspace = useQuery({
    enabled: Boolean(schoolId) && (!urlBatchId || Boolean(saved.data)),
    queryFn: ({ signal }) => loadLcmsTeachingCalendarWorkspace({ from: workspaceFrom, schoolIds: [schoolId], statuses: ["DRAFT", "PUBLISHED"], tenantId, to: addDaysToDate(workspaceFrom, 7) }, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lcms", "schedule-page", { from: workspaceFrom, schoolIds: [schoolId], statuses: ["DRAFT", "PUBLISHED"], tenantId, to: addDaysToDate(workspaceFrom, 7) }),
    staleTime: 0,
  });
  const holidayWeek = useQuery({
    enabled: Boolean(schoolId),
    queryFn: ({ signal }) => loadTeachingOverviewGrid({ schoolIds: [schoolId], weekStart }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "grid", { schoolIds: [schoolId], weekStart }),
    staleTime: 5 * 60_000,
  });

  const template = templates.data?.find((item) => item.id === meta.periodTemplateId) ?? templates.data?.[0];

  // Nap mot lan: dot da luu (version, nhan, xung dot, dong tu su kien) hoac trang moi theo ?schoolId&week.
  useEffect(() => {
    if (hydratedKey.current === batchKey || !template) return;
    if (urlBatchId) {
      if (!saved.data || !workspace.data) return;
      const batch = saved.data.batch;
      const applyFrom = batch.applyFrom ?? weekStart;
      const rows = eventsToRows(workspace.data.events, batch.id);
      const first = workspace.data.events.find((event) => event.batchId === batch.id);
      hydratedKey.current = batchKey;
      hydrate({
        accessChanges: saved.data.accessChanges,
        batchLabel: batch.label,
        conflicts: saved.data.conflicts,
        meta: {
          applyFrom, batchId: batch.id, levelId: first?.levelId ?? undefined,
          periodTemplateId: batch.periodTemplateId ?? template.id,
          repeatUntil: addDaysToDate(applyFrom, (batch.repeatWeeks ?? 10) * 7 - 1),
          schoolId: batch.schoolId, subjectId: first?.subjectId ?? undefined, version: saved.data.version,
        },
        rows,
      });
      return;
    }
    hydratedKey.current = batchKey;
    const applyFrom = weekStartOf(urlWeek ?? todayInput());
    hydrate({ meta: { applyFrom, periodTemplateId: template.id, repeatUntil: addDaysToDate(applyFrom, DEFAULT_SPAN_DAYS), schoolId: urlSchoolId }, rows: [] });
  }, [batchKey, hydrate, saved.data, template, urlBatchId, urlSchoolId, urlWeek, weekStart, workspace.data]);

  const holidays = useMemo(() => new Map((holidayWeek.data?.holidays ?? [])
    .filter((holiday) => weekdayIndex(holiday.date) !== 0)
    .map((holiday) => [weekdayIndex(holiday.date), holiday.name])), [holidayWeek.data]);
  const cells = useMemo(() => rowsByCell(draft.rows), [draft.rows]);
  const states = useMemo(() => cellStates(draft.conflicts), [draft.conflicts]);
  const catalog = workspace.data?.catalog;
  const school = schools.data?.items.find((item) => item.schoolId === meta.schoolId);

  return {
    batchStatus: saved.data?.batch.status ?? ("DRAFT" as const), catalog, cells, draft, holidays, loading: templates.isPending || (Boolean(urlBatchId) && !meta.periodTemplateId && (saved.isPending || workspace.isPending)),
    error: templates.error ?? saved.error ?? null, refetch: () => { void templates.refetch(); void saved.refetch(); },
    school, schools: schools.data?.items ?? [], states, template, templates: templates.data ?? [], weekStart,
  };
}

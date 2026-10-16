import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Search from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { listEducationUnits, updateEducationUnit, type LmsEducationUnitDTO } from "@/features/lms/infrastructure/lms-dashboard-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { AppSelect } from "@/components/ui/app-select";
import { LcmsListSkeleton, LcmsMiniStat, LcmsPanel, LcmsPanelHeader, LcmsStatusChip } from "@/features/lcms/components/lcms-ui";
import { EducationUnitEditor } from "./admin-operations-education-editor";
import { OperationalErrorState } from "./admin-operations-support";
import { UnitAvatar, UnitTypeBadge, sortEducationUnits } from "./admin-operations-insight";

export function CenterManagement({
  centers,
  classes,
  managementScope,
  onCreateUnit,
  scopeDescription,
}: {
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  managementScope: ManagementScope;
  onCreateUnit: () => void;
  scopeDescription: string;
}) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount("lcms")?.id?.trim() || "anonymous";
  const [units, setUnits] = useState<LmsEducationUnitDTO[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sourceWarning, setSourceWarning] = useState("");
  const [unitSource, setUnitSource] = useState<"api" | "mock">("api");
  const [successMessage, setSuccessMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const debouncedKeyword = useDebouncedValue(keyword, 220);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage("");
    setSourceWarning("");
    void queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.educationUnits(debouncedKeyword, typeFilter, tenantId, accountId),
        queryFn: ({ signal }) =>
          listEducationUnits({
            keyword: debouncedKeyword.trim() || undefined,
            type: typeFilter || undefined,
            limit: 100,
          }, signal),
        staleTime: QUERY_POLICIES.transactional.staleTime,
      })
      .then((response) => {
        if (cancelled) return;
        const items = response.items ?? [];
        setUnits(items);
        setUnitSource(response.source ?? "api");
        setSourceWarning(response.source === "mock" ? response.sourceError || "Backend chưa sẵn sàng, đang dùng dữ liệu mẫu để test flow." : "");
        setSelectedUnitId((current) => (items.some((unit) => unit.id === current) ? current : items[0]?.id ?? ""));
      })
      .catch((error) => {
        if (cancelled) return;
        setUnits([]);
        setUnitSource("api");
        setSourceWarning("");
        setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách cơ sở giáo dục từ BE.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, debouncedKeyword, queryClient, retryToken, tenantId, typeFilter]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0];
  const sortedUnits = useMemo(() => sortEducationUnits(units), [units]);
  const systemCount = units.filter((unit) => unit.type === "system").length;
  const centerCount = units.filter((unit) => unit.type === "center").length;
  const schoolCount = units.filter((unit) => unit.type === "school").length;
  const hasLoadError = Boolean(errorMessage && !isLoading && units.length === 0);

  function retryLoadUnits() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.educationUnits(undefined, undefined, tenantId, accountId) });
    setRetryToken((current) => current + 1);
  }

  async function handleSave(input: LmsEducationUnitDTO) {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const updated = await updateEducationUnit(input.id, {
        address: input.address ?? "",
        avatarUrl: input.avatarUrl ?? "",
        description: input.description ?? "",
        email: input.email ?? "",
        managerUserId: input.managerUserId ?? "",
        name: input.name,
        parentId: input.parentId ?? "",
        phone: input.phone ?? "",
        status: input.status ?? "active",
        type: input.type as "system" | "center" | "school",
        website: input.website ?? "",
      });
      setUnits((current) => current.map((unit) => (unit.id === updated.id ? updated : unit)));
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.educationUnits(undefined, undefined, tenantId, accountId) });
      setSuccessMessage("Đã lưu thông tin cơ sở giáo dục thành công.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được thông tin cơ sở giáo dục.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <LcmsPanel className="flex h-full min-h-0 flex-col overflow-hidden">
      <LcmsPanelHeader
        eyebrow="Quản lý phạm vi"
        title="Trường & trung tâm"
        description={scopeDescription}
        action={
          <>
            <LcmsStatusChip tone={unitSource === "mock" ? "amber" : "emerald"}>
              {isLoading ? "Đang tải" : unitSource === "mock" ? "Mock data" : "BE live"}
            </LcmsStatusChip>
            <LcmsMiniStat label="Hệ thống" value={systemCount} tone="slate" />
            <LcmsMiniStat label="Trung tâm" value={centerCount} tone="emerald" />
            <LcmsMiniStat label="Trường" value={schoolCount} tone="blue" />
            <Button variant="contained" size="small" onClick={onCreateUnit}>Tạo đơn vị</Button>
          </>
        }
      />

      {sourceWarning ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          Đang dùng dữ liệu mẫu để test luồng chọn trường/import lớp. <span className="font-medium">{sourceWarning}</span>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 bg-[#f7f9fc] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-[#d9e2ef] bg-[#f4f7fb] xl:border-b-0 xl:border-r">
          <div className="shrink-0 border-b border-[#d9e2ef] p-3">
            <div className="grid gap-2">
              <TextField
                size="small"
                fullWidth
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm trường..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="h-4 w-4 text-slate-400" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <AppSelect
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-9 rounded-md border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue)]/15"
              >
                <option value="">Tất cả đơn vị</option>
                <option value="system">Hệ thống</option>
                <option value="center">Trung tâm</option>
                <option value="school">Trường học</option>
              </AppSelect>
            </div>
          </div>

          {errorMessage ? (
            <OperationalErrorState
              className="m-3"
              message={errorMessage}
              onRetry={retryLoadUnits}
              title="Không tải được dữ liệu"
            />
          ) : null}

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2 scrollbar-thin">
            {isLoading && !units.length ? <LcmsListSkeleton rows={6} /> : null}

            {sortedUnits.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => {
                  setSelectedUnitId(unit.id);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition duration-150",
                  selectedUnit?.id === unit.id
                    ? "border-[#b8d6fa] bg-white shadow-[var(--shadow-xs)]"
                    : "border-transparent bg-transparent hover:border-[#d9e2ef] hover:bg-white",
                )}
              >
                <UnitAvatar unit={unit} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-850">{unit.name}</span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5">
                    <UnitTypeBadge type={unit.type} />
                    <span className="truncate text-[10px] font-bold text-slate-400">{unit.code || "NO-CODE"}</span>
                  </span>
                </span>
              </button>
            ))}

            {!units.length && !isLoading && !hasLoadError ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-400">
                Không có đơn vị phù hợp.
              </div>
            ) : null}
          </div>
        </aside>

        <section className="min-h-0 min-w-0 overflow-hidden bg-[#f7f9fc]">
          {selectedUnit ? (
            <EducationUnitEditor
              key={selectedUnit.id}
              unit={selectedUnit}
              units={units}
              centers={centers}
              classes={classes}
              isSaving={isSaving}
              managementScope={managementScope}
              successMessage={successMessage}
              onSave={handleSave}
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center">
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {hasLoadError ? "Chưa có dữ liệu để chỉnh sửa" : "Chọn một trường"}
                </div>
                <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
                  {hasLoadError ? "Kiểm tra API hoặc tải lại để tiếp tục." : "Thông tin và import lớp sẽ mở ở đây."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </LcmsPanel>
  );
}

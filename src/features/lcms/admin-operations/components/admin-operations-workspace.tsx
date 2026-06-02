import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DashboardMetricCard,
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, Input, ProgressBar } from "@/components/ui/dashboard-kit";
import {
  classroomSchools,
  classroomSnapshots,
  classroomStudents,
} from "@/features/lms/classroom/api/mock-classroom-data";
import { StudentSheetImportWorkspace } from "@/features/lcms/admin-operations/components/student-sheet-import-workspace";
import { UserAccessControlWorkspace } from "@/features/lcms/admin-operations/components/user-access-control-workspace";
import { LearningResourceAuthoringWorkspace } from "@/features/lcms/admin-operations/components/learning-resource-authoring-workspace";
import {
  listEducationUnits,
  updateEducationUnit,
  type LmsEducationUnitDTO,
} from "@/features/lms/infrastructure/lms-dashboard-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";

type AdminOperationsWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  managementScope: ManagementScope;
  onOpenLeaf: (leafId: string) => void;
};

export function AdminOperationsWorkspace({
  activeLeaf,
  managementScope,
  onOpenLeaf,
}: AdminOperationsWorkspaceProps) {
  const scopedCenters = getScopedCenters(managementScope);
  const scopedCenterIds = scopedCenters.map((center) => center.id);
  const scopedClasses = classroomSnapshots.filter((snapshot) => scopedCenterIds.includes(snapshot.schoolId));
  const scopedStudents = classroomStudents.filter((student) => scopedCenterIds.includes(student.schoolId));
  const scopeDescription = getScopeDescription(managementScope, scopedCenters);

  if (activeLeaf.variant === "admin-members") {
    return (
      <main className="h-full min-h-0 overflow-y-scroll overscroll-contain bg-[#f6f8fb] p-3 pb-24 scroll-pb-24 lg:p-4 lg:pb-24">
        <UserAccessControlWorkspace defaultSection="profile" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-permissions") {
    return (
      <main className="h-full min-h-0 overflow-y-scroll overscroll-contain bg-[#f6f8fb] p-3 pb-24 scroll-pb-24 lg:p-4 lg:pb-24">
        <UserAccessControlWorkspace defaultSection="access" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-internal-docs") {
    return (
      <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f6f8fb]">
        <InternalDocsWorkspace activeLeaf={activeLeaf} />
      </main>
    );
  }

  return (
    <DashboardPageShell
      badge="Admin ERG"
      title={activeLeaf.title}
      description={activeLeaf.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={getAdminActions(activeLeaf, onOpenLeaf)}
      headerContent={
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Phạm vi đang xem</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{scopeDescription}</p>
          </div>
          <Badge tone="secondary">Chỉ hiển thị với quyền ERG</Badge>
        </div>
      }
    >
      {activeLeaf.variant === "admin-overview" ? (
        <AdminOverview
          centers={scopedCenters}
          classCount={scopedClasses.length}
          studentCount={scopedStudents.length}
        />
      ) : null}
      {activeLeaf.variant === "admin-centers" ? <CenterManagement onCreateUnit={() => onOpenLeaf("admin-create-unit")} /> : null}
      {activeLeaf.variant === "admin-sheet-import" ? (
        <SheetImportWorkspace managementScope={managementScope} centers={scopedCenters} classes={scopedClasses} />
      ) : null}
    </DashboardPageShell>
  );
}

void LegacyCenterManagement;

function getAdminActions(activeLeaf: DashboardLeaf, onOpenLeaf: (leafId: string) => void) {
  if (activeLeaf.variant === "admin-overview") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">Xuất báo cáo</Button>
        <Button variant="outline" onClick={() => onOpenLeaf("admin-learning-resources")}>Quản lý học liệu</Button>
        <Button onClick={() => onOpenLeaf("admin-create-unit")}>Tạo cơ sở</Button>
      </div>
    );
  }

  if (activeLeaf.variant === "admin-centers") {
    return <Button onClick={() => onOpenLeaf("admin-create-unit")}>Tạo cơ sở</Button>;
  }

  if (activeLeaf.variant === "admin-members") {
    return <Button>Thêm thành viên</Button>;
  }

  return <Button variant="outline">Xuất báo cáo</Button>;
}

function AdminOverview({
  centers,
  classCount,
  studentCount,
}: {
  centers: ClassroomSchool[];
  classCount: number;
  studentCount: number;
}) {
  const flaggedStudents = centers.reduce((sum, center) => sum + center.flaggedStudents, 0);
  const averageCompletion = Math.round(
    centers.reduce((sum, center) => sum + center.completionRate, 0) / Math.max(1, centers.length),
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard label="Trung tâm" value={String(centers.length)} detail="đang hoạt động" tone="blue" />
        <DashboardMetricCard label="Lớp" value={String(classCount)} detail="được cấu hình trong hệ thống" tone="emerald" />
        <DashboardMetricCard label="Học sinh" value={studentCount.toLocaleString("vi-VN")} detail="đã có tài khoản" tone="violet" />
        <DashboardMetricCard label="Cần hỗ trợ" value={String(flaggedStudents)} detail="học sinh cần theo dõi" tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardSectionCard title="Trung tâm trong phạm vi" description="Nhìn nhanh sức khỏe vận hành, không nhồi quá nhiều chỉ số.">
          <div className="grid gap-3">
            {centers.map((center) => (
              <CenterRow key={center.id} center={center} />
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Việc cần xử lý" description="Ưu tiên các thao tác admin hay dùng.">
          <div className="space-y-3">
            <ActionItem title="Duyệt file import học sinh" detail="2 file đang chờ kiểm tra cột và dữ liệu lỗi." />
            <ActionItem title="Kiểm tra quyền truy cập global" detail="1 tài khoản vừa được đề xuất quyền ERG Admin." />
            <ActionItem title="Rà học liệu dùng chung" detail={`${averageCompletion}% hoàn thành trung bình trong phạm vi.`} />
          </div>
        </DashboardSectionCard>
      </div>
    </>
  );
}

function CenterManagement({ onCreateUnit }: { onCreateUnit: () => void }) {
  const queryClient = useQueryClient();
  const [units, setUnits] = useState<LmsEducationUnitDTO[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage("");
      void queryClient
        .fetchQuery({
          queryKey: ["admin-operations", "education-units", keyword, typeFilter],
          queryFn: () =>
            listEducationUnits({
              keyword: keyword.trim() || undefined,
              type: typeFilter || undefined,
              limit: 100,
            }),
          staleTime: 60_000,
        })
        .then((response) => {
          if (cancelled) return;
          const items = response.items ?? [];
          setUnits(items);
          setSelectedUnitId((current) => (items.some((unit) => unit.id === current) ? current : items[0]?.id ?? ""));
        })
        .catch((error) => {
          if (cancelled) return;
          setUnits([]);
          setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách cơ sở giáo dục từ BE.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [keyword, queryClient, typeFilter]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0];
  const sortedUnits = useMemo(() => sortEducationUnits(units), [units]);
  const systemCount = units.filter((unit) => unit.type === "system").length;
  const centerCount = units.filter((unit) => unit.type === "center").length;
  const schoolCount = units.filter((unit) => unit.type === "school").length;

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
      void queryClient.invalidateQueries({ queryKey: ["admin-operations", "education-units"] });
      setSuccessMessage("Đã lưu thông tin cơ sở giáo dục.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không lưu được thông tin cơ sở giáo dục.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <DashboardMetricCard label="Hệ thống" value={String(systemCount)} detail="ERG, Hoclieu Studio..." tone="blue" />
        <DashboardMetricCard label="Trung tâm" value={String(centerCount)} detail="đơn vị quản lý trường" tone="emerald" />
        <DashboardMetricCard label="Trường học" value={String(schoolCount)} detail="đơn vị quản lý lớp" tone="violet" />
        <DashboardMetricCard label="Nguồn dữ liệu" value={isLoading ? "Đang tải" : "BE"} detail="lms_centers thật" tone="amber" />
      </div>

      <DashboardSectionCard
        title="Quản lý hệ thống, trung tâm và trường học"
        description="Dữ liệu lấy trực tiếp từ BE. Admin có thể cập nhật logo/avatar, tên, địa chỉ và thông tin liên hệ của từng đơn vị."
        action={<Button onClick={onCreateUnit}>Tạo cơ sở</Button>}
      >
        <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm theo tên, mã, địa chỉ..." />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
              >
                <option value="">Tất cả loại</option>
                <option value="system">Hệ thống</option>
                <option value="center">Trung tâm</option>
                <option value="school">Trường học</option>
              </select>
            </div>

            {errorMessage ? (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>
            ) : null}

            <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
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
                    "flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40",
                    selectedUnit?.id === unit.id ? unitActiveClassName(unit.type) : "border-slate-200",
                  )}
                >
                  <UnitAvatar unit={unit} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-slate-950">{unit.name}</span>
                      <UnitTypeBadge type={unit.type} />
                    </span>
                    <span className="mt-1 block truncate text-sm text-slate-500">{unit.address || unit.description || "Chưa có địa chỉ/mô tả"}</span>
                    <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{unit.code || "NO-CODE"}</span>
                  </span>
                </button>
              ))}

              {!units.length && !isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  Chưa có cơ sở giáo dục phù hợp bộ lọc.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white">
            {selectedUnit ? (
              <EducationUnitEditor
                key={selectedUnit.id}
                unit={selectedUnit}
                units={units}
                isSaving={isSaving}
                successMessage={successMessage}
                onSave={handleSave}
              />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
                <div>
                  <div className="text-lg font-semibold text-slate-950">Chưa chọn cơ sở</div>
                  <p className="mt-2 text-sm text-slate-500">Chọn một hệ thống, trung tâm hoặc trường học ở bên trái để chỉnh sửa.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </DashboardSectionCard>
    </div>
  );
}

function LegacyCenterManagement({
  centers,
  onCreateUnit,
}: {
  centers: ClassroomSchool[];
  onCreateUnit: () => void;
}) {
  return (
    <DashboardSectionCard
      title="Danh sách trung tâm"
      description="Admin thêm trung tâm, kiểm tra trạng thái và đi tiếp vào danh sách lớp/học sinh."
      action={<Button onClick={onCreateUnit}>Tạo cơ sở</Button>}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(0,1fr)_130px_130px_170px_140px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>Trung tâm</span>
          <span>Lớp</span>
          <span>Học sinh</span>
          <span>Hoàn thành</span>
          <span>Thao tác</span>
        </div>
        <div className="divide-y divide-slate-200 bg-white">
          {centers.map((center) => (
            <article
              key={center.id}
              className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_130px_130px_170px_140px] lg:items-center"
            >
              <div>
                <h3 className="font-semibold text-slate-950">{center.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Phụ trách: {center.principal}</p>
              </div>
              <FieldValue label="Lớp" value={`${center.activeClasses}`} />
              <FieldValue label="Học sinh" value={center.activeStudents.toLocaleString("vi-VN")} />
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500 lg:hidden">Hoàn thành</span>
                  <span className="font-semibold text-slate-950">{center.completionRate}%</span>
                </div>
                <ProgressBar value={center.completionRate} className="mt-2 h-2" indicatorClassName="bg-emerald-500" />
              </div>
              <div className="flex gap-2 lg:justify-end">
                <Button variant="outline" size="sm">Chi tiết</Button>
                <Button size="sm">Lớp</Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </DashboardSectionCard>
  );
}

function EducationUnitEditor({
  isSaving,
  onSave,
  successMessage,
  unit,
  units,
}: {
  isSaving: boolean;
  onSave: (unit: LmsEducationUnitDTO) => void;
  successMessage: string;
  unit: LmsEducationUnitDTO;
  units: LmsEducationUnitDTO[];
}) {
  const [draft, setDraft] = useState<LmsEducationUnitDTO>(unit);
  const centerOptions = units.filter((item) => item.type === "center" && item.id !== unit.id);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setDraft(unit));
    return () => window.cancelAnimationFrame(frameId);
  }, [unit]);

  function updateDraft<K extends keyof LmsEducationUnitDTO>(key: K, value: LmsEducationUnitDTO[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
      className="space-y-5 p-5"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <UnitAvatar unit={draft} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-slate-950">{draft.name || "Cơ sở giáo dục"}</h3>
              <UnitTypeBadge type={draft.type} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{draft.code || "Chưa có mã cơ sở"}</p>
          </div>
        </div>
        <Button type="submit" disabled={isSaving || !draft.name?.trim()} className="bg-[var(--erg-blue)] hover:bg-blue-800">
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Tên hiển thị</span>
          <Input value={draft.name ?? ""} onChange={(event) => updateDraft("name", event.target.value)} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Loại đơn vị</span>
          <select
            value={draft.type ?? "school"}
            onChange={(event) => updateDraft("type", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            <option value="system">Hệ thống</option>
            <option value="center">Trung tâm</option>
            <option value="school">Trường học</option>
          </select>
        </label>
        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Avatar / Logo URL</span>
          <Input value={draft.avatarUrl ?? ""} onChange={(event) => updateDraft("avatarUrl", event.target.value)} placeholder="https://..." />
        </label>
        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Mô tả / thông tin giới thiệu</span>
          <textarea
            value={draft.description ?? ""}
            onChange={(event) => updateDraft("description", event.target.value)}
            className="min-h-28 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/80"
            placeholder="Ví dụ: Trung tâm phụ trách các trường khu vực Bình Phú..."
          />
        </label>
        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Địa chỉ</span>
          <Input value={draft.address ?? ""} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Số điện thoại</span>
          <Input value={draft.phone ?? ""} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="09xx xxx xxx" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Email liên hệ</span>
          <Input value={draft.email ?? ""} onChange={(event) => updateDraft("email", event.target.value)} placeholder="contact@erg.edu.vn" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Website</span>
          <Input value={draft.website ?? ""} onChange={(event) => updateDraft("website", event.target.value)} placeholder="https://..." />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Trạng thái</span>
          <select
            value={draft.status ?? "active"}
            onChange={(event) => updateDraft("status", event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            <option value="active">Đang hoạt động</option>
            <option value="archived">Lưu trữ</option>
            <option value="inactive">Tạm dừng</option>
          </select>
        </label>
        <label className="grid gap-1.5 lg:col-span-2">
          <span className="text-sm font-semibold text-slate-700">Thuộc trung tâm</span>
          <select
            value={draft.parentId ?? ""}
            onChange={(event) => updateDraft("parentId", event.target.value)}
            disabled={draft.type !== "school"}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Không thuộc trung tâm nào</option>
            {centerOptions.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </form>
  );
}

function UnitAvatar({ size = "md", unit }: { size?: "md" | "lg"; unit: LmsEducationUnitDTO }) {
  const initials = unit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-20 w-20 text-lg" : "h-12 w-12 text-sm";

  if (unit.avatarUrl) {
    return <img src={unit.avatarUrl} alt={unit.name} className={cn(sizeClass, "shrink-0 rounded-2xl border border-slate-200 object-cover")} />;
  }

  return (
    <span className={cn(sizeClass, "grid shrink-0 place-items-center rounded-2xl border font-bold", unitAvatarClassName(unit.type))}>
      {initials || "ERG"}
    </span>
  );
}

function UnitTypeBadge({ type }: { type?: string }) {
  const label = type === "system" ? "Hệ thống" : type === "center" ? "Trung tâm" : "Trường học";
  return <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]", unitBadgeClassName(type))}>{label}</span>;
}

function unitRank(type?: string) {
  if (type === "system") return 0;
  if (type === "center") return 1;
  return 2;
}

function sortEducationUnits(units: LmsEducationUnitDTO[]) {
  return [...units].sort((a, b) => unitRank(a.type) - unitRank(b.type) || a.name.localeCompare(b.name, "vi"));
}

function unitAvatarClassName(type?: string) {
  if (type === "system") return "border-red-100 bg-red-50 text-[var(--erg-red)]";
  if (type === "center") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  return "border-blue-100 bg-gradient-to-br from-red-50 via-white to-emerald-50 text-[var(--erg-blue)]";
}

function unitBadgeClassName(type?: string) {
  if (type === "system") return "border-red-200 bg-red-50 text-[var(--erg-red)]";
  if (type === "center") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-blue-200 bg-gradient-to-r from-red-50 to-emerald-50 text-slate-700";
}

function unitActiveClassName(type?: string) {
  if (type === "system") return "border-red-300 bg-red-50";
  if (type === "center") return "border-emerald-300 bg-emerald-50";
  return "border-blue-300 bg-gradient-to-r from-red-50/80 to-emerald-50/80";
}

function SheetImportWorkspace({
  managementScope,
  centers,
  classes,
}: {
  managementScope: ManagementScope;
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
}) {
  return <StudentSheetImportWorkspace managementScope={managementScope} centers={centers} classes={classes} />;
}

function InternalDocsWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf }) {
  return (
    <div className="h-full min-h-0 p-3">
      <LearningResourceAuthoringWorkspace activeLeaf={activeLeaf} />
    </div>
  );
}

function CenterRow({ center }: { center: ClassroomSchool }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">{center.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {center.activeClasses} lớp · {center.activeStudents.toLocaleString("vi-VN")} học sinh
          </p>
        </div>
        <Badge tone={center.flaggedStudents > 25 ? "warning" : "success"}>
          {center.flaggedStudents > 25 ? "Cần rà soát" : "Ổn định"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <FieldValue label="Hoàn thành" value={`${center.completionRate}%`} />
        <FieldValue label="Điểm TB" value={`${center.averageScore}`} />
        <FieldValue label="Cần hỗ trợ" value={`${center.flaggedStudents}`} />
      </div>
    </article>
  );
}

function ActionItem({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-medium text-slate-500 lg:hidden">{label}: </span>
      <span className="break-words text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function getScopedCenters(managementScope: ManagementScope) {
  if (managementScope.level === "global" && managementScope.centerId) {
    return classroomSchools.filter((center) => center.id === managementScope.centerId);
  }

  if (managementScope.level !== "global") {
    return classroomSchools.filter((center) => center.id === managementScope.centerId);
  }

  return classroomSchools;
}

function getScopeDescription(managementScope: ManagementScope, centers: ClassroomSchool[]) {
  if (managementScope.level === "global" && !managementScope.centerId) {
    return "ERG toàn hệ thống · tất cả trung tâm";
  }

  const centerNames = centers.map((center) => center.name).join(", ");
  return cn("ERG toàn hệ thống", centerNames ? `· ${centerNames}` : "");
}


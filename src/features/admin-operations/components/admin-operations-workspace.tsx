import { useEffect, useMemo, useState, type FormEvent } from "react";
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
} from "@/features/classroom/api/mock-classroom-data";
import { StudentSheetImportWorkspace } from "@/features/admin-operations/components/student-sheet-import-workspace";
import { UserAccessControlWorkspace } from "@/features/admin-operations/components/user-access-control-workspace";
import { HocLieuAuthoringWorkspace as HocLieuAuthoringWorkspaceV2 } from "@/features/admin-operations/components/hoclieu-authoring-workspace";
import { listLmsStudents, type StudentListItem } from "@/features/admin-operations/api/student-account-import-api";
import {
  listEducationUnits,
  updateEducationUnit,
  type LmsEducationUnitDTO,
} from "@/features/dashboard/api/lms-dashboard-api";
import {
  INTERNAL_DOCUMENT_TYPES,
  INTERNAL_DOCUMENTS,
  type InternalDocumentTypeId,
} from "@/features/hoclieu/api/internal-docs-data";
import {
  createHocLieuResource,
  createHocLieuTaxonomy,
  listHocLieuResources,
  loadHocLieuTaxonomies,
  uploadHocLieuAsset,
  type HocLieuResourceCard,
  type HocLieuTaxonomyResponse,
} from "@/features/admin-operations/api/hoclieu-authoring-api";
import type { ClassroomSchool, ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";
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

  if (activeLeaf.id.startsWith("admin-hoclieu-")) {
    return (
      <main className="h-full min-h-0 overflow-y-auto bg-[#f6f8fb] p-2 lg:p-3">
        <HocLieuAuthoringWorkspaceV2 activeLeaf={activeLeaf} onOpenLeaf={onOpenLeaf} />
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
      {activeLeaf.variant === "admin-students" ? (
        <StudentManagement
          managementScope={managementScope}
          centers={scopedCenters}
          classes={scopedClasses}
          fallbackStudents={scopedStudents}
        />
      ) : null}
      {activeLeaf.variant === "admin-sheet-import" ? (
        <SheetImportWorkspace managementScope={managementScope} centers={scopedCenters} classes={scopedClasses} />
      ) : null}
      {activeLeaf.variant === "admin-internal-docs" ? <InternalDocsWorkspace activeLeaf={activeLeaf} /> : null}
    </DashboardPageShell>
  );
}

void LegacyCenterManagement;

function getAdminActions(activeLeaf: DashboardLeaf, onOpenLeaf: (leafId: string) => void) {
  if (activeLeaf.variant === "admin-overview") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline">Xuất báo cáo</Button>
        <Button variant="outline" onClick={() => onOpenLeaf("admin-hoclieu-studio")}>Quản lý học liệu</Button>
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

  if (activeLeaf.variant === "admin-students") {
    return <Button variant="outline">Tải mẫu import</Button>;
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
      void listEducationUnits({
        keyword: keyword.trim() || undefined,
        type: typeFilter || undefined,
        limit: 100,
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
  }, [keyword, typeFilter]);

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
    setDraft(unit);
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

function StudentManagement({
  managementScope,
  centers,
  classes,
  fallbackStudents,
}: {
  managementScope: ManagementScope;
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  fallbackStudents: typeof classroomStudents;
}) {
  const scopeCenterId = managementScope.level === "global" ? "" : managementScope.centerId;
  const scopeClassId = managementScope.level === "class" ? managementScope.classId : "";
  const [keyword, setKeyword] = useState("");
  const [centerId, setCenterId] = useState(scopeCenterId);
  const [classId, setClassId] = useState(scopeClassId);
  const [status, setStatus] = useState("");
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setCenterId(scopeCenterId);
    setClassId(scopeClassId);
  }, [scopeCenterId, scopeClassId]);

  const classOptions = useMemo(() => {
    return classes.filter((classroom) => !centerId || classroom.schoolId === centerId);
  }, [centerId, classes]);

  const fallbackItems = useMemo<StudentListItem[]>(() => {
    return fallbackStudents.map((student) => ({
      id: student.id,
      fullName: student.name,
      username: student.id,
      centerId: student.schoolId,
      centerName: student.schoolName,
      classId: student.classId,
      className: student.className,
      status: "active",
      averageScore: student.averageScore,
      completedAssignments: null,
      lastActivityAt: null,
    }));
  }, [fallbackStudents]);

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage("");

      void listLmsStudents({
        centerId: centerId || undefined,
        classId: classId || undefined,
        keyword: keyword.trim() || undefined,
        status: status || undefined,
        limit: 100,
      })
        .then((response) => {
          if (cancelled) return;
          setStudents(response.items ?? []);
          setTotal(response.total ?? response.items?.length ?? 0);
        })
        .catch((error) => {
          if (cancelled) return;
          setStudents([]);
          setTotal(fallbackItems.length);
          setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách học sinh từ BE.");
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [centerId, classId, fallbackItems.length, keyword, status]);

  const displayStudents = errorMessage ? fallbackItems : students;
  const activeCount = displayStudents.filter((student) => student.status === "active").length;

  return (
    <DashboardSectionCard
      title="Quản lý học sinh"
      description="Danh sách lấy từ BE, lọc theo hệ thống, trung tâm/trường và lớp trong phạm vi đang chọn."
      action={<Button variant="outline">Tải mẫu import</Button>}
    >
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(240px,1fr)_220px_220px_170px]">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên, username, lớp..."
          aria-label="Tìm học sinh"
        />
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          value={centerId}
          onChange={(event) => {
            setCenterId(event.target.value);
            setClassId("");
          }}
          disabled={managementScope.level !== "global" && centers.length <= 1}
        >
          {managementScope.level === "global" ? <option value="">Tất cả trung tâm/trường</option> : null}
          {centers.map((center) => (
            <option key={center.id} value={center.id}>
              {center.name}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          disabled={managementScope.level === "class"}
        >
          <option value="">Tất cả lớp</option>
          {classOptions.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.className}
            </option>
          ))}
        </select>
        <select
          className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="archived">Đã lưu trữ</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <DashboardMetricCard label="Tổng học sinh" value={String(total || displayStudents.length)} detail="theo bộ lọc hiện tại" tone="blue" />
        <DashboardMetricCard label="Đang hoạt động" value={String(activeCount)} detail="tài khoản có thể đăng nhập" tone="emerald" />
        <DashboardMetricCard label="Nguồn dữ liệu" value={errorMessage ? "Dự phòng" : "BE"} detail={isLoading ? "đang tải lại" : "đã đồng bộ"} tone={errorMessage ? "amber" : "violet"} />
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
          {errorMessage} Đang hiển thị dữ liệu dự phòng để không làm gián đoạn thao tác.
        </div>
      ) : null}

      <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-slate-200">
        <div className="hidden grid-cols-[minmax(240px,1.2fr)_180px_180px_130px_150px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
          <span>Học sinh</span>
          <span>Trung tâm/trường</span>
          <span>Lớp</span>
          <span>Điểm TB</span>
          <span>Trạng thái</span>
        </div>
        <div className="divide-y divide-slate-200 bg-white">
          {displayStudents.map((student) => (
            <article
              key={student.id}
              className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(240px,1.2fr)_180px_180px_130px_150px] lg:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-semibold text-blue-700">
                  {getInitials(student.fullName)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-950">{student.fullName}</h3>
                  <p className="truncate text-sm text-slate-500">{student.username || "Chưa có username"}</p>
                </div>
              </div>
              <FieldValue label="Trung tâm/trường" value={student.centerName || "Chưa gán"} />
              <FieldValue label="Lớp" value={student.className || "Chưa gán"} />
              <FieldValue label="Điểm TB" value={formatScore(student.averageScore)} />
              <div>
                <Badge tone={student.status === "active" ? "success" : "outline"}>
                  {student.status === "active" ? "Đang hoạt động" : student.status || "Chưa rõ"}
                </Badge>
              </div>
            </article>
          ))}

          {!displayStudents.length ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              {isLoading ? "Đang tải danh sách học sinh..." : "Chưa có học sinh phù hợp với bộ lọc."}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardSectionCard>
  );
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
  return <HocLieuAuthoringWorkspaceV2 activeLeaf={activeLeaf} />;
}

function HocLieuAuthoringWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf }) {
  const selectedDocumentType = getInternalDocTypeFromLeafId(activeLeaf.id);
  const defaultFileType = selectedDocumentType === "slides" ? "PPTX" : "PDF";
  const [model, setModel] = useState<HocLieuTaxonomyResponse | null>(null);
  const [resources, setResources] = useState<HocLieuResourceCard[]>([]);
  const [subjectId, setSubjectId] = useState("giao-duc-stem");
  const [gradeId, setGradeId] = useState("1");
  const [bookSeriesId, setBookSeriesId] = useState("stem-hanh-trinh-sang-tao");
  const [topicId, setTopicId] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [title, setTitle] = useState(selectedDocumentType === "slides" ? "Bài giảng điện tử mới" : "Tài liệu học liệu mới");
  const [subtitle, setSubtitle] = useState("Giáo viên có thể mở nhanh trong Hoclieu");
  const [fileType, setFileType] = useState(defaultFileType);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void Promise.allSettled([
      loadHocLieuTaxonomies(),
      listHocLieuResources({ limit: 100 }),
    ])
      .then(([contentModelResult, resourceListResult]) => {
        if (cancelled) return;
        const contentModel = contentModelResult.status === "fulfilled" ? contentModelResult.value : null;
        const resourceList = resourceListResult.status === "fulfilled" ? resourceListResult.value : { data: [] };
        if (!contentModel) {
          setMessage("Không tải được taxonomy học liệu từ BE.");
          return;
        }
        setModel(contentModel);
        setResources(resourceList.data ?? []);
        const firstTopic = contentModel.topics?.find((item) => item.subjectId === subjectId && item.gradeId === gradeId);
        if (firstTopic) setTopicId(firstTopic.id);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "Không tải được dữ liệu học liệu từ BE.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFileType(defaultFileType);
  }, [defaultFileType]);

  const subjects = model?.subjects ?? [];
  const grades = model?.grades ?? [];
  const bookSeries = (model?.bookSeries ?? []).filter((item) => !item.subjectId || item.subjectId === subjectId);
  const topics = (model?.topics ?? []).filter((item) => {
    return (!item.subjectId || item.subjectId === subjectId) && (!item.gradeId || item.gradeId === gradeId);
  });
  const filteredResources = resources.filter((resource) => {
    return (
      (!subjectId || resource.subjectId === subjectId) &&
      (!gradeId || resource.gradeId === gradeId) &&
      (!selectedDocumentType || resource.documentTypeId === selectedDocumentType || resource.categoryId === selectedDocumentType)
    );
  });
  const selectedTypeMeta = INTERNAL_DOCUMENT_TYPES.find((type) => type.id === selectedDocumentType);

  async function refreshResources() {
    const next = await listHocLieuResources({ limit: 100 });
    setResources(next.data ?? []);
  }

  async function handleCreateTopic() {
    const label = newTopicName.trim();
    if (!label) return;
    setIsSaving(true);
    setMessage("");
    try {
      const created = await createHocLieuTaxonomy("topics", {
        label,
        subjectId,
        gradeId,
        bookSeriesId,
        categoryId: selectedDocumentType,
        status: "active",
        sortOrder: topics.length + 1,
      });
      setTopicId(created.id);
      setModel((current) =>
        current
          ? {
              ...current,
              topics: [...current.topics, created],
            }
          : current,
      );
      setNewTopicName("");
      setMessage("Đã tạo chủ đề mới. Giáo viên có thể gắn tài liệu vào chủ đề này ngay.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được chủ đề.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const created = await createHocLieuResource({
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: subtitle.trim(),
        programSlug: bookSeriesId || "hoclieu-erg",
        subjectId,
        gradeId,
        categoryId: selectedDocumentType,
        documentTypeId: selectedDocumentType,
        sectionId: selectedDocumentType,
        bookSeriesId,
        topicId,
        levelId: gradeId,
        selectedFileType: fileType,
        originalFileName: file?.name,
        detectedMimeType: file?.type,
        priceType: "free",
        visibility: "public",
        status: "published",
        canDownload: selectedDocumentType !== "slides",
        tags: [subjectId, gradeId, selectedDocumentType].filter(Boolean),
        lectureDesign:
          selectedDocumentType === "slides"
            ? {
                templateId: "hoclieu-lecture-grid",
                bannerTitle: subjectLabel(subjects, subjectId),
                bannerSubtitle: "BÀI GIẢNG ĐIỆN TỬ",
                accentColor: "#0891b2",
                secondaryColor: "#cffafe",
                itemColumns: 2,
                showDownload: true,
                unitLabels: topics.slice(0, 6).map((item) => item.label),
              }
            : undefined,
      });
      if (file) {
        await uploadHocLieuAsset({
          resourceId: created.id,
          file,
          selectedFileType: fileType,
          title: file.name,
          canDownload: selectedDocumentType !== "slides",
        });
      }
      await refreshResources();
      setMessage("Đã lưu và xuất bản học liệu lên BE. Hoclieu sẽ đọc tài liệu này từ API thật.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được học liệu.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="xl:col-span-2 grid gap-4 md:grid-cols-4">
        <DashboardMetricCard label="Môn học" value={String(subjects.length || "-")} detail="taxonomy từ BE" tone="blue" />
        <DashboardMetricCard label="Bộ sách" value={String(model?.bookSeries?.length ?? "-")} detail="có thể mở rộng theo môn" tone="emerald" />
        <DashboardMetricCard label="Chủ đề" value={String(model?.topics?.length ?? "-")} detail="hỗ trợ nhiều cấp" tone="violet" />
        <DashboardMetricCard label="Đã lọc" value={String(filteredResources.length)} detail={selectedTypeMeta?.label ?? "học liệu"} tone="amber" />
      </div>

      <DashboardSectionCard
        title="Tạo học liệu hiển thị trên Hoclieu"
        description="Luồng dành cho giáo viên: chọn môn, lớp, bộ sách, chủ đề, tải file lên và xem trước trước khi xuất bản."
      >
        <form className="grid gap-4" onSubmit={handleCreateResource}>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField label="Môn học" value={subjectId} onChange={setSubjectId} options={subjects} />
            <SelectField label="Lớp/level" value={gradeId} onChange={setGradeId} options={grades} />
            <SelectField label="Bộ sách" value={bookSeriesId} onChange={setBookSeriesId} options={bookSeries} />
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <SelectField label="Chủ đề/unit" value={topicId} onChange={setTopicId} options={topics} placeholder="Chọn chủ đề" />
            <div className="flex items-end gap-2">
              <Input value={newTopicName} onChange={(event) => setNewTopicName(event.target.value)} placeholder="Tạo chủ đề mới" />
              <Button type="button" variant="outline" onClick={() => void handleCreateTopic()} disabled={isSaving}>
                Tạo
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên học liệu" required />
            <select
              className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              value={fileType}
              onChange={(event) => setFileType(event.target.value)}
            >
              {(model?.fileTypes ?? ["PDF", "PPTX", "VIDEO", "AUDIO", "HTML5", "ZIP"]).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} placeholder="Mô tả ngắn cho giáo viên/học sinh" />
          <label className="grid min-h-[110px] cursor-pointer place-items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-6 text-center text-sm font-semibold text-blue-800 transition hover:border-blue-400 hover:bg-blue-50">
            <span>{file ? file.name : "Bấm để upload PDF, PPTX, video, audio, zip hoặc học liệu HTML5"}</span>
            <input className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          </label>
          {message ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
              {message}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || !title.trim()}>
              {isSaving ? "Đang lưu..." : "Lưu và xuất bản"}
            </Button>
          </div>
        </form>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Preview học liệu"
        description="Giao diện mô phỏng phần học sinh/giáo viên sẽ thấy trên Hoclieu."
      >
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_80px_-54px_rgba(15,23,42,0.45)]">
          <div className="bg-gradient-to-r from-cyan-700 to-cyan-500 p-6 text-white">
            <div className="text-xs font-black uppercase tracking-[0.22em] opacity-80">{subjectLabel(subjects, subjectId)}</div>
            <h3 className="mt-3 text-3xl font-black">{selectedDocumentType === "slides" ? "BÀI GIẢNG ĐIỆN TỬ" : title}</h3>
            <p className="mt-2 max-w-sm text-sm font-semibold text-cyan-50">{subtitle}</p>
          </div>
          <div className="grid gap-3 bg-white p-5">
            {(topics.length ? topics : [{ id: "preview", label: title }]).slice(0, 5).map((topic, index) => (
              <div
                key={topic.id}
                className={`rounded-2xl px-4 py-3 text-lg font-bold ${
                  index === 0 ? "bg-cyan-700 text-white" : "bg-cyan-50 text-cyan-900"
                }`}
              >
                {topic.label}
              </div>
            ))}
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard
        title="Học liệu đã xuất bản"
        description="Danh sách này lấy từ API /api/hoclieu/resources, không dùng mock."
        action={<Badge tone="secondary">{filteredResources.length} tài liệu</Badge>}
      >
        <div className="grid gap-3">
          {filteredResources.slice(0, 8).map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-950">{resource.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{resource.subtitle || resource.programSlug}</p>
                </div>
                <Badge tone={resource.status === "published" ? "success" : "secondary"}>
                  {resource.fileTypeBadge || resource.selectedFileType}
                </Badge>
              </div>
            </article>
          ))}
          {!filteredResources.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Chưa có tài liệu phù hợp bộ lọc. Tạo học liệu đầu tiên ở form bên trên.
            </div>
          ) : null}
        </div>
      </DashboardSectionCard>
    </div>
  );
}

function SelectField({
  label,
  options,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string }>;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      <select
        className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function subjectLabel(subjects: Array<{ id: string; label: string }>, subjectId: string) {
  return subjects.find((subject) => subject.id === subjectId)?.label ?? subjectId;
}

function LegacyInternalDocsWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf }) {
  const selectedTypeId = getInternalDocTypeFromLeafId(activeLeaf.id);
  const filteredDocuments = INTERNAL_DOCUMENTS.filter((document) => document.type === selectedTypeId);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4 md:grid-cols-2 xl:col-span-2 xl:grid-cols-4">
        {INTERNAL_DOCUMENT_TYPES.map((type) => {
          const count = INTERNAL_DOCUMENTS.filter((document) => document.type === type.id).length;

          return (
            <DashboardMetricCard
              key={type.id}
              label={type.label}
              value={String(count)}
              detail={type.description}
              tone={type.id === "slides" ? "blue" : type.id === "textbook" ? "emerald" : type.id === "program-plan" ? "amber" : "violet"}
            />
          );
        })}
      </div>

      <DashboardSectionCard
        title="Danh sách tài liệu nội bộ"
        description="Admin quản lý nguồn gốc tài liệu tại đây. Khi xuất bản, tài liệu sẽ hiện ở HocLieu theo chương trình và loại tài liệu tương ứng."
        action={<Button>Thêm tài liệu</Button>}
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <Input placeholder="Tìm theo tên tài liệu, chương trình, module..." aria-label="Tìm tài liệu nội bộ" />
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200">
            <option>Tất cả chương trình</option>
            <option>IC3 GS6</option>
            <option>MOS Master</option>
            <option>AI & Programming</option>
          </select>
          <select className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200">
            <option>Tất cả loại tài liệu</option>
            {INTERNAL_DOCUMENT_TYPES.map((type) => (
              <option key={type.id}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[minmax(260px,1.2fr)_150px_180px_120px_150px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
            <span>Tài liệu</span>
            <span>Loại</span>
            <span>Chương trình</span>
            <span>Phiên bản</span>
            <span>Cập nhật</span>
          </div>
          <div className="divide-y divide-slate-200 bg-white">
            {filteredDocuments.map((document) => {
              const type = INTERNAL_DOCUMENT_TYPES.find((item) => item.id === document.type);

              return (
                <article
                  key={document.id}
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(260px,1.2fr)_150px_180px_120px_150px] lg:items-center"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-slate-950">{document.title}</h3>
                    <p className="mt-1 truncate text-sm text-slate-500">{document.moduleName} · {document.owner}</p>
                  </div>
                  <Badge tone="secondary">{type?.label ?? "Tài liệu"}</Badge>
                  <FieldValue label="Chương trình" value={document.programName} />
                  <FieldValue label="Phiên bản" value={document.version} />
                  <FieldValue label="Cập nhật" value={document.updatedAt} />
                </article>
              );
            })}
          </div>
        </div>
      </DashboardSectionCard>

      <DashboardSectionCard title="Form thêm mới" description="Giữ ít trường để admin không bị rối, nhưng vẫn đủ dữ liệu cho HocLieu hiển thị đúng nơi.">
        <div className="space-y-3">
          <RuleLine label="Bắt buộc" value="Tên, loại tài liệu, chương trình, file/link" />
          <RuleLine label="Nên có" value="Level/module, phiên bản, ghi chú cập nhật" />
          <RuleLine label="Sau khi lưu" value="Tài liệu xuất hiện ở chi tiết chương trình và kho học liệu" />
        </div>
        <Button className="mt-4 w-full" variant="outline">Xem luồng xuất bản</Button>
      </DashboardSectionCard>
    </div>
  );
}

void HocLieuAuthoringWorkspace;
void LegacyInternalDocsWorkspace;

function getInternalDocTypeFromLeafId(leafId: string): InternalDocumentTypeId {
  if (leafId.endsWith("textbook")) return "textbook";
  if (leafId.endsWith("program-plan")) return "program-plan";
  if (leafId.endsWith("lesson-plan")) return "lesson-plan";
  return "slides";
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

function formatScore(value?: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "-";
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "H";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-medium text-slate-500 lg:hidden">{label}: </span>
      <span className="break-words text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function RuleLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
      <span className="font-semibold text-slate-950">{label}</span>
      <span className="text-right text-slate-500">{value}</span>
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


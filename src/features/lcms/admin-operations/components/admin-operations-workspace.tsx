import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Globe,
  Layers,
  LibraryBig,
  Mail,
  MapPin,
  Phone as PhoneIcon,
  Search,
  AlertTriangle,
  RefreshCw,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Input, Textarea } from "@/components/ui/dashboard-kit";
import { Button } from "@/components/ui/button";
import { TsForm } from "@/components/ui/tanstack-form";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { cn } from "@/lib/utils";
import type { ManagementScope } from "@/types/scope-types";
import { queryKeys } from "@/lib/query-keys";
import { AppSelect } from "@/components/ui/app-select";
import {
  LcmsActionRow,
  LcmsListSkeleton,
  LcmsMetricCard,
  LcmsMiniStat,
  LcmsPanel,
  LcmsPanelHeader,
  LcmsStatusChip,
} from "@/features/lcms/components/lcms-ui";

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
      <main className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)] p-4 pb-24 scroll-pb-24">
        <UserAccessControlWorkspace defaultSection="profile" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-permissions") {
    return (
      <main className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[var(--background)] p-4 pb-24 scroll-pb-24">
        <UserAccessControlWorkspace defaultSection="access" scopeDescription={scopeDescription} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-internal-docs") {
    return (
      <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--background)]">
        <InternalDocsWorkspace activeLeaf={activeLeaf} />
      </main>
    );
  }

  if (activeLeaf.variant === "admin-centers") {
    return (
      <main className="h-full min-h-0 overflow-hidden bg-[var(--background)] p-3 lg:p-4">
        <CenterManagement
          centers={scopedCenters}
          classes={scopedClasses}
          managementScope={managementScope}
          onCreateUnit={() => onOpenLeaf("admin-create-unit")}
          scopeDescription={scopeDescription}
        />
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
        <div className="flex flex-col gap-2 rounded-lg border border-[#d9e2ef] bg-[#f8fbff] px-3 py-2 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-slate-400">Phạm vi đang xem</p>
            <p className="truncate text-xs font-bold text-slate-800">{scopeDescription}</p>
          </div>
          <Badge tone="secondary" className="min-h-6 px-2 py-0.5 text-[11px]">Quyền ERG</Badge>
        </div>
      }
    >
      {activeLeaf.variant === "admin-overview" ? (
        <AdminOverview
          centers={scopedCenters}
          classCount={scopedClasses.length}
          onOpenLeaf={onOpenLeaf}
          studentCount={scopedStudents.length}
        />
      ) : null}
      {activeLeaf.variant === "admin-sheet-import" ? (
        <SheetImportWorkspace managementScope={managementScope} centers={scopedCenters} classes={scopedClasses} />
      ) : null}
    </DashboardPageShell>
  );
}

function getAdminActions(activeLeaf: DashboardLeaf, onOpenLeaf: (leafId: string) => void) {
  if (activeLeaf.variant === "admin-overview") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">Xuất báo cáo</Button>
        <Button variant="outline" size="sm" onClick={() => onOpenLeaf("admin-learning-resources")}>Quản lý học liệu</Button>
        <Button
          size="sm"
          onClick={() => onOpenLeaf("admin-create-unit")}
        >
          Tạo trường/trung tâm
        </Button>
      </div>
    );
  }

  if (activeLeaf.variant === "admin-centers") {
    return null;
  }

  if (activeLeaf.variant === "admin-members") {
    return <Button size="sm">Thêm thành viên</Button>;
  }

  return <Button variant="outline" size="sm">Xuất báo cáo</Button>;
}

function AdminOverview({
  centers,
  classCount,
  onOpenLeaf,
  studentCount,
}: {
  centers: ClassroomSchool[];
  classCount: number;
  onOpenLeaf: (leafId: string) => void;
  studentCount: number;
}) {
  const flaggedStudents = centers.reduce((sum, center) => sum + center.flaggedStudents, 0);
  const averageCompletion = Math.round(
    centers.reduce((sum, center) => sum + center.completionRate, 0) / Math.max(1, centers.length),
  );
  const coverageItems = [
    {
      icon: ClipboardCheck,
      lmsArea: "Homework",
      lcmsSource: "Quiz bank + Gói giao bài",
      status: "Đủ nguồn",
      leafId: "quiz-bank",
      detail: "Bài Train/Test có thể giao lại ngay.",
    },
    {
      icon: BarChart3,
      lmsArea: "Score",
      lcmsSource: "Thang điểm + rubric",
      status: "Setup",
      leafId: "rubric-templates",
      detail: "Chuẩn phân loại kết quả trước khi đẩy sang bảng điểm.",
    },
    {
      icon: CalendarDays,
      lmsArea: "Attendance, Calendar",
      lcmsSource: "Mẫu buổi học",
      status: "Setup",
      leafId: "session-templates",
      detail: "Khung buổi học, ghi chú lớp và quy tắc điểm danh.",
    },
    {
      icon: LibraryBig,
      lmsArea: "Resources",
      lcmsSource: "Quản trị học liệu",
      status: "Đang dùng",
      leafId: "admin-learning-resources",
      detail: "Taxonomy, metadata, file học liệu và publish.",
    },
    {
      icon: FileText,
      lmsArea: "Reports",
      lcmsSource: "Mẫu báo cáo",
      status: "Setup",
      leafId: "report-templates",
      detail: "Chỉ số, nhãn cảnh báo và cấu trúc tổng hợp.",
    },
    {
      icon: BookOpenCheck,
      lmsArea: "Quiz runtime",
      lcmsSource: "Tạo quiz",
      status: "Đang dùng",
      leafId: "course-modules",
      detail: "Biên soạn slide, câu hỏi và cấu hình player.",
    },
  ] satisfies Array<{
    detail: string;
    icon: LucideIcon;
    leafId: string;
    lcmsSource: string;
    lmsArea: string;
    status: string;
  }>;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LcmsMetricCard icon={<Layers className="h-4 w-4" />} label="Nguồn LMS" value="6" detail="Module LCMS cấp dữ liệu." tone="blue" />
        <LcmsMetricCard icon={<Building2 className="h-4 w-4" />} label="Lớp học" value={String(classCount)} detail="Đang nhận nội dung." tone="emerald" />
        <LcmsMetricCard icon={<UsersRound className="h-4 w-4" />} label="Học sinh" value={studentCount.toLocaleString("vi-VN")} detail="Tài khoản đích." tone="violet" />
        <LcmsMetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Cần rà soát" value={String(flaggedStudents)} detail="Ảnh hưởng vận hành LMS." tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <DashboardSectionCard
          title="LCMS tạo gì cho LMS"
          description="Mỗi chức năng giáo viên dùng trong LMS đều có nguồn cấu hình hoặc nội dung tương ứng ở LCMS."
        >
          <div className="mt-2 grid gap-3">
            {coverageItems.map((item) => (
              <LmsCoverageRow key={item.lmsArea} item={item} onOpenLeaf={onOpenLeaf} />
            ))}
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard
          title="Việc cần xử lý"
          description="Chỉ giữ các việc ảnh hưởng trực tiếp tới khả năng giao bài và xuất bản."
        >
          <div className="mt-2 space-y-3">
            <ActionItem title="Import danh sách lớp trong trường" detail="Vào Trường & Trung tâm, chọn trường rồi import lớp/học sinh tại chi tiết trường." urgent />
            <ActionItem title="Kiểm tra quyền global" detail="1 tài khoản giáo viên đề xuất quyền quản trị nội dung." />
            <ActionItem title="Rà soát học liệu IC3" detail={`Mức hoàn thành trung bình ${averageCompletion}%. Cần bổ sung tài nguyên dùng chung.`} />
          </div>
        </DashboardSectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)]">
        <DashboardSectionCard 
          title="Sức khỏe vận hành theo đơn vị" 
          description="Theo dõi cơ sở đang nhận nội dung, lớp học và tín hiệu cần hỗ trợ."
        >
          <div className="mt-2 grid gap-3 lg:grid-cols-2">
            {centers.map((center) => (
              <CenterRow key={center.id} center={center} />
            ))}
          </div>
        </DashboardSectionCard>
      </div>
    </div>
  );
}

function LmsCoverageRow({
  item,
  onOpenLeaf,
}: {
  item: {
    detail: string;
    icon: LucideIcon;
    leafId: string;
    lcmsSource: string;
    lmsArea: string;
    status: string;
  };
  onOpenLeaf: (leafId: string) => void;
}) {
  const Icon = item.icon;
  const setup = item.status === "Setup";

  return (
    <LcmsActionRow
      onClick={() => onOpenLeaf(item.leafId)}
      icon={<Icon className="h-4 w-4" />}
      tone={setup ? "amber" : "blue"}
      action={<LcmsStatusChip tone={setup ? "amber" : "emerald"}>{item.status}</LcmsStatusChip>}
    >
      <span className="grid gap-1 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] sm:gap-4">
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase text-slate-400">LMS</span>
          <span className="mt-0.5 block truncate text-sm font-bold text-slate-950">{item.lmsArea}</span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-700">{item.lcmsSource}</span>
          <span className="mt-1 block line-clamp-2 text-xs font-medium leading-5 text-slate-500">{item.detail}</span>
        </span>
      </span>
    </LcmsActionRow>
  );
}

function CenterManagement({
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
        queryKey: queryKeys.adminOperations.educationUnits(debouncedKeyword, typeFilter),
        queryFn: () =>
          listEducationUnits({
            keyword: debouncedKeyword.trim() || undefined,
            type: typeFilter || undefined,
            limit: 100,
          }),
        staleTime: 60_000,
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
  }, [debouncedKeyword, queryClient, retryToken, typeFilter]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId) ?? units[0];
  const sortedUnits = useMemo(() => sortEducationUnits(units), [units]);
  const systemCount = units.filter((unit) => unit.type === "system").length;
  const centerCount = units.filter((unit) => unit.type === "center").length;
  const schoolCount = units.filter((unit) => unit.type === "school").length;
  const hasLoadError = Boolean(errorMessage && !isLoading && units.length === 0);

  function retryLoadUnits() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.educationUnits() });
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.educationUnits() });
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
            <Button size="sm" onClick={onCreateUnit}>Tạo đơn vị</Button>
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
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm trường..." className="h-9 bg-white pl-9 text-xs shadow-none" />
              </div>
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

function OperationalErrorState({
  className,
  message,
  onRetry,
  title,
}: {
  className?: string;
  message: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <div className={cn("rounded-xl border border-rose-200 bg-rose-50/75 p-3", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-rose-800">{title}</div>
          <p className="mt-1 break-words text-xs leading-5 text-rose-700">{message}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-8 shrink-0 border-rose-200 bg-white px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tải lại
        </Button>
      </div>
    </div>
  );
}

function EducationUnitEditor({
  centers,
  classes,
  isSaving,
  managementScope,
  onSave,
  successMessage,
  unit,
  units,
}: {
  centers: ClassroomSchool[];
  classes: ClassroomSnapshot[];
  isSaving: boolean;
  managementScope: ManagementScope;
  onSave: (unit: LmsEducationUnitDTO) => void;
  successMessage: string;
  unit: LmsEducationUnitDTO;
  units: LmsEducationUnitDTO[];
}) {
  const [draft, setDraft] = useState<LmsEducationUnitDTO>(unit);
  const [activePanel, setActivePanel] = useState<"info" | "import">("info");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const centerOptions = units.filter((item) => item.type === "center" && item.id !== unit.id);
  const isSchool = draft.type === "school";
  const unitClasses = classes.filter((snapshot) => snapshot.schoolId === unit.id);
  const studentTotal = unitClasses.reduce((sum, snapshot) => sum + snapshot.studentCount, 0);
  const detailHint = isSchool
    ? "Cập nhật thông tin trường hoặc import danh sách lớp cho LMS."
    : draft.type === "center"
    ? "Cập nhật trung tâm và các thông tin quản lý trường trực thuộc."
    : "Cập nhật cấp hệ thống dùng chung cho toàn LCMS.";
  const paceStateUpdate = usePacedStateBatch();
  const form = useForm({
    defaultValues: draft,
    onSubmit: () => onSave(draft),
  });

  useEffect(() => {
    paceStateUpdate(() => {
      setDraft(unit);
      setActivePanel("info");
      setShowAdvanced(false);
    });
  }, [paceStateUpdate, unit]);

  function updateDraft<K extends keyof LmsEducationUnitDTO>(key: K, value: LmsEducationUnitDTO[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const header = (
    <div className="flex flex-col gap-3 border-b border-[#edf1f7] bg-[#fbfdff] p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <UnitAvatar unit={draft} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-slate-950">{draft.name || "Cơ sở giáo dục"}</h3>
            <UnitTypeBadge type={draft.type} />
          </div>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{detailHint}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{draft.code || "Chưa có mã định danh"}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
        <div className="inline-flex items-center gap-1 rounded-[12px] border border-[#d9e2ef] bg-white p-1 shadow-[var(--shadow-xs)]">
          <Button
            type="button"
            size="sm"
            variant={activePanel === "info" ? "secondary" : "ghost"}
            onClick={() => setActivePanel("info")}
            className={cn("h-8 rounded-[9px] px-3 text-xs", activePanel === "info" ? "text-[var(--erg-blue)]" : "text-slate-500")}
          >
            Thông tin
          </Button>
          {isSchool ? (
            <Button
              type="button"
              size="sm"
              variant={activePanel === "import" ? "secondary" : "ghost"}
              onClick={() => setActivePanel("import")}
              className={cn("h-8 rounded-[9px] px-3 text-xs", activePanel === "import" ? "text-[var(--erg-blue)]" : "text-slate-500")}
            >
              Import danh sách lớp
            </Button>
          ) : null}
        </div>
        {activePanel === "info" ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAdvanced((current) => !current)} className="h-9 px-3 text-xs">
              {showAdvanced ? "Ẩn nâng cao" : "Nâng cao"}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving || !draft.name?.trim()} className="h-9 px-3 text-xs">
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );

  if (activePanel === "import" && isSchool) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex-1 overflow-y-auto bg-[#f7f9fc] p-4">
          <StudentSheetImportWorkspace
            centers={centers}
            classes={classes}
            compact
            lockedCenter={{ id: unit.id, name: unit.name }}
            managementScope={managementScope}
          />
        </div>
      </div>
    );
  }

  return (
    <TsForm
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
      className="flex flex-col h-full"
    >
      {header}

      <div className="flex-1 overflow-y-auto bg-[#f7f9fc] p-4">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {successMessage ? (
              <div className="flex items-center gap-2 rounded-[14px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle className="h-4 w-4" /> {successMessage}
              </div>
            ) : null}

            <div className="rounded-[18px] border border-[#dfe7f2] bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-normal text-slate-700">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#d6e8ff] bg-[#f4f9ff] text-[var(--erg-blue)]">
                    <Building2 className="h-4 w-4" />
                  </span>
                  Thông tin cơ bản
                </div>
                <LcmsStatusChip tone={draft.status === "active" ? "emerald" : "amber"}>{draft.status === "active" ? "Đang hoạt động" : "Cần kiểm tra"}</LcmsStatusChip>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px]">
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Tên hiển thị</span>
                  <Input className="h-10" value={draft.name ?? ""} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Tên trường học/trung tâm" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Loại đơn vị</span>
                  <AppSelect
                    value={draft.type ?? "school"}
                    onChange={(event) => updateDraft("type", event.target.value)}
                    className="h-10 rounded-[10px] border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    <option value="system">Hệ thống</option>
                    <option value="center">Trung tâm</option>
                    <option value="school">Trường học</option>
                  </AppSelect>
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-bold text-slate-500">Trạng thái</span>
                  <AppSelect
                    value={draft.status ?? "active"}
                    onChange={(event) => updateDraft("status", event.target.value)}
                    className="h-10 rounded-[10px] border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="archived">Lưu trữ</option>
                    <option value="inactive">Tạm dừng</option>
                  </AppSelect>
                </label>
                <label className="grid gap-1.5 xl:col-span-3">
                  <span className="text-xs font-bold text-slate-500">Mô tả giới thiệu</span>
                  <Textarea
                    value={draft.description ?? ""}
                    onChange={(event) => updateDraft("description", event.target.value)}
                    rows={2}
                    className="min-h-[112px] rounded-[12px] border border-[#d7e0ec] bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-none outline-none transition focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)] placeholder:text-slate-400"
                    placeholder="Mô tả tóm tắt vai trò và khu vực phụ trách của đơn vị..."
                  />
                </label>
              </div>
            </div>

        {showAdvanced ? (
          <>
        <div className="rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Mail className="h-4 w-4 text-[var(--erg-blue)]" /> Thông tin liên hệ
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-500">Logo URL</span>
              <Input className="h-9" value={draft.avatarUrl ?? ""} onChange={(event) => updateDraft("avatarUrl", event.target.value)} placeholder="https://domain.com/logo.png" />
            </label>
            <label className="grid gap-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-500">Địa chỉ chi tiết</span>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 pl-9" value={draft.address ?? ""} onChange={(event) => updateDraft("address", event.target.value)} placeholder="Số nhà, tên đường, phường, quận/huyện..." />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-slate-500">Số điện thoại</span>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 pl-9" value={draft.phone ?? ""} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="024xxx..." />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-slate-500">Email chính</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 pl-9" value={draft.email ?? ""} onChange={(event) => updateDraft("email", event.target.value)} placeholder="contact@domain.edu.vn" />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-slate-500">Website URL</span>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input className="h-9 pl-9" value={draft.website ?? ""} onChange={(event) => updateDraft("website", event.target.value)} placeholder="https://domain.edu.vn" />
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 p-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Layers className="h-4 w-4 text-[var(--erg-blue)]" /> Cấu hình liên kết
          </div>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-slate-500">Thu thuộc Trung tâm quản lý</span>
              <AppSelect
                value={draft.parentId ?? ""}
                onChange={(event) => updateDraft("parentId", event.target.value)}
                disabled={draft.type !== "school"}
                className="h-9 rounded-md border border-[#d7e0ec] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)] disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Không liên kết trung tâm nào</option>
                {centerOptions.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </AppSelect>
              {draft.type !== "school" ? <span className="text-[10px] font-semibold text-slate-400">Chỉ cơ sở loại "Trường học" mới cấu hình thuộc Trung tâm.</span> : null}
            </label>
          </div>
        </div>
          </>
        ) : null}

            <ClassPreviewPanel classes={unitClasses} isSchool={isSchool} />
          </div>

          <UnitInsightRail
            isSchool={isSchool}
            onImport={() => setActivePanel("import")}
            unit={draft}
            unitClasses={unitClasses.length}
            studentTotal={studentTotal}
          />
        </div>
      </div>
    </TsForm>
  );
}

function UnitInsightRail({
  isSchool,
  onImport,
  studentTotal,
  unit,
  unitClasses,
}: {
  isSchool: boolean;
  onImport: () => void;
  studentTotal: number;
  unit: LmsEducationUnitDTO;
  unitClasses: number;
}) {
  return (
    <aside className="space-y-4">
      <div className="overflow-hidden rounded-[18px] border border-[#dfdcff] bg-[#f6f4ff] shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
        <div className="border-b border-[#e3dfff] px-4 py-3">
          <p className="text-[11px] font-bold uppercase text-[#7068c9]">LCMS → LMS</p>
          <h4 className="mt-1 text-sm font-bold text-slate-950">Dữ liệu đẩy sang LMS</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          <DetailStat label="Lớp" value={unitClasses} tone="blue" />
          <DetailStat label="Học sinh" value={studentTotal.toLocaleString("vi-VN")} tone="emerald" />
          <DetailStat label="Mã" value={unit.code || "NO-CODE"} tone="violet" wide />
        </div>
        {isSchool ? (
          <div className="border-t border-[#e3dfff] p-3">
            <Button
              type="button"
              size="sm"
              className="w-full justify-center text-white shadow-[0_14px_35px_-20px_rgba(91,92,246,0.8)]"
              style={{ backgroundColor: "#5b5cf6", borderColor: "#5b5cf6", color: "#fff" }}
              onClick={onImport}
            >
              Import danh sách lớp
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-[18px] border border-[#dfe7f2] bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-bold text-slate-950">Hoạt động gần đây</h4>
          <LcmsStatusChip tone="blue">Live</LcmsStatusChip>
        </div>
        <div className="mt-4 space-y-4">
          <TimelineItem icon={<CheckCircle className="h-3.5 w-3.5" />} title="Đã chọn phạm vi" detail={unit.name} tone="emerald" />
          <TimelineItem icon={<FileText className="h-3.5 w-3.5" />} title="Sẵn sàng cập nhật" detail="Thông tin đơn vị và liên kết LMS." tone="blue" />
          <TimelineItem icon={<CalendarDays className="h-3.5 w-3.5" />} title="Bước tiếp theo" detail={isSchool ? "Import lớp trong trường này." : "Chọn một trường để import lớp."} tone="amber" />
        </div>
      </div>
    </aside>
  );
}

function ClassPreviewPanel({ classes, isSchool }: { classes: ClassroomSnapshot[]; isSchool: boolean }) {
  return (
    <div className="rounded-[18px] border border-[#dfe7f2] bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.6)]">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">Danh sách lớp</p>
          <h4 className="mt-1 text-sm font-bold text-slate-950">{isSchool ? "Lớp thuộc trường này" : "Chọn trường để xem lớp"}</h4>
        </div>
        {isSchool ? <LcmsStatusChip tone={classes.length ? "emerald" : "amber"}>{classes.length ? `${classes.length} lớp` : "Chưa có lớp"}</LcmsStatusChip> : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {isSchool && classes.length ? (
          classes.slice(0, 3).map((classroom) => (
            <div key={classroom.id} className="rounded-[16px] border border-[#dfe7f2] bg-[#fbfdff] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{classroom.className}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{classroom.gradeLabel}</p>
                </div>
                <LcmsStatusChip tone="blue">{classroom.studentCount} HS</LcmsStatusChip>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 p-2">
                  <p className="font-bold text-emerald-700">{classroom.completionRate}%</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-emerald-600/70">Hoàn thành</p>
                </div>
                <div className="rounded-[12px] border border-amber-100 bg-amber-50 p-2">
                  <p className="font-bold text-amber-700">{classroom.riskStudents}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase text-amber-600/70">Cần hỗ trợ</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="xl:col-span-3 rounded-[16px] border border-dashed border-[#cfd9e8] bg-[#f8fbff] px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-800">{isSchool ? "Chưa có lớp trong trường này" : "Chọn một trường học"}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {isSchool ? "Dùng import danh sách lớp để tạo dữ liệu lớp và học sinh." : "Chi tiết lớp và học sinh sẽ hiển thị tại đây."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailStat({
  label,
  tone,
  value,
  wide = false,
}: {
  label: string;
  tone: "blue" | "emerald" | "violet";
  value: ReactNode;
  wide?: boolean;
}) {
  const colorClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={cn("rounded-[14px] border bg-white p-3", colorClass, wide && "col-span-2")}>
      <p className="text-[10px] font-bold uppercase opacity-75">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function TimelineItem({
  detail,
  icon,
  title,
  tone,
}: {
  detail: string;
  icon: ReactNode;
  title: string;
  tone: "blue" | "emerald" | "amber";
}) {
  const colorClass =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className="flex gap-3">
      <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border", colorClass)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function UnitAvatar({ size = "md", unit }: { size?: "sm" | "md" | "lg"; unit: LmsEducationUnitDTO }) {
  const initials = unit.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const sizeClass = size === "lg" ? "h-14 w-14 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";

  if (unit.avatarUrl) {
    return <img src={unit.avatarUrl} alt={unit.name} className={cn(sizeClass, "shrink-0 rounded-lg border border-[#e0e4ea] object-cover shadow-sm")} />;
  }

  const bgClass =
    unit.type === "system"
      ? "bg-rose-50 text-rose-600 border-rose-100"
      : unit.type === "center"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-blue-50 text-blue-600 border-blue-100";

  return (
    <span className={cn(sizeClass, "grid shrink-0 place-items-center rounded-lg border font-bold shadow-inner", bgClass)}>
      {initials || "ERG"}
    </span>
  );
}

function UnitTypeBadge({ type }: { type?: string }) {
  const label = type === "system" ? "Hệ thống" : type === "center" ? "Trung tâm" : "Trường học";
  const badgeClass =
    type === "system"
      ? "bg-rose-50 text-rose-600 border-rose-200/60"
      : type === "center"
      ? "bg-emerald-50 text-emerald-600 border-emerald-200/60"
      : "bg-blue-50 text-blue-600 border-blue-200/60";

  return <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", badgeClass)}>{label}</span>;
}

function unitRank(type?: string) {
  if (type === "system") return 0;
  if (type === "center") return 1;
  return 2;
}

function sortEducationUnits(units: LmsEducationUnitDTO[]) {
  return [...units].sort((a, b) => unitRank(a.type) - unitRank(b.type) || a.name.localeCompare(b.name, "vi"));
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
    <div className="h-full min-h-0 p-4">
      <LearningResourceAuthoringWorkspace activeLeaf={activeLeaf} />
    </div>
  );
}

function CenterRow({ center }: { center: ClassroomSchool }) {
  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:shadow-md transition duration-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{center.name}</h3>
          <p className="mt-0.5 text-xs text-slate-400 font-semibold">
            {center.activeClasses} lớp đang chạy · {center.activeStudents.toLocaleString("vi-VN")} học sinh
          </p>
        </div>
        <Badge tone={center.flaggedStudents > 25 ? "warning" : "success"}>
          {center.flaggedStudents > 25 ? "Cần rà soát" : "Vận hành ổn định"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 grid-cols-3 border-t border-slate-100 pt-3">
        <FieldValue label="Hoàn thành" value={`${center.completionRate}%`} />
        <FieldValue label="Điểm TB" value={`${center.averageScore}`} />
        <FieldValue label="Hỗ trợ" value={`${center.flaggedStudents} em`} />
      </div>
    </article>
  );
}

function ActionItem({ detail, title, urgent }: { detail: string; title: string; urgent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 transition duration-200 shadow-sm flex items-start gap-3",
      urgent 
        ? "border-amber-200 bg-amber-50/50 hover:bg-amber-50" 
        : "border-slate-200 bg-white hover:bg-slate-50/30"
    )}>
      {urgent ? (
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
      )}
      <div>
        <h3 className="font-bold text-slate-800 text-xs">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function FieldValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">{label}</span>
      <span className="break-words text-xs font-bold text-slate-700 mt-0.5 block">{value}</span>
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

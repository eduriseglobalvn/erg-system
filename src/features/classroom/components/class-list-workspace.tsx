import { useMemo, useState } from "react";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { Badge, Button, EmptyState, Input, ProgressBar } from "@/components/ui/dashboard-kit";
import {
  classroomSchools,
  getSchoolSnapshots,
} from "@/features/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot } from "@/features/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";

type ClassListMode = "active" | "ended";

type ClassListWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  mode: ClassListMode;
  onOpenLeaf: (leafId: string) => void;
  selectedSchoolId: string;
};

type EndedClassRow = ClassroomSnapshot & {
  endedAt: string;
  archiveStatus: "ready" | "review";
};

export function ClassListWorkspace({
  activeLeaf,
  mode,
  onOpenLeaf,
  selectedSchoolId,
}: ClassListWorkspaceProps) {
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const selectedSchool = classroomSchools.find((school) => school.id === selectedSchoolId) ?? classroomSchools[0];
  const schoolClasses = useMemo(() => getSchoolSnapshots(selectedSchoolId), [selectedSchoolId]);
  const endedClasses = useMemo(() => buildEndedClasses(schoolClasses), [schoolClasses]);
  const rows = mode === "active" ? schoolClasses : endedClasses;
  const gradeOptions = Array.from(new Set(rows.map((item) => item.gradeLabel)));
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredRows = rows.filter((item) => {
    const matchesGrade = gradeFilter === "all" || item.gradeLabel === gradeFilter;
    const matchesSearch =
      !normalizedSearch ||
      item.className.toLowerCase().includes(normalizedSearch) ||
      item.homeroomTeacher.toLowerCase().includes(normalizedSearch);

    return matchesGrade && matchesSearch;
  });
  const activeDescription =
    "Theo dõi lớp đang dạy, giáo viên phụ trách, số học sinh và những lớp cần hỗ trợ trong hôm nay.";
  const endedDescription =
    "Lưu lại các lớp đã kết thúc để giáo viên và quản trị viên mở lại báo cáo khi cần đối chiếu.";
  const clearFilters = () => {
    setGradeFilter("all");
    setSearchValue("");
  };

  return (
    <DashboardPageShell
      badge={mode === "active" ? "Lớp đang dạy" : "Lớp lưu trữ"}
      title={activeLeaf.title}
      description={mode === "active" ? activeDescription : endedDescription}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <div className="flex flex-wrap gap-2">
          {mode === "active" ? (
            <>
              <Button variant="outline">Nhập từ Excel</Button>
              <Button>Thêm lớp học</Button>
            </>
          ) : (
            <Button variant="outline">Xuất báo cáo</Button>
          )}
        </div>
      }
    >
      <DashboardSectionCard
        title={mode === "active" ? "Danh sách lớp đang hoạt động" : "Danh sách lớp đã kết thúc"}
        description={`${selectedSchool.name} · ${filteredRows.length} lớp hiển thị`}
        action={
          mode === "active" ? (
            <Button variant="outline" onClick={() => onOpenLeaf("class-students")}>
              Xem học sinh
            </Button>
          ) : null
        }
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <Input
            aria-label="Tìm lớp học"
            placeholder="Tìm theo tên lớp hoặc giáo viên"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <select
            aria-label="Lọc khối"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="all">Tất cả khối</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <select
            aria-label="Năm học"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
            defaultValue="2025-2026"
          >
            <option value="2025-2026">Năm học 2025 - 2026</option>
            <option value="2024-2025">Năm học 2024 - 2025</option>
          </select>
        </div>

        {filteredRows.length ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[minmax(180px,1fr)_160px_120px_130px_170px_130px] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:grid">
              <span>Lớp</span>
              <span>Giáo viên</span>
              <span>Học sinh</span>
              <span>Điểm TB</span>
              <span>{mode === "active" ? "Tiến độ" : "Kết thúc"}</span>
              <span>Thao tác</span>
            </div>
            <div className="divide-y divide-slate-200 bg-white">
              {filteredRows.map((classroom) => (
                <ClassRow
                  key={classroom.id}
                  classroom={classroom}
                  mode={mode}
                  onOpenLeaf={onOpenLeaf}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            title={mode === "active" ? "Chưa có lớp đang hoạt động" : "Chưa có lớp đã kết thúc"}
            description="Thử đổi bộ lọc hoặc chọn trung tâm khác ở thanh Đang xem."
            action={<Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>}
          />
        )}
      </DashboardSectionCard>
    </DashboardPageShell>
  );
}

function ClassRow({
  classroom,
  mode,
  onOpenLeaf,
}: {
  classroom: ClassroomSnapshot | EndedClassRow;
  mode: ClassListMode;
  onOpenLeaf: (leafId: string) => void;
}) {
  const endedAt = "endedAt" in classroom ? classroom.endedAt : undefined;
  const archiveStatus = "archiveStatus" in classroom ? classroom.archiveStatus : undefined;

  return (
    <article className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(180px,1fr)_160px_120px_130px_170px_130px] lg:items-center">
      <div className="min-w-0">
        <h3 className="truncate font-semibold text-slate-950">{classroom.className}</h3>
        <p className="mt-1 text-sm text-slate-500">{classroom.gradeLabel} · {classroom.schoolName}</p>
      </div>
      <FieldValue label="Giáo viên" value={classroom.homeroomTeacher} />
      <FieldValue label="Học sinh" value={classroom.studentCount.toLocaleString("vi-VN")} />
      <FieldValue label="Điểm TB" value={String(classroom.averageScore)} />
      <div>
        {mode === "active" ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500 lg:hidden">Tiến độ</span>
              <span className="font-semibold text-slate-950">{classroom.completionRate}%</span>
            </div>
            <ProgressBar
              className="mt-2 h-2"
              indicatorClassName={classroom.riskStudents >= 5 ? "bg-amber-500" : "bg-emerald-500"}
              value={classroom.completionRate}
            />
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Badge tone={archiveStatus === "review" ? "warning" : "success"}>
              {archiveStatus === "review" ? "Cần rà soát" : "Sẵn sàng"}
            </Badge>
            <span className="text-sm font-medium text-slate-500">{endedAt}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 lg:justify-end">
        <Button size="sm" variant="outline" onClick={() => onOpenLeaf("class-reports")}>
          Báo cáo
        </Button>
        <Button size="sm" onClick={() => onOpenLeaf("class-students")}>
          Học sinh
        </Button>
      </div>
    </article>
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

function buildEndedClasses(classes: ClassroomSnapshot[]): EndedClassRow[] {
  return classes.slice(0, Math.max(1, Math.min(3, classes.length))).map((classroom, index) => ({
    ...classroom,
    id: `${classroom.id}-ended`,
    completionRate: 100,
    endedAt: index === 0 ? "31/12/2025" : "30/09/2025",
    archiveStatus: index % 2 === 0 ? "ready" : "review",
  }));
}

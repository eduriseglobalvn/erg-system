import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { DataTable } from "@/components/ui/data-table";
import { Badge, Button, EmptyState, Input, ProgressBar } from "@/components/ui/dashboard-kit";
import {
  classroomSchools,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { AppSelect } from "@/components/ui/app-select";

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
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const selectedSchool = classroomSchools.find((school) => school.id === selectedSchoolId) ?? classroomSchools[0];
  const schoolClasses = useMemo(() => getSchoolSnapshots(selectedSchoolId), [selectedSchoolId]);
  const endedClasses = useMemo(() => buildEndedClasses(schoolClasses), [schoolClasses]);
  const rows = mode === "active" ? schoolClasses : endedClasses;
  const gradeOptions = Array.from(new Set(rows.map((item) => item.gradeLabel)));
  const normalizedSearch = debouncedSearchValue.trim().toLowerCase();
  const filteredRows = rows.filter((item) => {
    const matchesGrade = gradeFilter === "all" || item.gradeLabel === gradeFilter;
    const matchesSearch =
      !normalizedSearch ||
      item.className.toLowerCase().includes(normalizedSearch) ||
      item.homeroomTeacher.toLowerCase().includes(normalizedSearch);

    return matchesGrade && matchesSearch;
  });
  const columns = useMemo<Array<ColumnDef<ClassroomSnapshot | EndedClassRow>>>(
    () => [
      {
        accessorKey: "className",
        cell: ({ row }) => (
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-950">{row.original.className}</h3>
            <p className="mt-1 text-sm text-slate-500">{row.original.gradeLabel} · {row.original.schoolName}</p>
          </div>
        ),
        header: "Lớp",
      },
      {
        accessorKey: "homeroomTeacher",
        header: "Giáo viên",
      },
      {
        accessorKey: "studentCount",
        cell: ({ row }) => row.original.studentCount.toLocaleString("vi-VN"),
        header: "Học sinh",
      },
      {
        accessorKey: "averageScore",
        header: "Điểm TB",
      },
      {
        accessorKey: "completionRate",
        cell: ({ row }) => {
          const endedAt = "endedAt" in row.original ? row.original.endedAt : undefined;
          const archiveStatus = "archiveStatus" in row.original ? row.original.archiveStatus : undefined;

          return mode === "active" ? (
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-950">{row.original.completionRate}%</span>
              </div>
              <ProgressBar
                className="mt-2 h-2"
                indicatorClassName={row.original.riskStudents >= 5 ? "bg-amber-500" : "bg-emerald-500"}
                value={row.original.completionRate}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge tone={archiveStatus === "review" ? "warning" : "success"}>
                {archiveStatus === "review" ? "Cần rà soát" : "Sẵn sàng"}
              </Badge>
              <span className="text-sm font-medium text-slate-500">{endedAt}</span>
            </div>
          );
        },
        header: mode === "active" ? "Tiến độ" : "Kết thúc",
      },
      {
        id: "actions",
        cell: () => (
          <div className="flex gap-2 lg:justify-end">
            <Button size="sm" variant="outline" onClick={() => onOpenLeaf("class-reports")}>
              Báo cáo
            </Button>
            <Button size="sm" onClick={() => onOpenLeaf("class-students")}>
              Học sinh
            </Button>
          </div>
        ),
        enableSorting: false,
        header: "Thao tác",
      },
    ],
    [mode, onOpenLeaf],
  );
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
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--erg-blue)]" />
            <Input
              aria-label="Tìm lớp học"
              placeholder="Tìm theo tên lớp hoặc giáo viên"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
          <AppSelect
            aria-label="Lọc khối"
            className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="all">Tất cả khối</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </AppSelect>
          <AppSelect
            aria-label="Năm học"
            className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-[14px] font-bold text-slate-900 outline-none focus:border-[var(--erg-blue)] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            defaultValue="2025-2026"
          >
            <option value="2025-2026">Năm học 2025 - 2026</option>
            <option value="2024-2025">Năm học 2024 - 2025</option>
          </AppSelect>
        </div>

        {filteredRows.length ? (
          <DataTable className="mt-4 rounded-lg" columns={columns} data={filteredRows} />
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

function buildEndedClasses(classes: ClassroomSnapshot[]): EndedClassRow[] {
  return classes.slice(0, Math.max(1, Math.min(3, classes.length))).map((classroom, index) => ({
    ...classroom,
    id: `${classroom.id}-ended`,
    completionRate: 100,
    endedAt: index === 0 ? "31/12/2025" : "30/09/2025",
    archiveStatus: index % 2 === 0 ? "ready" : "review",
  }));
}

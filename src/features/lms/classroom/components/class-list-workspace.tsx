import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import { AppSelect } from "@/components/erg-mui/app-select";
import { ErgEmptyState } from "@/components/erg-mui/erg-feedback";
import type { ClassroomSchool, ClassroomSnapshot } from "@/domain/school/classroom-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";

type ClassListMode = "active" | "ended";

type ClassListWorkspaceProps = {
  activeLeaf: DashboardLeaf;
  mode: ClassListMode;
  onOpenLeaf: (leafId: string) => void;
  schools: ClassroomSchool[];
  snapshots: ClassroomSnapshot[];
  selectedSchoolId: string;
};

type EndedClassRow = ClassroomSnapshot & {
  endedAt: string;
  archiveStatus: "ready" | "review";
};

type ClassRow = ClassroomSnapshot | EndedClassRow;

const PAGE_SIZE = 10;
const NUMERIC_COLUMNS = new Set(["studentCount", "averageScore"]);
const NO_ENDED_CLASSES: EndedClassRow[] = [];
const missingValue = <Box component="span" sx={{ color: "text.disabled" }}>—</Box>;

const tableSx = {
  "& .MuiTableCell-root": { borderColor: "divider", px: 2, py: 1.5 },
  "& .MuiTableCell-head": {
    bgcolor: "transparent",
    color: "text.secondary",
    textTransform: "none",
    typography: "caption",
  },
  "& .MuiTableRow-root:last-of-type .MuiTableCell-body": { borderBottom: 0 },
} as const;

export function ClassListWorkspace({
  activeLeaf,
  mode,
  onOpenLeaf,
  schools,
  snapshots,
  selectedSchoolId,
}: ClassListWorkspaceProps) {
  const [gradeFilter, setGradeFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0];
  const schoolClasses = useMemo(() => snapshots.filter((snapshot) => snapshot.schoolId === selectedSchoolId), [selectedSchoolId, snapshots]);
  const rows: ClassRow[] = mode === "active" ? schoolClasses : NO_ENDED_CLASSES;
  const gradeOptions = Array.from(new Set(rows.map((item) => item.gradeLabel)));
  const normalizedSearch = debouncedSearchValue.trim().toLowerCase();
  // Memoized so TanStack only resets the page index when the filtered rows really change.
  const filteredRows = useMemo(
    () =>
      rows.filter((item) => {
        const matchesGrade = gradeFilter === "all" || item.gradeLabel === gradeFilter;
        const matchesSearch =
          !normalizedSearch ||
          item.className.toLowerCase().includes(normalizedSearch) ||
          item.homeroomTeacher.toLowerCase().includes(normalizedSearch);

        return matchesGrade && matchesSearch;
      }),
    [gradeFilter, normalizedSearch, rows],
  );
  const columns = useMemo<Array<ColumnDef<ClassRow>>>(
    () => [
      {
        accessorKey: "className",
        cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h3" noWrap variant="subtitle2">{row.original.className}</Typography>
            <Typography sx={{ color: "text.secondary", mt: 0.5 }} variant="body2">
              {row.original.gradeLabel} · {row.original.schoolName}
            </Typography>
          </Box>
        ),
        header: "Lớp",
      },
      {
        accessorKey: "homeroomTeacher",
        cell: ({ row }) => row.original.homeroomTeacher || missingValue,
        header: "Giáo viên",
      },
      {
        accessorKey: "studentCount",
        cell: ({ row }) => row.original.metricsAvailable === false ? missingValue : row.original.studentCount.toLocaleString("vi-VN"),
        header: "Học sinh",
      },
      {
        accessorKey: "averageScore",
        cell: ({ row }) => row.original.metricsAvailable === false ? missingValue : row.original.averageScore,
        header: "Điểm TB",
      },
      {
        accessorKey: "completionRate",
        cell: ({ row }) => {
          const endedAt = "endedAt" in row.original ? row.original.endedAt : undefined;
          const archiveStatus = "archiveStatus" in row.original ? row.original.archiveStatus : undefined;

          if (mode !== "active") {
            return (
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  label={archiveStatus === "review" ? "Cần rà soát" : "Sẵn sàng"}
                  size="small"
                  color={archiveStatus === "review" ? "warning" : "success"}
                />
                <Typography component="span" sx={{ color: "text.secondary" }} variant="body2">{endedAt}</Typography>
              </Box>
            );
          }

          if (row.original.metricsAvailable === false) {
            return (
              <Box>
                {missingValue}
                <Typography sx={{ color: "text.secondary", display: "block", mt: 1 }} variant="caption">
                  Chưa có số liệu vận hành từ backend.
                </Typography>
              </Box>
            );
          }

          return (
            <Box>
              <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="subtitle2">{`${row.original.completionRate}%`}</Typography>
              <LinearProgress
                variant="determinate"
                value={row.original.completionRate}
                color={row.original.riskStudents >= 5 ? "warning" : "success"}
                sx={{ mt: 1, height: 8, borderRadius: 1 }}
              />
            </Box>
          );
        },
        header: mode === "active" ? "Tiến độ" : "Kết thúc",
      },
      {
        id: "actions",
        cell: () => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: { lg: "flex-end" } }}>
            <Button size="small" variant="text" onClick={() => onOpenLeaf("class-reports")}>
              Báo cáo
            </Button>
            <Button size="small" variant="outlined" onClick={() => onOpenLeaf("class-students")}>
              Học sinh
            </Button>
          </Box>
        ),
        enableSorting: false,
        header: "Thao tác",
      },
    ],
    [mode, onOpenLeaf],
  );
  const table = useReactTable({
    columns,
    data: filteredRows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    onSortingChange: setSorting,
    state: { sorting },
  });
  const activeDescription =
    "Theo dõi lớp đang dạy, giáo viên phụ trách, số học sinh và những lớp cần hỗ trợ trong hôm nay.";
  const endedDescription =
    "Lưu lại các lớp đã kết thúc để giáo viên và quản trị viên mở lại báo cáo khi cần đối chiếu.";
  const clearFilters = () => {
    setGradeFilter("all");
    setSearchValue("");
  };
  const cellAlign = (columnId: string) => (NUMERIC_COLUMNS.has(columnId) ? "right" : "left");

  return (
    <DashboardPageShell
      badge={mode === "active" ? "Lớp đang dạy" : "Lớp lưu trữ"}
      title={activeLeaf.title}
      description={mode === "active" ? activeDescription : endedDescription}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {mode === "active" ? (
            <>
              <Button disabled title="Backend chưa cung cấp class import contract." variant="outlined">Nhập từ Excel</Button>
              <Button disabled title="Backend chưa cung cấp class mutation contract." variant="contained">Thêm lớp học</Button>
            </>
          ) : (
            <Button disabled title="Backend chưa cung cấp archived-class report contract." variant="outlined">Xuất báo cáo</Button>
          )}
        </Box>
      }
    >
      <DashboardSectionCard
        title={mode === "active" ? "Danh sách lớp đang hoạt động" : "Danh sách lớp đã kết thúc"}
        description={`${selectedSchool?.name ?? "Phạm vi hiện tại"} · ${filteredRows.length} lớp hiển thị`}
        action={
          mode === "active" ? (
            <Button variant="outlined" onClick={() => onOpenLeaf("class-students")}>
              Xem học sinh
            </Button>
          ) : null
        }
      >
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { md: "minmax(0, 1fr) 180px 180px", xs: "1fr" } }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Tìm theo tên lớp hoặc giáo viên"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            slotProps={{
              htmlInput: { "aria-label": "Tìm lớp học" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <AppSelect
            aria-label="Lọc khối"
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
          <AppSelect aria-label="Năm học" defaultValue="2025-2026">
            <option value="2025-2026">Năm học 2025 - 2026</option>
            <option value="2024-2025">Năm học 2024 - 2025</option>
          </AppSelect>
        </Box>

        {filteredRows.length ? (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 2, overflow: "hidden" }}>
            <TableContainer>
              <Table sx={tableSx}>
                <TableHead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const label = flexRender(header.column.columnDef.header, header.getContext());
                        const sortDirection = header.column.getIsSorted();

                        return (
                          <TableCell
                            key={header.id}
                            align={cellAlign(header.column.id)}
                            sortDirection={sortDirection || false}
                          >
                            {header.column.getCanSort() ? (
                              <TableSortLabel
                                active={Boolean(sortDirection)}
                                direction={sortDirection || "asc"}
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {label}
                              </TableSortLabel>
                            ) : (
                              label
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          align={cellAlign(cell.column.id)}
                          sx={NUMERIC_COLUMNS.has(cell.column.id) ? { fontVariantNumeric: "tabular-nums" } : undefined}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredRows.length > PAGE_SIZE ? (
              <TablePagination
                component="div"
                count={filteredRows.length}
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} trên ${count} lớp`}
                onPageChange={(_, page) => table.setPageIndex(page)}
                page={table.getState().pagination.pageIndex}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[]}
                sx={{ borderTop: 1, borderColor: "divider" }}
              />
            ) : null}
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <ErgEmptyState
              title={mode === "active" ? "Chưa có lớp đang hoạt động" : "Chưa có contract lớp đã kết thúc"}
              description={mode === "active" ? "Thử đổi bộ lọc hoặc chọn trung tâm khác ở thanh Đang xem." : "Backend chưa cung cấp trạng thái lưu trữ và thời điểm kết thúc lớp."}
              action={<Button variant="outlined" onClick={clearFilters}>Xóa bộ lọc</Button>}
            />
          </Box>
        )}
      </DashboardSectionCard>
    </DashboardPageShell>
  );
}

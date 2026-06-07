import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LmsCheckbox, LmsSearchInput } from "@/components/ui/lms-kit";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { cn } from "@/lib/utils";

type DataTableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>;
  data: TData[];
  emptyLabel?: string;
  className?: string;
  filterPlaceholder?: string;
  getRowId?: (row: TData, index: number) => string;
  loading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  virtualized?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyLabel = "Không có dữ liệu.",
  className,
  filterPlaceholder = "Tìm kiếm",
  getRowId,
  loading = false,
  pageSize = 10,
  searchable = true,
  selectable = false,
  virtualized = false,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tableColumns = useMemo<Array<ColumnDef<TData, TValue>>>(() => {
    if (!selectable) return columns;

    return [
      ({
        id: "__select",
        enableHiding: false,
        enableResizing: false,
        enableSorting: false,
        header: ({ table }) => (
          <LmsCheckbox
            aria-label="Chọn tất cả"
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
        ),
        cell: ({ row }) => (
          <LmsCheckbox
            aria-label="Chọn dòng"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        ),
        size: 42,
      } as ColumnDef<TData, TValue>),
      ...columns,
    ];
  }, [columns, selectable]);

  const table = useReactTable({
    columns: tableColumns,
    data,
    enableColumnResizing: true,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnVisibility,
      globalFilter,
      rowSelection,
      sorting,
    },
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualList({
    count: rows.length,
    estimateSize: 44,
    overscan: 8,
    scrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();
  const virtualRows = virtualized
    ? measuredVirtualRows.length
      ? measuredVirtualRows
      : Array.from({ length: Math.min(rows.length, pageSize) }, (_, index) => ({
          end: (index + 1) * 44,
          index,
          start: index * 44,
        }))
    : [];
  const renderedRows = virtualized ? virtualRows.map((virtualRow) => rows[virtualRow.index]).filter(Boolean) : rows;
  const virtualTotalSize = Math.max(rowVirtualizer.getTotalSize(), rows.length * 44);
  const visibleColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());
  const selectedRowCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-[var(--muted)]/40 p-3">
        {searchable ? (
          <div className="min-w-56 flex-1">
            <LmsSearchInput
              aria-label={filterPlaceholder}
              className="h-9"
              placeholder={filterPlaceholder}
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
            />
          </div>
        ) : null}
        {visibleColumns.length ? (
          <details className="relative">
            <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Columns3 className="h-4 w-4" />
              Cột
            </summary>
            <div className="absolute right-0 z-20 mt-2 grid min-w-44 gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-md)]">
              {visibleColumns.map((column) => (
                <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm font-medium hover:bg-slate-50">
                  <LmsCheckbox
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  />
                  <span>{column.id}</span>
                </label>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div ref={scrollRef} className={cn("overflow-auto", virtualized && "max-h-[520px]")}>
        <Table style={{ width: table.getCenterTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      <div className="flex items-center justify-between gap-2">
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortDirection === "asc" ? <ArrowUpAZ data-icon="inline-end" /> : null}
                            {sortDirection === "desc" ? <ArrowDownAZ data-icon="inline-end" /> : null}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                        {header.column.getCanResize() ? (
                          <button
                            aria-label="Đổi cỡ cột"
                            className="h-6 w-1 cursor-col-resize rounded bg-slate-200 opacity-0 transition hover:opacity-100"
                            type="button"
                            onDoubleClick={() => header.column.resetSize()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                          />
                        ) : null}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualized && virtualRows[0]?.start ? (
              <TableRow aria-hidden="true">
                <TableCell colSpan={table.getVisibleLeafColumns().length} style={{ height: virtualRows[0].start }} />
              </TableRow>
            ) : null}
            {loading ? (
              Array.from({ length: Math.min(pageSize, 6) }, (_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`} aria-hidden="true">
                  {table.getVisibleLeafColumns().map((column, columnIndex) => (
                    <TableCell key={`${column.id}-${rowIndex}`} style={{ width: column.getSize() }}>
                      <Skeleton className={cn("h-4", columnIndex === 0 ? "w-2/3" : "w-full")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : renderedRows.length ? (
              renderedRows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {virtualized && virtualTotalSize - (virtualRows.at(-1)?.end ?? 0) > 0 ? (
              <TableRow aria-hidden="true">
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  style={{ height: virtualTotalSize - (virtualRows.at(-1)?.end ?? 0) }}
                />
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3 py-2 text-sm text-slate-600">
        <span>
          {table.getFilteredRowModel().rows.length} dòng
          {selectable ? `, ${selectedRowCount} ?? ch?n` : ""}
        </span>
        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous page"
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-20 text-center font-semibold">
            {table.getState().pagination.pageIndex + 1}/{table.getPageCount() || 1}
          </span>
          <Button
            aria-label="Next page"
            type="button"
            variant="outline"
            size="sm"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

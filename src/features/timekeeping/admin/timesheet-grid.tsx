import type { ReactNode } from "react";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

import { ErgDataTableShell, ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { TimesheetRow } from "../api/timekeeping-types";
import { codeMeta } from "../model/day-codes";

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const NAME_WIDTH = 200;
const DAY_WIDTH = 36;
const TOTAL_WIDTH = 64;
const TOTALS: Array<{ id: keyof TimesheetRow; header: string }> = [
  { id: "work", header: "Công" },
  { id: "late", header: "Muộn" },
  { id: "leave", header: "Phép" },
  { id: "kpKc", header: "KP/KC" },
  { id: "periods", header: "Tiết dạy" },
  { id: "deductMinutes", header: "Phút trừ" },
];

const codeOf = (row: TimesheetRow, day: number) => row.days?.find((cell) => cell.d === day)?.code ?? "";

/** Weekend or holiday column: a Saturday/Sunday, or a day on which nobody has anything but "L"/"". */
export function offColumns(period: string, rows: readonly TimesheetRow[]): Set<number> {
  const [year, month] = period.split("-").map(Number);
  const length = new Date(year, month, 0).getDate();
  const off = new Set<number>();
  for (let day = 1; day <= length; day += 1) {
    const weekday = new Date(year, month - 1, day).getDay();
    const holiday = rows.length > 0 && rows.some((row) => codeOf(row, day) === "L") && rows.every((row) => ["", "L"].includes(codeOf(row, day)));
    if (weekday === 0 || weekday === 6 || holiday) off.add(day);
  }
  return off;
}

const stickyName = { bgcolor: "background.paper", borderRight: `1px solid ${t.color.border}`, left: 0, maxWidth: NAME_WIDTH, minWidth: NAME_WIDTH, position: "sticky", width: NAME_WIDTH } as const;
const compact = { p: "6px 0", textAlign: "center" } as const;

type TimesheetGridProps = { period: string; rows: readonly TimesheetRow[]; footer?: ReactNode };

/** A02 grid: name pinned left, fixed-width day columns, symbol + tone per cell (tone is never the only signal), totals on the right. */
export function TimesheetGrid({ footer, period, rows }: TimesheetGridProps) {
  const [year, month] = period.split("-").map(Number);
  const length = new Date(year, month, 0).getDate();
  const off = offColumns(period, rows);
  const columns: ColumnDef<TimesheetRow>[] = [
    { id: "name", header: "Nhân sự", cell: ({ row }) => row.original.name },
    ...Array.from({ length }, (_, i): ColumnDef<TimesheetRow> => ({
      id: `d${i + 1}`,
      header: String(i + 1),
      cell: ({ row }) => codeOf(row.original, i + 1),
    })),
    ...TOTALS.map(({ header, id }): ColumnDef<TimesheetRow> => ({ id, header, cell: ({ row }) => String(row.original[id] ?? 0) })),
  ];
  const table = useReactTable({ columns, data: rows as TimesheetRow[], getCoreRowModel: getCoreRowModel() });
  const dayOf = (id: string) => (/^d\d+$/.test(id) ? Number(id.slice(1)) : 0);

  return (
    <ErgDataTableShell footer={footer} scrollLabel="Bảng công tháng, cuộn ngang bằng phím mũi tên" sx={{ "& .MuiTableContainer-root": { maxHeight: "calc(100vh - 360px)", minHeight: 320 } }}>
      <ErgTable aria-label={`Bảng công tháng ${period}`} sx={{ tableLayout: "fixed", width: NAME_WIDTH + length * DAY_WIDTH + TOTALS.length * TOTAL_WIDTH }}>
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const day = dayOf(header.column.id);
                return (
                  <TableCell
                    key={header.id}
                    sx={day ? { ...compact, bgcolor: off.has(day) ? t.color.divider : undefined, width: DAY_WIDTH } : header.column.id === "name" ? { ...stickyName, zIndex: 4 } : { ...compact, width: TOTAL_WIDTH }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {day ? <><br />{WEEKDAY[new Date(year, month - 1, day).getDay()]}</> : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow hover key={row.id}>
              {row.getVisibleCells().map((cell) => {
                const day = dayOf(cell.column.id);
                if (!day) return <TableCell component={cell.column.id === "name" ? "th" : undefined} key={cell.id} scope={cell.column.id === "name" ? "row" : undefined} sx={cell.column.id === "name" ? { ...stickyName, zIndex: 1 } : { ...compact, fontVariantNumeric: "tabular-nums" }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>;
                const meta = codeMeta(codeOf(row.original, day));
                const tint = meta ? t.statusTint[meta.tone] : null;
                return (
                  <TableCell key={cell.id} sx={{ ...compact, bgcolor: tint ? tint.bg : off.has(day) ? t.color.surfaceSubtle : undefined, color: tint?.color }}>
                    {meta ? <span aria-label={`Ngày ${day}: ${meta.label}`} role="img" title={meta.label}>{codeOf(row.original, day)}</span> : null}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "@mui/material/Link";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ErgDataTableShell, ErgTable } from "@/components/erg-mui";
import { formatDateTimeVi } from "@/domain/formatters/format-date";

import type { CampaignResponse } from "../api/campaign-types";
import { formatCountVi } from "../model/campaign-form-schema";
import { audienceScopeLabel, viewedPercent } from "./sent-campaign-list";

const column = createColumnHelper<CampaignResponse>();
const meta = (text: string) => <Typography variant="caption" component="span" sx={{ display: "block", color: "text.secondary" }}>{text}</Typography>;

const columns = [
  column.accessor("title", {
    header: "Tiêu đề",
    // A real button so the row opens from the keyboard; its click bubbles to the row handler.
    cell: (info) => <Link component="button" type="button" variant="body2" underline="hover" sx={{ textAlign: "left", fontWeight: "fontWeightMedium" }}>{info.getValue() || "(Chưa có tiêu đề)"}</Link>,
  }),
  column.display({
    id: "audience",
    header: "Gửi đến",
    cell: ({ row }) => (
      <>
        {audienceScopeLabel(row.original.audience)}
        {meta(`${formatCountVi(row.original.recipientCount ?? 0)} người`)}
      </>
    ),
  }),
  column.display({ id: "channel", header: "Kênh", cell: ({ row }) => (row.original.pushEnabled ? "Web push + hộp thư" : "Hộp thư") }),
  column.display({ id: "time", header: "Thời gian", cell: ({ row }) => formatDateTimeVi(row.original.sentAt ?? row.original.updatedAt) }),
  column.display({
    id: "viewed",
    header: "Đã xem",
    cell: ({ row }) => (
      <>
        {`${viewedPercent(row.original)}%`}
        {meta(`${formatCountVi(row.original.viewedCount ?? 0)}/${formatCountVi(row.original.recipientCount ?? 0)}`)}
      </>
    ),
  }),
  column.display({
    id: "ack",
    header: "Xác nhận",
    cell: ({ row }) => (row.original.requireReadAck ? `${formatCountVi(row.original.ackedCount ?? 0)}/${formatCountVi(row.original.recipientCount ?? 0)}` : "—"),
  }),
];

/** W1 Đã gửi table (md and up); a row opens the campaign detail. */
type Props = { campaigns: readonly CampaignResponse[]; onOpen: (id: string) => void; toolbar?: ReactNode; footer?: ReactNode };

export function SentCampaignTable({ campaigns, onOpen, toolbar, footer }: Props) {
  const table = useReactTable({ data: campaigns as CampaignResponse[], columns, getCoreRowModel: getCoreRowModel(), getRowId: (row, index) => row.id ?? String(index) });

  return (
    <ErgDataTableShell toolbar={toolbar} footer={footer}>
      <ErgTable aria-label="Thông báo đã gửi">
        <TableHead>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => <TableCell key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableCell>)}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} hover onClick={() => row.original.id && onOpen(row.original.id)} sx={{ cursor: "pointer" }}>
              {row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}

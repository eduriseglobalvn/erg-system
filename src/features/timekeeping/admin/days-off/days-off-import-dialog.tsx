import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { formatDateVi } from "@/domain/formatters/format-date";
import { useHolidayImportPreview, useImportHolidays } from "../../api/timekeeping-config-query";
import type { HolidayImportPreviewRow } from "../../api/timekeeping-types";
import { requestErrorText } from "../../components/requests/request-model";
import { AffectedNotice } from "./days-off-fields";
import { DaysOffPastWarningDialog, usePastConfirm } from "./days-off-past-warning-dialog";
import { kindLabel, weekdayDayMonth } from "./days-off-model";

const STATUS: Record<string, { label: string; tone: "info" | "neutral" | "warning" }> = {
  NEW: { label: "Mới", tone: "info" },
  EXISTS: { label: "Đã có", tone: "neutral" },
  VERIFY: { label: "Cần đối chiếu", tone: "warning" },
};

/** Which preview rows are ticked: «Đã có» always, «Mới» unless unticked, «Cần đối chiếu» only when ticked by hand. */
export function isRowChecked(row: HolidayImportPreviewRow, override: Readonly<Record<string, boolean>>): boolean {
  if (row.status === "EXISTS") return true;
  return override[row.date ?? ""] ?? row.status === "NEW";
}

/** Rows that will be sent: ticked and not already there. */
export const rowsToImport = (rows: readonly HolidayImportPreviewRow[], override: Readonly<Record<string, boolean>>) =>
  rows.filter((row) => row.status !== "EXISTS" && isRowChecked(row, override));

export function sourceLine(source: string | undefined, savedOn: string | undefined, fileName?: string): string {
  if (source === "UPLOAD") return `Nguồn: tệp ${fileName ?? ".ics"}.`;
  if (source === "SAVED") return `Nguồn: lịch «Ngày lễ ở Việt Nam» của Google, bản lưu ngày ${formatDateVi(savedOn)}.`;
  return "Chưa có bản lưu cho năm này. Chọn tệp .ics để nhập.";
}

type Props = { year: number; onClose: () => void };

/** AdminDaysOffImport: preview of the yearly state-holiday calendar (saved copy or an uploaded .ics), tick, import. */
export function DaysOffImportDialog({ onClose, year }: Props) {
  const [file, setFile] = useState<File | undefined>();
  const [override, setOverride] = useState<Record<string, boolean>>({});
  const input = useRef<HTMLInputElement>(null);
  const preview = useHolidayImportPreview(year, file, true);
  const importer = useImportHolidays();
  const past = usePastConfirm();
  const rows = preview.data?.rows ?? [];
  const selectable = rows.filter((row) => row.status !== "EXISTS");
  const chosen = rowsToImport(rows, override);
  const allChecked = selectable.length > 0 && chosen.length === selectable.length;

  const send = (confirmPast?: boolean) => importer.mutate(
    { rows: chosen.map((row) => ({ date: row.date, name: row.name, kind: row.kind })), ...(confirmPast ? { confirmPast: true } : {}) },
    {
      onError: (error) => { past.handle(error, () => send(true)); },
      onSuccess: (result) => { toast.success(`Đã nhập ${result.imported ?? 0} ngày${result.skipped ? `, bỏ qua ${result.skipped}` : ""}`); onClose(); },
    },
  );
  const toggleAll = (checked: boolean) => setOverride(Object.fromEntries(selectable.map((row) => [row.date ?? "", checked])));

  return (
    <>
      <ErgDialog
        actions={
          <>
            <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
            <ErgButton disabled={chosen.length === 0} loading={importer.isPending} onClick={() => send()} variant="outlined">{`Nhập ${chosen.length} ngày`}</ErgButton>
          </>
        }
        onClose={onClose}
        open
        sx={{ "& .MuiDialog-paper": { maxWidth: 760 } }}
        title={`Nhập lịch nghỉ lễ năm ${year}`}
      >
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <Typography color="text.secondary" variant="body2">
            {sourceLine(preview.data?.source, preview.data?.savedOn, file?.name)}{" "}
            <Link component="button" onClick={() => input.current?.click()} type="button" underline="hover" variant="body2">Dùng tệp .ics khác</Link>
          </Typography>
          <input accept=".ics,text/calendar" aria-label="Chọn tệp .ics" hidden onChange={(event) => { setFile(event.target.files?.[0]); setOverride({}); event.target.value = ""; }} ref={input} type="file" />
          <AffectedNotice>Lịch nghỉ Tết và ngày nghỉ bù do Chính phủ công bố từng năm. Đối chiếu với thông báo chính thức trước khi nhập.</AffectedNotice>
          {preview.isPending ? <ErgSkeleton height={200} /> : preview.isError ? (
            <ErgErrorState action={<ErgButton onClick={() => void preview.refetch()} variant="outlined">Thử lại</ErgButton>} description={requestErrorText(preview.error)} title="Không đọc được lịch nghỉ lễ." />
          ) : (
            <Box sx={{ maxHeight: 360, overflow: "auto" }}>
              <ErgTable size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"><Checkbox checked={allChecked} disabled={selectable.length === 0} indeterminate={chosen.length > 0 && !allChecked} onChange={(event) => toggleAll(event.target.checked)} slotProps={{ input: { "aria-label": "Chọn tất cả" } }} size="small" /></TableCell>
                    <TableCell>Ngày</TableCell>
                    <TableCell>Âm lịch</TableCell>
                    <TableCell>Tên</TableCell>
                    <TableCell>Loại</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const status = STATUS[row.status ?? "NEW"] ?? STATUS.NEW;
                    return (
                      <TableRow hover key={row.date}>
                        <TableCell padding="checkbox"><Checkbox checked={isRowChecked(row, override)} disabled={row.status === "EXISTS"} onChange={(event) => setOverride({ ...override, [row.date ?? ""]: event.target.checked })} slotProps={{ input: { "aria-label": `Chọn ${weekdayDayMonth(row.date ?? "")} ${row.name ?? ""}` } }} size="small" /></TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{weekdayDayMonth(row.date ?? "")}</TableCell>
                        <TableCell>{row.lunarDate ?? ""}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{kindLabel(row.kind)}</TableCell>
                        <TableCell><ErgStatusChip dot={false} label={status.label} tone={status.tone} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </ErgTable>
            </Box>
          )}
          <Typography color="text.secondary" variant="caption">Ngày đã có không nhập lại. Không liệt kê ngày kỷ niệm (Giáng sinh, Phục sinh…). Ngày nhập vào tính là ngày nghỉ lễ: có lương (L, 1 công), tiết dạy «Huỷ tiết». Sửa từng ngày sau khi nhập.</Typography>
          {importer.isError && !past.warning ? <Typography color="error" role="alert" variant="body2">{requestErrorText(importer.error)}</Typography> : null}
        </Box>
      </ErgDialog>
      {past.warning ? <DaysOffPastWarningDialog loading={importer.isPending} onCancel={past.close} warning={past.warning} /> : null}
    </>
  );
}

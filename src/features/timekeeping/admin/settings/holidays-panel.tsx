import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateVi } from "@/domain/formatters/format-date";
import { useDeleteHoliday, useHolidays } from "../../api/timekeeping-config-query";
import type { HolidayConfig } from "../../api/timekeeping-types";
import { DeleteConfirm } from "./delete-confirm";
import { HolidayDialog } from "./holiday-dialog";

type HolidaysPanelProps = { schoolId: string; schoolName: string };

/** Holidays by year; days listed here count as paid non-working days in the timesheet. */
export function HolidaysPanel({ schoolId, schoolName }: HolidaysPanelProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const holidays = useHolidays(schoolId, year);
  const remove = useDeleteHoliday();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<HolidayConfig | null>(null);
  const items = [...(holidays.data ?? [])].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between" }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <ErgIconButton label="Năm trước" onClick={() => setYear(year - 1)}><ChevronLeftIcon /></ErgIconButton>
          <Typography component="span" sx={{ minWidth: 72, textAlign: "center" }} variant="subtitle2">{`Năm ${year}`}</Typography>
          <ErgIconButton label="Năm sau" onClick={() => setYear(year + 1)}><ChevronRightIcon /></ErgIconButton>
        </Box>
        <ErgButton onClick={() => setAdding(true)} startIcon={<AddIcon />} variant="outlined">Thêm ngày lễ</ErgButton>
      </Box>
      {holidays.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void holidays.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được danh sách ngày lễ." title="Có lỗi xảy ra" />
      ) : holidays.isPending ? (
        <ErgSkeleton height={160} />
      ) : items.length === 0 ? (
        <ErgEmptyState description="Chưa có ngày lễ nào trong năm này." title="Chưa có ngày lễ" />
      ) : (
        <Box component="ul" sx={{ border: 1, borderColor: "divider", borderRadius: 2, listStyle: "none", m: 0, p: 0 }}>
          {items.map((holiday) => (
            <Box component="li" key={holiday.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", gap: 1.5, justifyContent: "space-between", p: 2, "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5, minWidth: 0 }}>
                <Typography sx={{ minWidth: 96 }} variant="subtitle2">{formatDateVi(holiday.date)}</Typography>
                <Typography variant="body2">{holiday.name}</Typography>
                <ErgStatusChip dot={false} label={holiday.schoolId ? "Riêng cơ sở" : "Toàn hệ thống"} />
              </Box>
              <ErgButton aria-label={`Xoá ${holiday.name}`} color="error" onClick={() => setDeleting(holiday)} variant="text">Xoá</ErgButton>
            </Box>
          ))}
        </Box>
      )}
      {adding ? <HolidayDialog onClose={() => setAdding(false)} schoolId={schoolId} schoolName={schoolName} year={year} /> : null}
      {deleting?.id ? (
        <DeleteConfirm description="Ngày này sẽ được tính là ngày làm việc bình thường." id={deleting.id} mutation={remove} onClose={() => { remove.reset(); setDeleting(null); }} title={`Xoá ngày lễ ${deleting.name}?`} />
      ) : null}
    </Box>
  );
}

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgErrorState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { useDeleteShift, useShifts } from "../../api/timekeeping-config-query";
import type { ShiftConfig } from "../../api/timekeeping-types";
import { hhmm } from "../../components/punch/punch-format";
import { DeleteConfirm } from "./delete-confirm";
import { ShiftDialog } from "./shift-dialog";
import { WEEKDAYS } from "./shift-model";

type Editing = { shift?: ShiftConfig } | null;

/** Shifts of a school: one shift per weekday, no overlap (the server answers 409 otherwise). */
export function ShiftsPanel({ schoolId }: { schoolId: string }) {
  const shifts = useShifts(schoolId);
  const remove = useDeleteShift();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<ShiftConfig | null>(null);
  const items = [...(shifts.data ?? [])].sort((a, b) => (a.weekdays?.[0] ?? 8) - (b.weekdays?.[0] ?? 8) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const add = (
    <ErgButton onClick={() => setEditing({})} startIcon={<AddIcon />} variant="outlined">Thêm ca</ErgButton>
  );

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{add}</Box>
      {shifts.isError ? (
        <ErgErrorState action={<ErgButton onClick={() => void shifts.refetch()} variant="outlined">Tải lại</ErgButton>} description="Không tải được danh sách ca." title="Có lỗi xảy ra" />
      ) : shifts.isPending ? (
        <ErgSkeleton height={160} />
      ) : items.length === 0 ? (
        <ErgEmptyState description="Thêm ca để nhân sự có giờ vào, giờ ra và số công mỗi ngày." title="Chưa có ca làm việc" />
      ) : (
        <Box component="ul" sx={{ border: 1, borderColor: "divider", borderRadius: 2, listStyle: "none", m: 0, p: 0 }}>
          {items.map((shift) => (
            <Box component="li" key={shift.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between", p: 2, "&:last-child": { borderBottom: 0 } }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">{shift.name}</Typography>
                <Typography color="text.secondary" variant="body2">{`${hhmm(shift.startTime)} – ${hhmm(shift.endTime)} · ${shift.workUnits === 0.5 ? "0,5" : "1"} công`}</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                  {WEEKDAYS.filter((d) => shift.weekdays?.includes(d.value)).map((d) => <ErgStatusChip dot={false} key={d.value} label={d.label} />)}
                  {shift.active === false ? <ErgStatusChip dot={false} label="Đã tắt" tone="warning" /> : null}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <ErgButton aria-label={`Sửa ${shift.name}`} onClick={() => setEditing({ shift })} variant="text">Sửa</ErgButton>
                <ErgButton aria-label={`Xoá ${shift.name}`} color="error" onClick={() => setDeleting(shift)} variant="text">Xoá</ErgButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {editing ? <ShiftDialog onClose={() => setEditing(null)} schoolId={schoolId} shift={editing.shift} /> : null}
      {deleting?.id ? (
        <DeleteConfirm description="Ca sẽ ngừng áp dụng từ hôm nay; công các ngày đã qua không đổi." id={deleting.id} mutation={remove} onClose={() => { remove.reset(); setDeleting(null); }} title={`Xoá ${deleting.name}?`} />
      ) : null}
    </Box>
  );
}

import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Popover from "@mui/material/Popover";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { loadTeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { dayLabel, weekdayName, type PeriodSlotLike } from "@/features/teaching-calendar/domain/schedule-copy";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { newClientRowId, withTeacher, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { ClassCombobox } from "../pickers/class-combobox";
import { RoomPick } from "../pickers/room-pick";
import { TeacherPick } from "../pickers/teacher-pick";

type View = "form" | "room" | "teacher" | "assistant";

type Props = {
  anchorEl: HTMLElement | null;
  batchId?: string;
  date: string;
  /** Mo thang picker (Doi giao vien tu Main). */
  initialView?: "teacher";
  onChange: (row: GridRow | null) => void;
  onClose: () => void;
  row?: GridRow;
  schoolId: string;
  slot: PeriodSlotLike;
  weekday: number;
};

export function FieldButton({ label, onClick, value, disabled, muted }: { disabled?: boolean; label: string; muted?: boolean; onClick: () => void; value: string }) {
  return (
    <Box sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: "72px 1fr" }}>
      <Typography sx={{ color: ergEnterpriseTokens.color.textSecondary, ...ergEnterpriseTokens.type.note }}>{label}</Typography>
      <ButtonBase
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: muted ? "text.secondary" : "text.primary", height: 34, justifyContent: "space-between", opacity: disabled ? 0.5 : 1, px: 1.25, textAlign: "left", typography: "body2", width: "100%" }}
      >
        {value}<span aria-hidden>▾</span>
      </ButtonBase>
    </Box>
  );
}

/** Popover o (6.2): Lop, Phong hoc, Giao vien, Tro giang. Chon la ap ngay vao luoi (tu luu sau 1,5 s). */
export function CellEditorPopover({ anchorEl, batchId, date, initialView, onChange, onClose, row, schoolId, slot, weekday }: Props) {
  // `initialView` chi la man mo dau; khi nguoi dung doi man thi `picked` thang the.
  const [picked, setPicked] = useState<View | null>(null);
  const view: View = picked ?? initialView ?? "form";
  const setView = (next: View) => setPicked(next);
  const options = useQuery({
    enabled: Boolean(anchorEl && schoolId),
    queryFn: ({ signal }) => loadTeachingSlotOptions({ batchId, classId: row?.classId, date, excludeEventId: row?.eventId, periodNo: slot.periodNo, schoolId }, signal),
    queryKey: teachingCalendarQueryKeys.slotOptions(getDefaultTenantId(), { batchId, classId: row?.classId, date, excludeEventId: row?.eventId, periodNo: slot.periodNo, schoolId }),
    staleTime: 15_000,
  });
  const data = options.data;
  const className = row?.className ?? "";
  const base = (): GridRow => row ?? { classId: "", className: "", clientRowId: newClientRowId(), periodNo: slot.periodNo, weekday };
  const teacherState = data?.teachers.find((teacher) => teacher.teacherId === row?.teacherId)?.state;

  const close = () => { setPicked(null); onClose(); };
  const apply = (next: GridRow) => { onChange(next); setView("form"); };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={close}
      open={Boolean(anchorEl)}
      slotProps={{ paper: { sx: { borderRadius: `${ergEnterpriseTokens.radius.card}px`, boxShadow: ergEnterpriseTokens.shadow.float, width: view === "form" ? 308 : 440 } } }}
    >
      <Box sx={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", px: view === "form" ? 1.75 : 1.5, pb: view === "form" ? 0 : 1, pt: 1.75 }}>
        <Typography component="strong" sx={{ typography: "subtitle2" }}>{dayLabel(date)} · Tiết {slot.periodNo}</Typography>
        {slot.startTime && slot.endTime ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>{slot.startTime}–{slot.endTime}</Typography> : null}
      </Box>
      {options.isPending ? <Stack spacing={1} sx={{ p: 1.5 }}><Skeleton height={40} /><Skeleton height={40} /></Stack> : null}
      {options.isError ? <Typography color="error" sx={{ p: 1.5, typography: "body2" }}>{(options.error as { status?: number } | null)?.status === 401 ? "Phiên đăng nhập đã hết hạn. Nháp đã được lưu, hãy đăng nhập lại để xếp tiếp." : "Không tải được gợi ý cho ô này."}</Typography> : null}
      {data && view === "form" ? (
        <Stack spacing={1} sx={{ p: 1.75 }}>
          <ClassCombobox
            batchId={batchId}
            classes={data.classes}
            grade={data.grade}
            onChange={(option) => option && apply({ ...base(), classId: option.classId, className: option.className })}
            periodNo={slot.periodNo}
            schoolName={data.schoolName}
            value={row?.classId}
            weekdayName={weekdayName(weekday)}
          />
          <FieldButton disabled={!row} label="Phòng học" muted={!row?.roomName && !row?.newRoomName} onClick={() => setView("room")} value={row?.roomName ?? row?.newRoomName ?? "chọn hoặc gõ"} />
          <FieldButton disabled={!row} label="Giáo viên" muted={!row?.teacherName} onClick={() => setView("teacher")} value={row?.teacherName ? `${row.teacherName}${teacherState === "FREE" || teacherState === "SUGGESTED" ? " · trống" : ""}` : "Chọn giáo viên"} />
          <FieldButton disabled={!row} label="Trợ giảng" muted={!row?.assistantName} onClick={() => setView("assistant")} value={row?.assistantName ?? "Không có"} />
        </Stack>
      ) : null}
      {data && view === "room" && row ? (
        <RoomPick className={className} onClose={() => setView("form")} onSelect={(room) => apply({ ...row, newRoomName: room.isNew ? room.name : undefined, roomId: room.id, roomName: room.isNew ? undefined : room.name })} rooms={data.rooms} schoolName={data.schoolName} value={row.roomName ?? row.newRoomName} />
      ) : null}
      {data && (view === "teacher" || view === "assistant") && row ? (
        <TeacherPick
          className={className}
          mainTeacher={{ id: row.teacherId, name: row.teacherName }}
          mode={view}
          onClose={() => setView("form")}
          onSelect={(teacher) => {
            if (view === "assistant") return apply({ ...row, assistantId: teacher?.id, assistantName: teacher?.name });
            const result = withTeacher(row, { id: teacher?.id, name: teacher?.name });
            if (result.removedAssistant) toast.info("Đã bỏ trợ giảng vì trùng giáo viên chính");
            return apply(result.row);
          }}
          selectedId={view === "assistant" ? row.assistantId : row.teacherId}
          teachers={data.teachers}
        />
      ) : null}
    </Popover>
  );
}

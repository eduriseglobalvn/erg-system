import { useState } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { loadTeachingPeriodTemplates } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { dayLabel, sourceLabel, weekdayIndex, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { newClientRowId, withTeacher, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";
import { ClassCombobox } from "../pickers/class-combobox";
import { RoomPick } from "../pickers/room-pick";
import { TeacherPick } from "../pickers/teacher-pick";
import { FieldButton } from "../schedule-grid/cell-editor-popover";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { useAdminMobileAdd } from "./use-admin-mobile-add";

type View = "form" | "teacher" | "assistant" | "room";
type Row = GridRow;

type Props = { date: string; events: readonly TeachingCalendarEvent[]; onClose: () => void; open: boolean; schoolId: string; schoolName: string };

/** Chu phu cua chip tiet (6.9): «trống» / «—» (khong gio) / gio bat dau (dang chon) / «đã xếp» (lop da co tiet). */
export function periodChipHint(slot: { periodNo: number; startTime?: string | null }, selected: boolean, taken: boolean): string {
  if (!slot.startTime) return "—";
  if (selected) return slot.startTime;
  return taken ? "đã xếp" : "trống";
}

/** Bottom sheet «Thêm tiết» (6.9): chon tiet, lop, giao vien, phong, tro giang roi them vao dot nhap. Chi mount khi mo nen state tu reset khi dong. */
export function AdminMobileSheet(props: Props) {
  return props.open ? <AdminMobileSheetBody {...props} /> : null;
}

function AdminMobileSheetBody({ date, events, onClose, open, schoolId, schoolName }: Props) {
  const tenantId = getDefaultTenantId();
  const [view, setView] = useState<View>("form");
  const [periodNo, setPeriodNo] = useState(1);
  const [row, setRow] = useState<Row | null>(null);
  const add = useAdminMobileAdd(onClose);

  const templates = useQuery({ enabled: open, queryFn: ({ signal }) => loadTeachingPeriodTemplates(signal), queryKey: teachingCalendarQueryKeys.periodTemplates(tenantId), staleTime: 5 * 60_000 });
  const template = templates.data?.[0];
  const slot = template?.slots.find((item) => item.periodNo === periodNo);
  const input = { classId: row?.classId, date, periodNo, schoolId };
  const options = useQuery({
    enabled: open && Boolean(schoolId) && Boolean(slot?.startTime),
    queryFn: ({ signal }) => loadTeachingSlotOptions(input, signal),
    queryKey: teachingCalendarQueryKeys.slotOptions(tenantId, input),
    staleTime: 15_000,
  });
  const data = options.data;
  const weekday = weekdayIndex(date);
  const takenPeriods = new Set(events.filter((event) => event.date === date && event.classId === row?.classId).map((event) => event.periodStart));
  const program = events.find((event) => event.schoolId === schoolId)?.levelName ?? events.find((event) => event.schoolId === schoolId)?.subjectName;
  const apply = (next: Row) => { setRow(next); setView("form"); };
  const draftRow = (): Row => row ?? { classId: "", className: "", clientRowId: newClientRowId(), periodNo, weekday };
  const teacherOption = data?.teachers.find((teacher) => teacher.teacherId === row?.teacherId);
  const busy = teacherOption && (teacherOption.state === "BUSY" || teacherOption.state === "TRAVEL") ? teacherOption : undefined;
  const swap = busy ? data?.teachers.find((teacher) => teacher.state === "FREE" || teacher.state === "SUGGESTED") : undefined;
  const periodTemplateId = template?.id ?? "";
  const sunday = weekday === 0;
  const canAdd = !sunday && Boolean(row?.classId && row.teacherId && slot?.startTime && periodTemplateId);

  return (
    <MobileBottomSheet description={[schoolName, program].filter(Boolean).join(" · ")} onOpenChange={(next) => !next && onClose()} open={open} title={`Thêm tiết · ${dayLabel(date)}`}>
      {view === "form" ? (
        <Stack spacing={1.5}>
          <Box role="radiogroup" sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            {(template?.slots ?? []).map((item) => (
              <ButtonBase
                aria-checked={item.periodNo === periodNo} disabled={!item.startTime} key={item.periodNo} onClick={() => { setPeriodNo(item.periodNo); setRow((current) => (current ? { ...current, periodNo: item.periodNo } : current)); }} role="radio"
                sx={{ bgcolor: item.periodNo === periodNo ? "primary.main" : "background.paper", border: 1, borderColor: "divider", borderRadius: "10px", color: item.periodNo === periodNo ? "primary.contrastText" : "text.primary", flexDirection: "column", minWidth: 0, opacity: item.startTime ? 1 : 0.5, px: 1, py: 0.75 }}
              >
                <Typography sx={{ typography: "subtitle2" }}>{item.periodNo}</Typography>
                <Typography sx={{ typography: "caption" }}>{periodChipHint(item, item.periodNo === periodNo, takenPeriods.has(item.periodNo))}</Typography>
              </ButtonBase>
            ))}
          </Box>
          {data ? (
            <ClassCombobox
              classes={data.classes} grade={data.grade} onChange={(option) => option && apply({ ...draftRow(), classId: option.classId, className: option.className, periodNo })}
              periodNo={periodNo} schoolName={data.schoolName} value={row?.classId} weekdayName={weekdayName(weekday)}
            />
          ) : null}
          <FieldButton disabled={!row} label="Giáo viên" muted={!row?.teacherName} onClick={() => setView("teacher")} value={row?.teacherName ?? "Chọn giáo viên"} />
          <FieldButton disabled={!row} label="Phòng học" muted={!row?.roomName && !row?.newRoomName} onClick={() => setView("room")} value={row?.roomName ?? row?.newRoomName ?? "PM 03 · chọn hoặc gõ"} />
          <FieldButton disabled={!row} label="Trợ giảng" muted={!row?.assistantName} onClick={() => setView("assistant")} value={row?.assistantName ?? "Không có"} />
          {busy ? (
            <Box role="alert" sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: "10px", color: scheduleTokens.clash.text, p: 1.5 }}>
              <Typography sx={{ typography: "subtitle2" }}>{busy.state === "TRAVEL" ? "Không kịp di chuyển" : "Trùng giáo viên"} · Tiết {periodNo}{slot?.startTime ? `, ${slot.startTime}–${slot.endTime}` : ""}</Typography>
              {busy.busy ? <Typography sx={{ typography: "caption" }}>{busy.teacherName} đang dạy {[busy.busy.className, busy.busy.roomName, busy.busy.schoolName].filter(Boolean).join(" · ")}</Typography> : null}
              {busy.busy ? <Typography sx={{ typography: "caption" }}>{sourceLabel(busy.busy)}</Typography> : null}
              {swap ? <Link component="button" onClick={() => row && apply(withTeacher(row, { id: swap.teacherId, name: swap.teacherName }).row)} sx={{ typography: "caption" }} type="button" underline="hover">Đổi sang {swap.teacherName} (trống tiết {periodNo}) →</Link> : null}
            </Box>
          ) : null}
          {row?.className ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>Khi xuất bản: cấp quyền lớp {row.className} cho giáo viên được chọn.</Typography> : null}
          {sunday ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>Chủ nhật không có trong lưới xếp lịch. Chọn ngày từ Thứ 2 đến Thứ 7.</Typography> : null}
          {add.isError ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>Chưa lưu được · Thử lại</Typography> : null}
          <ErgButton disabled={!canAdd} fullWidth loading={add.isPending} onClick={() => row && add.mutate({ date, periodTemplateId, row, schoolId })} variant="contained">Thêm vào nháp</ErgButton>
        </Stack>
      ) : null}
      {data && view === "room" && row ? (
        <RoomPick className={row.className} onClose={() => setView("form")} onSelect={(room) => apply({ ...row, newRoomName: room.isNew ? room.name : undefined, roomId: room.id, roomName: room.isNew ? undefined : room.name })} rooms={data.rooms} schoolName={data.schoolName} value={row.roomName ?? row.newRoomName} />
      ) : null}
      {data && (view === "teacher" || view === "assistant") && row ? (
        <TeacherPick
          className={row.className} mainTeacher={{ id: row.teacherId, name: row.teacherName }} mode={view} onClose={() => setView("form")}
          onSelect={(teacher) => {
            if (view === "assistant") return apply({ ...row, assistantId: teacher?.id, assistantName: teacher?.name });
            const result = withTeacher(row, { id: teacher?.id, name: teacher?.name });
            if (result.removedAssistant) toast.info("Đã bỏ trợ giảng vì trùng giáo viên chính");
            return apply(result.row);
          }}
          selectedId={view === "assistant" ? row.assistantId : row.teacherId} teachers={data.teachers}
        />
      ) : null}
    </MobileBottomSheet>
  );
}

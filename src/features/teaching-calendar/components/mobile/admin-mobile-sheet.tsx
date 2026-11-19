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
import { ErgSelect } from "@/components/erg-mui/erg-form";
import type { TeachingCalendarCatalog, TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { dayLabel, sourceLabel, weekdayIndex, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { newClientRowId, withTeacher, type GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { MobileBottomSheet } from "@/features/lms/mobile/components/mobile-bottom-sheet";
import { ClassCombobox } from "../pickers/class-combobox";
import { RoomPick } from "../pickers/room-pick";
import { TeacherPick } from "../pickers/teacher-pick";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { useAdminMobileAdd } from "./use-admin-mobile-add";

const color = ergEnterpriseTokens.color;

/** Truong chon cua board 6.9: nhan 12px tren, o 48px bo 10, 15px, ▾; `error` = vien do 2px (giao vien trung). */
function MobileField({ disabled, error, label, muted, onClick, value }: { disabled?: boolean; error?: boolean; label: string; muted?: boolean; onClick: () => void; value: string }) {
  return (
    <Box component="label" sx={{ color: color.textSecondary, display: "flex", flexDirection: "column", fontSize: "0.75rem", gap: "4px" }}>
      {label}
      <ButtonBase aria-label={label} disabled={disabled} onClick={onClick} sx={{ border: error ? `2px solid ${scheduleTokens.clash.edge}` : `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, boxSizing: "border-box", color: muted ? color.textMuted : color.text, fontSize: "0.9375rem", height: 48, justifyContent: "space-between", opacity: disabled ? 0.5 : 1, px: 1.5, textAlign: "left", width: "100%" }}>
        {value}<Box aria-hidden component="span" sx={{ color: color.textMuted }}>▾</Box>
      </ButtonBase>
    </Box>
  );
}

type View = "form" | "teacher" | "assistant" | "room";
type Row = GridRow;

type Props = { catalog?: TeachingCalendarCatalog; date: string; events: readonly TeachingCalendarEvent[]; onClose: () => void; open: boolean; schoolId: string; schoolName: string };

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

function AdminMobileSheetBody({ catalog, date, events, onClose, open, schoolId, schoolName }: Props) {
  const tenantId = getDefaultTenantId();
  // BE bat buoc mon khi luu nhap (SUBJECT_REQUIRED) va gan 1 mon cho ca dot -> dot nhap da co mon thi khoa theo mon do.
  const programs = (catalog?.levels ?? []).map((level) => ({
    label: [catalog?.subjects.find((subject) => subject.id === level.subjectId)?.label, level.label].filter(Boolean).join(" · "),
    value: `${level.subjectId}|${level.id}`,
  }));
  const draftEvent = events.find((event) => event.schoolId === schoolId && event.status === "DRAFT" && event.subjectId);
  const seed = draftEvent ?? events.find((event) => event.schoolId === schoolId && event.subjectId && event.levelId);
  const [program, setProgram] = useState(seed?.subjectId && seed.levelId ? `${seed.subjectId}|${seed.levelId}` : "");
  const [subjectId, levelId] = program.split("|");
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
  const apply = (next: Row) => { setRow(next); setView("form"); };
  const draftRow = (): Row => row ?? { classId: "", className: "", clientRowId: newClientRowId(), periodNo, weekday };
  const teacherOption = data?.teachers.find((teacher) => teacher.teacherId === row?.teacherId);
  const busy = teacherOption && (teacherOption.state === "BUSY" || teacherOption.state === "TRAVEL") ? teacherOption : undefined;
  const swap = busy ? data?.teachers.find((teacher) => teacher.state === "FREE" || teacher.state === "SUGGESTED") : undefined;
  const periodTemplateId = template?.id ?? "";
  const sunday = weekday === 0;
  const canAdd = !sunday && Boolean(subjectId && row?.classId && row.teacherId && slot?.startTime && periodTemplateId);

  return (
    <MobileBottomSheet description={schoolName} onOpenChange={(next) => !next && onClose()} open={open} title={`Thêm tiết · ${dayLabel(date)}`}>
      {view === "form" ? (
        <Stack spacing={1.5}>
          <Box>
            <Box sx={{ mb: "6px", typography: "subtitle2", fontSize: "0.8125rem" }}>Tiết</Box>
            <Box role="radiogroup" sx={{ display: "grid", gap: "6px", gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
              {(template?.slots ?? []).map((item) => {
                const on = item.periodNo === periodNo;
                const none = !item.startTime;
                const taken = !on && takenPeriods.has(item.periodNo);
                return (
                  <ButtonBase
                    aria-checked={on} disabled={none} key={item.periodNo} onClick={() => { setPeriodNo(item.periodNo); setRow((current) => (current ? { ...current, periodNo: item.periodNo } : current)); }} role="radio"
                    sx={{ bgcolor: on ? "primary.main" : taken ? scheduleTokens.neutral.bg : "background.paper", border: none ? `1px dashed ${color.border}` : on || taken ? 0 : `1px solid ${color.border}`, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: on ? "primary.contrastText" : taken ? color.textMuted : none ? color.textSoft : color.text, flexDirection: "column", height: 48, minWidth: 0 }}
                  >
                    <Box component="span" sx={{ typography: "subtitle2" }}>{item.periodNo}</Box>
                    <Box component="span" sx={{ fontSize: "0.625rem" }}>{periodChipHint(item, on, takenPeriods.has(item.periodNo))}</Box>
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
          <ErgSelect
            disabled={Boolean(draftEvent) || !programs.length} helperText={draftEvent ? "Theo môn của đợt nháp đang có" : undefined} label="Môn · Chương trình"
            onChange={(event) => setProgram(event.target.value)} options={programs} value={program}
          />
          {data ? (
            <ClassCombobox
              classes={data.classes} grade={data.grade} onChange={(option) => option && apply({ ...draftRow(), classId: option.classId, className: option.className, periodNo })}
              periodNo={periodNo} schoolName={data.schoolName} value={row?.classId} weekdayName={weekdayName(weekday)}
            />
          ) : null}
          <MobileField disabled={!row} error={Boolean(busy)} label="Giáo viên" muted={!row?.teacherName} onClick={() => setView("teacher")} value={row?.teacherName ?? "Chọn giáo viên"} />
          <MobileField disabled={!row} label="Phòng học" muted={!row?.roomName && !row?.newRoomName} onClick={() => setView("room")} value={row?.roomName ?? row?.newRoomName ?? "PM 03 · chọn hoặc gõ"} />
          <MobileField disabled={!row} label="Trợ giảng" muted={!row?.assistantName} onClick={() => setView("assistant")} value={row?.assistantName ?? "Không có"} />
          {busy ? (
            <Box role="alert" sx={{ bgcolor: scheduleTokens.clash.bg, borderRadius: `${ergEnterpriseTokens.radius.card}px`, color: color.textSecondary, display: "flex", flexDirection: "column", fontSize: "0.8125rem", gap: "4px", p: 1.5 }}>
              <Box component="strong" sx={{ color: scheduleTokens.clash.text, typography: "subtitle2", fontSize: "0.8125rem" }}>{busy.state === "TRAVEL" ? "Không kịp di chuyển" : "Trùng giáo viên"} · Tiết {periodNo}{slot?.startTime ? `, ${slot.startTime}–${slot.endTime}` : ""}</Box>
              {busy.busy ? <span>{busy.teacherName} đang dạy <Box component="strong" sx={{ color: color.text, typography: "subtitle2", fontSize: "0.8125rem" }}>{[busy.busy.className, busy.busy.roomName, busy.busy.schoolName].filter(Boolean).join(" · ")}</Box></span> : null}
              {busy.busy ? <Box component="span" sx={{ color: color.textMuted, fontSize: "0.75rem" }}>{sourceLabel(busy.busy)}</Box> : null}
              {swap ? <Link component="button" onClick={() => row && apply(withTeacher(row, { id: swap.teacherId, name: swap.teacherName }).row)} sx={{ alignItems: "center", display: "flex", minHeight: 32, textAlign: "left", typography: "subtitle2", fontSize: "0.8125rem" }} type="button" underline="none">Đổi sang {swap.teacherName} (trống tiết {periodNo}) →</Link> : null}
            </Box>
          ) : null}
          {row?.className ? <Box sx={{ bgcolor: scheduleTokens.published.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: scheduleTokens.published.text, fontSize: "0.75rem", px: "10px", py: 1 }}>Khi áp dụng: cấp quyền lớp {row.className} cho giáo viên được chọn.</Box> : null}
          {sunday ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>Chủ nhật không có trong lưới xếp lịch. Chọn ngày từ Thứ 2 đến Thứ 7.</Typography> : null}
          {add.isError ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>Chưa lưu được · Thử lại</Typography> : null}
          <ErgButton disabled={!canAdd} fullWidth sx={{ borderRadius: `${ergEnterpriseTokens.radius.control}px`, fontSize: "0.9375rem", height: 48 }} loading={add.isPending} onClick={() => row && add.mutate({ date, levelId, periodTemplateId, row, schoolId, subjectId })} variant="contained">Thêm vào nháp</ErgButton>
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

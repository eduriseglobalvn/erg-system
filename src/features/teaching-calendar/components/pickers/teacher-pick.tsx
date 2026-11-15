import { useMemo, useState, type KeyboardEvent } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import type { TeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import { minutes } from "@/features/teaching-calendar/domain/schedule-copy";
import { formatDateVi } from "@/domain/formatters/format-date";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { teacherTone } from "../shared/teacher-tone";
import { PickTag } from "./pick-tag";

type Teacher = TeachingSlotOptions["teachers"][number];

export type TeacherPickMode = "teacher" | "assistant";

type Props = {
  className: string;
  mode?: TeacherPickMode;
  /** Giao vien chinh cua tiet: o che do tro giang luon nam o nhom «Không xếp được», khong chon duoc. */
  mainTeacher?: { id?: string; name?: string };
  /** Trong dialog «Đổi giáo viên»: dòng chọn tô nền, không hiện dòng giải thích «khi áp dụng». */
  inDialog?: boolean;
  onClose: () => void;
  onSelect: (teacher: { id: string; name: string } | null) => void;
  teachers: readonly Teacher[];
  selectedId?: string;
};

const { color, radius, type } = ergEnterpriseTokens;
const groupSx = { bgcolor: color.surfaceMuted, color: color.textMuted, px: 1.25, py: 0.75, ...type.microStrong } as const;
const isBlocked = (teacher: Teacher) => teacher.state === "BUSY" || teacher.state === "TRAVEL";
const dd = (value: string) => formatDateVi(value).slice(0, 5);
const FREE = new Set(["SUGGESTED", "FREE"]);

function permissionLine(teacher: Teacher, className: string) {
  return teacher.classAccess === "NEW" ? `Chưa có quyền lớp ${className} → sẽ cấp` : `Đã có quyền ${className}`;
}

function subLine(teacher: Teacher, className: string) {
  const load = `${teacher.weeklyPeriods} tiết/tuần`;
  if (teacher.sameSchoolNeighbor?.periodNo) return `${load} · tiết ${teacher.sameSchoolNeighbor.periodNo} dạy ${teacher.sameSchoolNeighbor.className} cùng trường`;
  return teacher.taughtHereLastWeek ? `${load} · tuần trước dạy ${className} giờ này` : load;
}

function reason(teacher: Teacher) {
  if (teacher.state === "BUSY" && teacher.busy) {
    const where = [teacher.busy.className, teacher.busy.roomName, teacher.busy.schoolName].filter(Boolean).join(" · ");
    return [`Đang dạy ${where}`, [teacher.busy.batchLabel, teacher.busy.batchStatus === "PUBLISHED" ? "đã áp dụng" : "nháp"].filter(Boolean).join(" · ")];
  }
  if (teacher.state === "TRAVEL" && teacher.travel) {
    const gap = teacher.travel;
    return [
      `Tiết liền trước dạy ở ${gap.fromSchoolName} · chỉ cách ${minutes(gap.gapMinutes)} (cần ≥ ${minutes(gap.requiredMinutes)})`,
      `Thời gian di chuyển tối thiểu ${gap.fromSchoolShortName} ↔ ${gap.toSchoolShortName}: ${minutes(gap.requiredMinutes)}`,
    ];
  }
  if (teacher.state === "LEAVE" && teacher.leave) return [`Nghỉ phép ${dd(teacher.leave.fromDate)} – ${dd(teacher.leave.toDate)}`, "Theo lịch nghỉ đã duyệt"];
  return [];
}

const TAGS: Record<string, { label: string; tone: "free" | "busy" | "travel" | "leave" }> = {
  BUSY: { label: "Bận", tone: "busy" }, FREE: { label: "Trống", tone: "free" }, LEAVE: { label: "Nghỉ", tone: "leave" },
  SUGGESTED: { label: "Trống", tone: "free" }, TRAVEL: { label: "Không kịp di chuyển", tone: "travel" },
};

/** AdminTeacherPick (6.3) va AdminAssistantPick (6.16): MOT component, khac nhau o prop `mode`. */
export function TeacherPick({ className, inDialog = false, mainTeacher, mode = "teacher", onClose, onSelect, selectedId, teachers }: Props) {
  const assistant = mode === "assistant";
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const visible = useMemo(() => teachers.filter((teacher) => teacher.teacherName.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi"))), [query, teachers]);
  const isMain = (teacher: Teacher) => assistant && Boolean(mainTeacher?.id) && teacher.teacherId === mainTeacher?.id;
  const selectable = visible.filter((teacher) => !isMain(teacher));
  const free = visible.filter((teacher) => !isMain(teacher) && FREE.has(teacher.state));
  const blocked = visible.filter((teacher) => isMain(teacher) || !FREE.has(teacher.state));
  const ordered = [...(assistant ? [null] : []), ...free, ...blocked.filter((teacher) => !isMain(teacher))];
  const highlighted = ordered[Math.min(cursor, ordered.length - 1)];
  const preview = highlighted ?? undefined;

  const pick = (teacher: Teacher | null) => onSelect(teacher ? { id: teacher.teacherId, name: teacher.teacherName } : null);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setCursor((value) => Math.min(value + 1, ordered.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setCursor((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter" && highlighted !== undefined) { event.preventDefault(); pick(highlighted); }
    else if (event.key === "Escape") { event.stopPropagation(); onClose(); }
  };

  const row = (teacher: Teacher, index: number) => {
    const lines = reason(teacher);
    const main = isMain(teacher);
    const tag = main ? { label: "Đang là GV chính", tone: "leave" as const } : TAGS[teacher.state];
    return (
      <ButtonBase
        aria-selected={teacher.teacherId === selectedId}
        disabled={main}
        key={teacher.teacherId}
        onClick={() => pick(teacher)}
        onMouseEnter={() => setCursor(index)}
        role="option"
        sx={{ alignItems: "flex-start", bgcolor: (inDialog ? teacher.teacherId === selectedId : highlighted === teacher) ? scheduleTokens.published.bg : "transparent", borderTop: `1px solid ${color.divider}`, gap: 1.25, opacity: main ? 0.5 : teacher.state === "LEAVE" ? 0.55 : 1, px: 1.25, py: 1, textAlign: "left", width: "100%" }}
      >
        <Avatar sx={{ bgcolor: teacherTone(teacher.teacherId).background, color: teacherTone(teacher.teacherId).text, height: 28, ...type.microStrong, width: 28 }}>{teacher.initials}</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...type.smallStrong }}>{teacher.teacherName}</Typography>
          {main ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>Đã chọn làm giáo viên chính của tiết này</Typography> : lines.length ? lines.map((line) => (
            <Typography key={line} sx={{ color: isBlocked(teacher) ? scheduleTokens.clash.text : color.textSecondary, display: "block", ...type.note }}>{line}</Typography>
          )) : (
            <>
              <Typography sx={{ color: color.textSecondary, display: "block", ...type.note }}>{subLine(teacher, className)}</Typography>
              <Typography sx={{ color: color.textMuted, display: "block", ...type.micro }}>{permissionLine(teacher, className)}</Typography>
            </>
          )}
        </Box>
        {tag ? <PickTag label={tag.label} tone={tag.tone} /> : null}
      </ButtonBase>
    );
  };

  const status = preview && !inDialog
    ? assistant
      ? `Chọn ${preview.teacherName} làm trợ giảng: khi áp dụng sẽ cấp quyền lớp ${className} (${preview.classAccess === "NEW" ? "mới" : "đã có"}) và gửi lịch cho ${preview.teacherName}. Tiết trợ giảng được tính vào tải tuần.`
      : `Chọn ${preview.teacherName}: khi áp dụng sẽ cấp quyền lớp ${className} (${preview.classAccess === "NEW" ? "mới" : "đã có"}).`
    : "";
  let index = assistant ? 1 : 0;

  return (
    <Stack onKeyDown={onKeyDown} sx={{ width: inDialog ? "100%" : { sm: 440, xs: "100%" } }}>
      <Box sx={{ p: inDialog ? 0 : 1.5, pb: inDialog ? 0.75 : 1.5 }}>
        <ErgTextField autoFocus compact onChange={(event) => { setQuery(event.target.value); setCursor(0); }} placeholder={assistant ? "Tìm trợ giảng…" : "Tìm giáo viên…"} value={query} />
      </Box>
      <Box aria-label="Giáo viên" role="listbox" sx={{ border: 1, borderColor: "divider", borderRadius: `${radius.control}px`, maxHeight: inDialog ? 240 : 420, mx: inDialog ? 0 : 1.5, overflow: "hidden auto" }}>
        {assistant ? (
          <ButtonBase onClick={() => pick(null)} onMouseEnter={() => setCursor(0)} role="option" sx={{ alignItems: "center", bgcolor: highlighted === null ? "action.hover" : "transparent", gap: 1.25, px: 1.5, py: 1, width: "100%" }}>
            <Box aria-hidden sx={{ border: 1, borderColor: "text.disabled", borderRadius: "50%", borderStyle: "dashed", height: 32, width: 32 }} />
            <Typography sx={{ typography: "body2" }}>Không có trợ giảng</Typography>
          </ButtonBase>
        ) : null}
        {free.length ? <Typography sx={groupSx}>Trống tiết này</Typography> : null}
        {free.map((teacher) => row(teacher, index++))}
        {blocked.length ? <Typography sx={groupSx}>Không xếp được</Typography> : null}
        {blocked.map((teacher) => row(teacher, isMain(teacher) ? -1 : index++))}
        {!selectable.length && !visible.length ? <Typography sx={{ color: "text.secondary", p: 2, typography: "body2" }}>Không có giáo viên nào khớp</Typography> : null}
      </Box>
      {status ? <Typography role="status" sx={{ bgcolor: scheduleTokens.published.bg, borderRadius: `${radius.control}px`, color: scheduleTokens.published.text, m: 1.5, px: 1.5, py: 1.25, ...type.note, lineHeight: 1.5 }}>{status}</Typography> : null}
    </Stack>
  );
}

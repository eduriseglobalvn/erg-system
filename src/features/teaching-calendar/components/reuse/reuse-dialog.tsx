import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { formatDateVi } from "@/domain/formatters/format-date";
import { compactWeekRange, weekRangeLabel, weekdayName } from "@/features/teaching-calendar/domain/schedule-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { scheduleTokens } from "../shared/schedule-cell-sx";
import { ReusePreviewTable } from "./reuse-preview-table";
import { useReuse } from "./use-reuse";

type SchoolOption = { id: string; name: string };

type Props = {
  onClose: () => void;
  open: boolean;
  /** Truong co tiet trong tuan nguon; nhieu hon mot thi hien o chon truong. */
  schools: readonly SchoolOption[];
  schoolId: string;
  onSchoolChange: (id: string) => void;
  weekStart: string;
};

/** «Tiết đang trùng (Thứ 4 tiết 6, Thứ 6 tiết 2) sẽ không được copy.» — chi khi co tiet bi loai. */
export function excludedSentence(excluded: ReadonlyArray<{ periodNo: number; weekday: number }>): string {
  if (!excluded.length) return "";
  const list = excluded.map((item) => `${weekdayName(item.weekday)} tiết ${item.periodNo}`).join(", ");
  return ` Tiết đang trùng (${list}) sẽ không được copy.`;
}

/** Dialog «Dùng lại lịch tuần» (6.5). Tao xong = ban nhap moi, chuyen toi trang xep cua dot do. */
export function ReuseDialog({ onClose, onSchoolChange, open, schoolId, schools, weekStart }: Props) {
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("md"));
  const reuse = useReuse({ enabled: open, onDone: onClose, schoolId, weekStart });
  const data = reuse.preview.data;
  const school = schools.find((item) => item.id === schoolId);
  const total = data?.totalToCreate ?? 0;
  const holidays = [...new Map((data?.weeks ?? []).flatMap((week) => week.holidays).map((holiday) => [holiday.date, holiday])).values()];
  const holidayLabel = holidays.length ? `Bỏ qua ngày nghỉ (${holidays.map((holiday) => `${formatDateVi(holiday.date).slice(0, 5)} · ${holiday.name}`).join(", ")})` : "Bỏ qua ngày nghỉ";

  return (
    <ErgDialog
      actions={(
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton disabled={total === 0 || reuse.preview.isFetching} loading={reuse.create.isPending} onClick={() => reuse.create.mutate()} variant="contained">
            Tạo {total} tiết nháp
          </ErgButton>
        </>
      )}
      description={data ? (
        <>
          {school?.name} · {data.sourcePeriods} tiết · {data.perTeacher.map((teacher) => `${teacher.teacherName} ${teacher.periods}`).join(", ")}.
          {excludedSentence(data.excludedConflicts)}
        </>
      ) : undefined}
      fullScreen={fullScreen} maxWidth={false} onClose={onClose} open={open} sx={{ "& .MuiDialog-paper": { maxWidth: 760 } }}
      title={`Dùng lại lịch tuần ${weekRangeLabel(weekStart, "reuse")}`}
    >
      <Stack spacing={2}>
        <Typography sx={{ ...ergEnterpriseTokens.type.smallStrong }}>Áp dụng cho</Typography>
        {schools.length > 1 ? <ErgSelect label="Trường nguồn" onChange={(event) => onSchoolChange(event.target.value)} options={schools.map((item) => ({ label: item.name, value: item.id }))} size="small" value={schoolId} /> : null}
        {reuse.preview.isError ? <Typography color="error" role="alert" sx={{ typography: "body2" }}>Không xem trước được. Thử lại sau.</Typography> : null}
        {reuse.create.isError ? <Typography color="error" role="alert" sx={{ typography: "body2" }}>Chưa tạo được. Thử lại sau.</Typography> : null}
        <RadioGroup onChange={(event) => reuse.setMode(event.target.value as typeof reuse.mode)} value={reuse.mode}>
          <FormControlLabel control={<Radio />} label="Các tuần đã chọn" value="SELECTED_WEEKS" />
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, pb: 1, pl: 4 }}>
            {reuse.choices.map((week) => {
              const on = reuse.weekStarts.includes(week);
              return (
                <Chip
                  clickable disabled={reuse.mode !== "SELECTED_WEEKS"} key={week}
                  label={`${on ? "✓ " : ""}${compactWeekRange(week)}`} onClick={() => reuse.toggleWeek(week)} variant={on ? "filled" : "outlined"}
                  sx={{ bgcolor: on ? scheduleTokens.published.bg : undefined, borderColor: on ? undefined : ergEnterpriseTokens.color.border, color: on ? scheduleTokens.published.text : ergEnterpriseTokens.color.textSecondary, height: 30, ...(on ? ergEnterpriseTokens.type.smallStrong : ergEnterpriseTokens.type.small), "&:hover": { bgcolor: on ? scheduleTokens.published.bg : undefined } }}
                />
              );
            })}
          </Stack>
          <FormControlLabel
            control={<Radio />} value="REPEAT_UNTIL"
            label={(
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <span>Lặp hằng tuần đến {formatDateVi(reuse.repeatUntil)}</span>
                {reuse.mode === "REPEAT_UNTIL" ? (
                  <ErgTextField compact onChange={(event) => event.target.value && reuse.setRepeatUntil(event.target.value)} slotProps={{ htmlInput: { "aria-label": "Lặp đến ngày" } }} sx={{ width: 170 }} type="date" value={reuse.repeatUntil} />
                ) : null}
              </Stack>
            )}
          />
        </RadioGroup>
        <Stack>
          <FormControlLabel control={<Checkbox checked={reuse.skipHolidays} onChange={(event) => reuse.setSkipHolidays(event.target.checked)} />} label={holidayLabel} />
          <FormControlLabel control={<Checkbox checked={reuse.keepRoomAndAssistant} onChange={(event) => reuse.setKeepRoomAndAssistant(event.target.checked)} />} label="Giữ phòng học và trợ giảng" />
        </Stack>
        {data ? <ReusePreviewTable weeks={data.weeks} /> : null}
        <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, ...ergEnterpriseTokens.type.small }}>
          Lịch được tạo thành bản nháp: giáo viên chưa thấy cho đến khi bạn áp dụng. Tiết trùng không được tạo; mở lưới tuần đó để xử lý.
        </Typography>
      </Stack>
    </ErgDialog>
  );
}

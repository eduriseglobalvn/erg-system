import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/vi";
import { useState } from "react";

import { ErgTextField } from "@/components/erg-mui/erg-form";
import { useTeachingDayLoads } from "@/features/teaching-calendar/api/teaching-calendar-day-loads-api";
import { useCreateHoliday } from "../../api/timekeeping-config-query";
import type { HolidayCommand } from "../../api/timekeeping-types";
import { AffectedNotice, FieldBlock, HolidayFields, segmentedSx } from "./days-off-fields";
import { addCommand, addDays, affectedNotice, errorCodeOf, rangeSummary, sumLoads, type AddFormState } from "./days-off-model";
import { requestErrorText } from "../../components/requests/request-model";
import { usePastConfirm } from "./days-off-past-warning-dialog";

const FORMAT = "DD/MM/YYYY";
const ISO = "YYYY-MM-DD";
/** teachingScheduleDayLoads answers at most 42 days. */
const MAX_LOAD_DAYS = 42;

const toPicker = (iso: string) => (iso ? dayjs(iso) : null);
const fromPicker = (value: Dayjs | null) => (value?.isValid() ? value.format(ISO) : "");

/** State, validation and save of the «Thêm ngày nghỉ» form; the dialog (desktop) and the sheet (phone) only lay it out. */
export function useAddHolidayForm(initialDate: string, onSaved: (from: string) => void) {
  const [state, setState] = useState<AddFormState>({ mode: "ONE", from: initialDate, to: initialDate, name: "", kind: "COMPANY", payMode: null, teachingAction: "CANCEL" });
  const create = useCreateHoliday();
  const past = usePastConfirm();
  const command = addCommand(state);
  const to = state.mode === "ONE" ? state.from : state.to;
  const inLoadWindow = Boolean(command) && to >= state.from && addDays(state.from, MAX_LOAD_DAYS - 1) >= to;
  const loads = useTeachingDayLoads(state.from, to, inLoadWindow);
  const impact = sumLoads(loads.data ?? [], state.from, to);

  const save = (body: HolidayCommand) => create.mutate(body, {
    onError: (error) => { past.handle(error, () => save({ ...body, confirmPast: true })); },
    onSuccess: () => onSaved(body.from ?? ""),
  });
  return {
    state, command, create, past, impact, to,
    set: (patch: Partial<AddFormState>) => setState((current) => ({ ...current, ...patch })),
    submit: () => { if (command) save(command); },
    errorText: create.isError && !pastIsOpen(create.error) ? holidayErrorText(create.error) : "",
    exists: create.isError && errorCodeOf(create.error) === "HOLIDAY_EXISTS",
  };
}

const pastIsOpen = (error: unknown) => errorCodeOf(error) === "HOLIDAY_AFFECTS_PAST_PERIODS";

export const holidayErrorText = (error: unknown) =>
  errorCodeOf(error) === "HOLIDAY_EXISTS" ? "Ngày lễ này đã có. Mở ngày đó trên lịch để sửa." : requestErrorText(error);

type FormApi = ReturnType<typeof useAddHolidayForm>;

/** Ngày · Tên ngày nghỉ · Loại · Tính lương · Tiết dạy · khối cam · lỗi. */
export function AddHolidayFields({ form, touch = false }: { form: FormApi; touch?: boolean }) {
  const { set, state } = form;
  return (
    <LocalizationProvider adapterLocale="vi" dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "grid", gap: 2 }}>
        <FieldBlock label="Ngày">
          <ToggleButtonGroup aria-label="Số ngày" exclusive onChange={(_, value) => { if (value) set({ mode: value, to: value === "ONE" ? state.from : state.to || state.from }); }} role="radiogroup" size="small" sx={[segmentedSx(touch ? 32 : 30, 3, "0.8125rem"), { width: touch ? "100%" : 260 }]} value={state.mode}>
            <ToggleButton aria-checked={state.mode === "ONE"} role="radio" value="ONE">Một ngày</ToggleButton>
            <ToggleButton aria-checked={state.mode === "RANGE"} role="radio" value="RANGE">Khoảng ngày</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: state.mode === "RANGE" ? "1fr 1fr" : "1fr" }}>
            <DatePicker format={FORMAT} label={state.mode === "RANGE" ? "Từ ngày" : "Ngày nghỉ"} onChange={(value) => { const from = fromPicker(value); set({ from, to: state.mode === "ONE" || !state.to || state.to < from ? from : state.to }); }} slotProps={{ textField: { size: "small" } }} value={toPicker(state.from)} />
            {state.mode === "RANGE" ? <DatePicker format={FORMAT} label="Đến ngày" minDate={toPicker(state.from) ?? undefined} onChange={(value) => set({ to: fromPicker(value) })} slotProps={{ textField: { size: "small" } }} value={toPicker(state.to)} /> : null}
          </Box>
          {state.mode === "RANGE" && rangeSummary(state.from, state.to) ? <Typography color="text.secondary" variant="caption">{rangeSummary(state.from, state.to)}</Typography> : null}
        </FieldBlock>
        <ErgTextField label="Tên ngày nghỉ" onChange={(event) => set({ name: event.target.value })} slotProps={{ htmlInput: { maxLength: 120 } }} value={state.name} />
        <HolidayFields compact touch={touch} kind={state.kind} onKind={(kind) => set({ kind })} onPayMode={(payMode) => set({ payMode })} onTeachingAction={(teachingAction) => set({ teachingAction })} payMode={state.payMode} teachingAction={state.teachingAction} />
        {form.impact.periods > 0 ? <AffectedNotice>{affectedNotice(form.impact.periods, form.impact.schools, state.mode === "RANGE" && state.to > state.from)}</AffectedNotice> : null}
        {form.exists ? <AffectedNotice>{form.errorText}</AffectedNotice> : form.errorText ? <Typography color="error" role="alert" variant="body2">{form.errorText}</Typography> : null}
      </Box>
    </LocalizationProvider>
  );
}

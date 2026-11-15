import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";

import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgDrawer } from "@/components/erg-mui/erg-overlays";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { AddHolidayFields, useAddHolidayForm } from "./add-holiday-form";
import { DaysOffHeader } from "./days-off-header";
import { holidayNamesOf } from "./days-off-names";
import { DaysOffPastWarningDialog } from "./days-off-past-warning-dialog";
import { SelectedHolidayCard } from "./days-off-selected-card";
import { holidayCardTitle, isSaturday, kindLabel, monthGrid, payModeShort, weekdayDayMonth } from "./days-off-model";
import { SaturdayModesCard } from "./saturday-modes-card";
import type { DaysOffState } from "./use-days-off";

const tokens = ergEnterpriseTokens;
const HEAD = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const sheetSlots = { paper: { sx: { borderRadius: "20px 20px 0 0", maxHeight: "90vh", width: "100%" } } };

function AddSheet({ date, onClose, onSaved }: { date: string; onClose: () => void; onSaved: (date: string) => void }) {
  const form = useAddHolidayForm(date, (from) => { toast.success("Đã thêm ngày nghỉ"); onSaved(from); onClose(); });
  return (
    <>
      <ErgDrawer anchor="bottom" description="Áp cho toàn hệ thống." onClose={onClose} open slotProps={sheetSlots} title={`Thêm ngày nghỉ · ${weekdayDayMonth(date)}`}>
        <Box sx={{ display: "grid", gap: 2, pb: 3, px: 3 }}>
          <AddHolidayFields form={form} />
          <ErgButton disabled={!form.command} loading={form.create.isPending} onClick={form.submit} sx={{ height: tokens.size.controlLg }} variant="contained">Thêm ngày nghỉ</ErgButton>
        </Box>
      </ErgDrawer>
      {form.past.warning ? <DaysOffPastWarningDialog loading={form.create.isPending} onCancel={form.past.close} warning={form.past.warning} /> : null}
    </>
  );
}

function Dot({ color }: { color: string }) {
  return <Box component="span" sx={{ bgcolor: color, borderRadius: "50%", display: "inline-block", height: 6, mr: 0.5, width: 6 }} />;
}

/** Phone layout (390): mini calendar, the month's days off, Saturday modes, FAB; add and edit happen in a bottom sheet. */
export function DaysOffMobile({ state }: { state: DaysOffState }) {
  const holiday = state.selectedHoliday;
  return (
    <Box sx={{ display: "grid", gap: 2, pb: 12, px: 2, py: 2 }}>
      <DaysOffHeader actions={false} state={state} />
      {state.failed ? (
        <ErgErrorState action={<ErgButton onClick={state.retry} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />
      ) : state.loading ? <ErgSkeleton height={320} /> : (
        <>
          <Box component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, p: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center" }}>
              {HEAD.map((label) => <Typography color="text.secondary" key={label} variant="caption">{label}</Typography>)}
              {monthGrid(state.month).map((date) => {
                const inMonth = date.startsWith(state.month);
                const off = inMonth && state.holidays.has(date);
                const office = inMonth && !off && isSaturday(date) && (state.modes.get(date) ?? "OFFICE") === "OFFICE";
                return (
                  <ButtonBase
                    aria-label={weekdayDayMonth(date)}
                    key={date}
                    onClick={() => (off ? state.select(date) : state.openAdd(date))}
                    sx={{ borderRadius: `${tokens.radius.control}px`, display: "grid", height: 40, justifyItems: "center", opacity: inMonth ? 1 : 0.4, placeContent: "center", ...(off ? { bgcolor: tokens.schedule.clash.bg, color: tokens.schedule.clash.text } : {}), ...(date === state.today ? { outline: `2px solid ${tokens.color.primary}`, outlineOffset: -2 } : {}) }}
                  >
                    <Typography component="span" variant="body2">{Number(date.slice(8))}</Typography>
                    <Box component="span" sx={{ bgcolor: off ? tokens.schedule.clash.edge : office ? tokens.color.primary : "transparent", borderRadius: "50%", height: 4, width: 4 }} />
                  </ButtonBase>
                );
              })}
            </Box>
            <Box sx={{ color: "text.secondary", display: "flex", gap: 2, pt: 0.5, px: 0.5 }}>
              <Typography component="span" variant="caption"><Dot color={tokens.schedule.clash.edge} />Ngày nghỉ</Typography>
              <Typography component="span" variant="caption"><Dot color={tokens.color.primary} />Thứ 7 đi làm</Typography>
            </Box>
          </Box>
          {state.monthHolidays.length === 0 ? (
            <Typography color="text.secondary" variant="body2">Tháng này chưa có ngày nghỉ. Bấm một ngày trên lịch để thêm ngày nghỉ, hoặc nhập lịch nghỉ lễ theo năm.</Typography>
          ) : (
            <Box component="ul" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${tokens.radius.card}px`, listStyle: "none", m: 0, overflow: "hidden", p: 0 }}>
              {state.monthHolidays.map((item) => {
                const periods = item.affectedPeriods ?? 0;
                const sub = [kindLabel(item.kind), payModeShort(item.payMode), periods > 0 ? `${periods} tiết${item.teachingAction === "CANCEL" ? " huỷ" : ""}` : ""].filter(Boolean).join(" · ");
                const date = item.date ?? "";
                return (
                  <Box component="li" key={item.id} sx={{ borderBottom: 1, borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
                    <ButtonBase onClick={() => state.select(date)} sx={{ alignItems: "center", display: "flex", gap: 1.5, justifyContent: "space-between", p: 1.5, textAlign: "left", width: "100%" }}>
                      <Typography component="span" sx={{ width: 44 }} variant="subtitle2">{`${date.slice(8)}/${date.slice(5, 7)}`}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography noWrap variant="body2">{item.name}</Typography>
                        <Typography color="text.secondary" component="span" noWrap variant="caption">{sub}</Typography>
                      </Box>
                      <ChevronRightIcon fontSize="small" />
                    </ButtonBase>
                  </Box>
                );
              })}
            </Box>
          )}
          <SaturdayModesCard hasHolidays={state.monthHolidays.length > 0} holidayNames={holidayNamesOf(state)} month={state.month} />
          <Link component="button" onClick={state.openImport} type="button" underline="hover" variant="body2">{`Nhập lịch nghỉ lễ năm ${state.importYear}`}</Link>
        </>
      )}
      <ErgButton
        disabled={state.failed}
        onClick={() => state.openAdd(state.today.startsWith(state.month) ? state.today : `${state.month}-01`)}
        startIcon={<AddIcon />}
        sx={{ borderRadius: `${tokens.radius.chip}px`, bottom: ergMobileDockAnchor(12), boxShadow: tokens.shadow.float, position: "fixed", right: 16, zIndex: 2 }}
        variant="contained"
      >
        Thêm ngày nghỉ
      </ErgButton>
      {state.adding ? <AddSheet date={state.adding} onClose={state.closeAdd} onSaved={state.select} /> : null}
      {holiday && state.editing ? (
        <ErgDrawer anchor="bottom" onClose={state.closeEdit} open slotProps={sheetSlots} title={holidayCardTitle(holiday)}>
          <Box sx={{ pb: 3, px: 3 }}><SelectedHolidayCard bare holiday={holiday} key={holiday.id} /></Box>
        </ErgDrawer>
      ) : null}
    </Box>
  );
}

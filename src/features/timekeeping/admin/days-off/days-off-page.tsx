import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { DaysOffAddDialog } from "./days-off-add-dialog";
import { DaysOffHeader } from "./days-off-header";
import { DaysOffImportDialog } from "./days-off-import-dialog";
import { DaysOffMobile } from "./days-off-mobile";
import { holidayCountStrip } from "./days-off-model";
import { holidayNamesOf } from "./days-off-names";
import { DaysOffMonthGrid } from "./days-off-month-grid";
import { SaturdayModesCard } from "./saturday-modes-card";
import { SelectedHolidayCard } from "./days-off-selected-card";
import { useDaysOff, type DaysOffState } from "./use-days-off";

function EmptyPanel({ onAdd }: { onAdd: () => void }) {
  return (
    <Box component="section" sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "grid", gap: 0.75, justifyItems: "start", p: 2 }}>
      <Typography component="h2" variant="subtitle1">Tháng này chưa có ngày nghỉ</Typography>
      <Typography color="text.secondary" variant="body2">Bấm một ngày trên lịch để thêm ngày nghỉ, hoặc nhập lịch nghỉ lễ theo năm.</Typography>
      <ErgButton onClick={onAdd} variant="text">Thêm ngày nghỉ</ErgButton>
    </Box>
  );
}

function Desktop({ state }: { state: DaysOffState }) {
  const hasHolidays = state.monthHolidays.length > 0;
  return (
    <>
      <Box sx={{ display: "grid", gap: 1.5, px: 3, py: 2 }}>
        <DaysOffHeader actions state={state} />
        <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) 380px" }}>
          {state.failed ? (
            <ErgErrorState action={<ErgButton onClick={state.retry} variant="outlined">Thử lại</ErgButton>} description="Kiểm tra kết nối rồi thử lại." title="Không tải được lịch." />
          ) : state.loading ? <ErgSkeleton height={640} /> : (
            <DaysOffMonthGrid
              holidays={state.holidays}
              modes={state.modes}
              month={state.month}
              onPick={(date, holiday) => (holiday ? state.select(date) : state.openAdd(date))}
              periods={state.periods}
              selected={state.selected}
              showLegend={hasHolidays}
              today={state.today}
            />
          )}
          {hasHolidays ? <Typography color="text.secondary" sx={{ gridColumn: 1, gridRow: 2 }} variant="caption">{holidayCountStrip(state.monthHolidays)}</Typography> : null}
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {state.loading || state.failed ? <ErgSkeleton height={320} /> : state.selectedHoliday ? (
              <SelectedHolidayCard holiday={state.selectedHoliday} key={state.selectedHoliday.id} />
            ) : <EmptyPanel onAdd={() => state.openAdd(`${state.month}-01`)} />}
            <SaturdayModesCard hasHolidays={hasHolidays} holidayNames={holidayNamesOf(state)} month={state.month} />
          </Box>
        </Box>
      </Box>
    </>
  );
}

/** `/admin/calendar/days-off?month=yyyy-MM`: days off and Saturday modes of the whole system, one month at a time. */
export function DaysOffPage() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"), { noSsr: true });
  const state = useDaysOff();
  return (
    <>
      {isMobile ? <DaysOffMobile state={state} /> : <Desktop state={state} />}
      {state.adding && !isMobile ? <DaysOffAddDialog date={state.adding} onClose={state.closeAdd} onSaved={state.select} /> : null}
      {state.importing ? <DaysOffImportDialog onClose={state.closeImport} year={state.importYear} /> : null}
    </>
  );
}

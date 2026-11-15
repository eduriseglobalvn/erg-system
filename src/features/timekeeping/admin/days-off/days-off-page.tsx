import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { DaysOffAddDialog } from "./days-off-add-dialog";
import { DaysOffHeader } from "./days-off-header";
import { DaysOffImportDialog } from "./days-off-import-dialog";
import { DaysOffMobile } from "./days-off-mobile";
import { EmptyPanel, LoadErrorPanel } from "./days-off-states";
import { holidayNamesOf } from "./days-off-names";
import { DaysOffMonthGrid } from "./days-off-month-grid";
import { SaturdayModesCard } from "./saturday-modes-card";
import { SelectedHolidayCard } from "./days-off-selected-card";
import { useDaysOff, type DaysOffState } from "./use-days-off";

function Desktop({ state }: { state: DaysOffState }) {
  const hasHolidays = state.monthHolidays.length > 0;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <DaysOffHeader actions state={state} />
      {state.failed ? <LoadErrorPanel onRetry={state.retry} /> : (
        <Box sx={{ alignItems: "start", display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) 380px" }}>
          {state.loading ? <ErgSkeleton height={640} /> : (
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
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {state.loading ? <ErgSkeleton height={320} /> : state.selectedHoliday ? (
              <SelectedHolidayCard holiday={state.selectedHoliday} key={state.selectedHoliday.id} />
            ) : <EmptyPanel onAdd={() => state.openAdd(`${state.month}-01`)} />}
            <SaturdayModesCard hasHolidays={hasHolidays} holidayNames={holidayNamesOf(state)} month={state.month} />
          </Box>
        </Box>
      )}
    </Box>
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

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { useDeleteHoliday, useUpdateHoliday } from "../../api/timekeeping-config-query";
import type { HolidayCommand, HolidayConfig, HolidayKind } from "../../api/timekeeping-types";
import { DeleteConfirm } from "../settings/delete-confirm";
import { holidayErrorText } from "./add-holiday-form";
import { AffectedNotice, HolidayFields } from "./days-off-fields";
import { DaysOffPastWarningDialog, usePastConfirm } from "./days-off-past-warning-dialog";
import { affectedNotice, errorCodeOf, holidayCardSubtitle, holidayCardTitle, isPayLocked } from "./days-off-model";

type Props = {
  holiday: HolidayConfig;
  /** Phone sheet: no frame, the sheet is the card. */
  bare?: boolean;
};

/** «Ngày nghỉ đang chọn»: every chip saves at once (PUT); a day already taught asks for confirmation first. */
export function SelectedHolidayCard({ bare = false, holiday }: Props) {
  const update = useUpdateHoliday();
  const remove = useDeleteHoliday();
  const past = usePastConfirm();
  const [deleting, setDeleting] = useState(false);
  const date = holiday.date ?? "";
  // While a save runs the chips already show the new value; a refusal puts them back because they follow the server row.
  const shown = update.isPending ? update.variables?.body : undefined;
  const kind = shown?.kind ?? holiday.kind ?? "COMPANY";
  const payMode = shown?.payMode ?? holiday.payMode ?? null;
  const teachingAction = shown?.teachingAction ?? holiday.teachingAction ?? "CANCEL";

  const run = (body: HolidayCommand) => update.mutate({ id: holiday.id ?? "", body }, {
    onError: (error) => { past.handle(error, () => run({ ...body, confirmPast: true })); },
    onSuccess: () => { toast.success("Đã lưu"); },
  });
  const save = (patch: Partial<HolidayCommand>) => {
    const nextKind = (patch.kind ?? kind) as HolidayKind;
    run({ from: date, to: date, name: holiday.name ?? "", kind, payMode: payMode ?? "PAID", teachingAction, ...patch, ...(isPayLocked(nextKind) ? { payMode: "PAID" } : {}) });
  };
  const failed = update.isError && errorCodeOf(update.error) !== "HOLIDAY_AFFECTS_PAST_PERIODS";
  const exists = failed && errorCodeOf(update.error) === "HOLIDAY_EXISTS";

  return (
    <Box
      aria-label="Ngày nghỉ đang chọn"
      component="section"
      sx={{ bgcolor: "background.paper", border: bare ? 0 : 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, display: "grid", gap: 1.5, p: bare ? 0 : 2 }}
    >
      <Box>
        <Typography component="h2" variant="h5">{holidayCardTitle(holiday)}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: "0.8125rem" }} variant="body2">{holidayCardSubtitle(holiday)}</Typography>
      </Box>
      <HolidayFields kind={kind} onKind={(next) => save({ kind: next })} onPayMode={(next) => save({ payMode: next })} onTeachingAction={(next) => save({ teachingAction: next })} payMode={payMode} teachingAction={teachingAction} />
      {(holiday.affectedPeriods ?? 0) > 0 ? <AffectedNotice>{affectedNotice(holiday.affectedPeriods ?? 0, holiday.affectedSchools ?? 0, false)}</AffectedNotice> : null}
      {exists ? <AffectedNotice>{holidayErrorText(update.error)}</AffectedNotice> : null}
      {failed && !exists ? (
        <Box role="alert" sx={{ alignItems: "center", bgcolor: ergEnterpriseTokens.schedule.clash.bg, borderRadius: `${ergEnterpriseTokens.radius.control}px`, color: ergEnterpriseTokens.schedule.clash.text, display: "flex", gap: 1, px: 1.25, py: 1 }}>
          <Typography sx={{ flex: 1, fontSize: "0.8125rem" }} variant="body2">{errorCodeOf(update.error) === "PERIOD_LOCKED" ? `Chưa lưu được. ${holidayErrorText(update.error)}` : "Chưa lưu được."}</Typography>
          <Link component="button" onClick={() => run((update.variables as { body: HolidayCommand }).body)} type="button" underline="none" variant="subtitle2">Thử lại</Link>
        </Box>
      ) : null}
      <Box>
        <ErgButton color="error" onClick={() => setDeleting(true)} variant="text">Xoá ngày nghỉ</ErgButton>
      </Box>
      {deleting && holiday.id ? (
        <DeleteConfirm description="Ngày này sẽ được tính là ngày làm việc bình thường." id={holiday.id} mutation={remove} onClose={() => { remove.reset(); setDeleting(false); }} title={`Xoá ngày nghỉ ${holiday.name ?? ""}?`} />
      ) : null}
      {past.warning ? <DaysOffPastWarningDialog loading={update.isPending} onCancel={past.close} warning={past.warning} /> : null}
    </Box>
  );
}

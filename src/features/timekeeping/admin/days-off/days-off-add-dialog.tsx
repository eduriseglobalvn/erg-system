import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { toast } from "sonner";
import { AddHolidayFields, useAddHolidayForm } from "./add-holiday-form";
import { DaysOffDialog } from "./days-off-dialog";
import { DaysOffPastWarningDialog } from "./days-off-past-warning-dialog";

type Props = { date: string; onClose: () => void; onSaved: (date: string) => void };

/** AdminDaysOffAdd: add one day or a range as a day off for the whole system. «Tính lương» has no default. */
export function DaysOffAddDialog({ date, onClose, onSaved }: Props) {
  const form = useAddHolidayForm(date, (from) => { toast.success("Đã thêm ngày nghỉ"); onSaved(from); onClose(); });
  return (
    <>
      <DaysOffDialog
        actions={
          <>
            <ErgButton onClick={onClose} sx={{ color: "primary.main", px: "14px" }} variant="text">Huỷ</ErgButton>
            <ErgButton disabled={!form.command} loading={form.create.isPending} onClick={form.submit} sx={{ borderColor: tokens.color.border, "&.Mui-disabled": { bgcolor: tokens.color.surface, borderColor: tokens.color.border, color: tokens.schedule.disabled }, px: 2 }} variant="outlined">Thêm ngày nghỉ</ErgButton>
          </>
        }
        description="Áp cho toàn hệ thống."
        onClose={onClose}
        title="Thêm ngày nghỉ"
        width={600}
      >
        <AddHolidayFields form={form} />
      </DaysOffDialog>
      {form.past.warning ? <DaysOffPastWarningDialog loading={form.create.isPending} onCancel={form.past.close} warning={form.past.warning} /> : null}
    </>
  );
}

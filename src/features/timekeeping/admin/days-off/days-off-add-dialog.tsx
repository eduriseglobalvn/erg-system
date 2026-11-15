import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { toast } from "sonner";
import { AddHolidayFields, useAddHolidayForm } from "./add-holiday-form";
import { DaysOffPastWarningDialog } from "./days-off-past-warning-dialog";

type Props = { date: string; onClose: () => void; onSaved: (date: string) => void };

/** AdminDaysOffAdd: add one day or a range as a day off for the whole system. «Tính lương» has no default. */
export function DaysOffAddDialog({ date, onClose, onSaved }: Props) {
  const form = useAddHolidayForm(date, (from) => { toast.success("Đã thêm ngày nghỉ"); onSaved(from); onClose(); });
  return (
    <>
      <ErgDialog
        actions={
          <>
            <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
            <ErgButton disabled={!form.command} loading={form.create.isPending} onClick={form.submit} variant="outlined">Thêm ngày nghỉ</ErgButton>
          </>
        }
        description="Áp cho toàn hệ thống."
        onClose={onClose}
        open
        title="Thêm ngày nghỉ"
      >
        <AddHolidayFields form={form} />
      </ErgDialog>
      {form.past.warning ? <DaysOffPastWarningDialog loading={form.create.isPending} onCancel={form.past.close} warning={form.past.warning} /> : null}
    </>
  );
}

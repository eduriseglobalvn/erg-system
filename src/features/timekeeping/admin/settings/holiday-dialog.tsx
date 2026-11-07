import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { isIsoDate } from "@/domain/formatters/format-date";
import { useCreateHoliday } from "../../api/timekeeping-config-query";
import { requestErrorText } from "../../components/requests/request-model";

type HolidayDialogProps = { schoolId: string; schoolName: string; year: number; onClose: () => void };

/** New holiday for the whole tenant or only this school. A holiday in a locked month is refused (409) and the text stays here. */
export function HolidayDialog({ onClose, schoolId, schoolName, year }: HolidayDialogProps) {
  const create = useCreateHoliday();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"ALL" | "SCHOOL">("ALL");
  const [attempted, setAttempted] = useState(false);
  const dateError = attempted && !isIsoDate(date) ? "Chọn ngày hợp lệ" : undefined;
  const nameError = attempted && !name.trim() ? "Nhập tên ngày lễ" : undefined;
  const submit = () => {
    setAttempted(true);
    if (!isIsoDate(date) || !name.trim()) return;
    create.mutate(
      { date, name: name.trim(), schoolId: scope === "SCHOOL" ? schoolId : undefined },
      { onSuccess: () => { toast.success("Đã thêm ngày lễ"); onClose(); } },
    );
  };

  return (
    <ErgDialog
      actions={
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton loading={create.isPending} onClick={submit} variant="outlined">Thêm ngày lễ</ErgButton>
        </>
      }
      onClose={onClose}
      open
      title="Thêm ngày lễ"
    >
      <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
        <ErgTextField
          error={Boolean(dateError)}
          helperText={dateError}
          label="Ngày"
          onChange={(event) => setDate(event.target.value)}
          slotProps={{ htmlInput: { max: `${year}-12-31`, min: `${year}-01-01` }, inputLabel: { shrink: true } }}
          type="date"
          value={date}
        />
        <ErgTextField error={Boolean(nameError)} helperText={nameError} label="Tên ngày lễ" onChange={(event) => setName(event.target.value)} value={name} />
        <ErgSelect
          label="Áp dụng cho"
          onChange={(event) => setScope(event.target.value as "ALL" | "SCHOOL")}
          options={[{ label: "Toàn hệ thống", value: "ALL" }, { label: schoolName || "Cơ sở này", value: "SCHOOL" }]}
          value={scope}
        />
        {create.isError ? <Typography color="error" role="alert" variant="body2">{requestErrorText(create.error)}</Typography> : null}
      </Box>
    </ErgDialog>
  );
}

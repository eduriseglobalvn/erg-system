import { useForm, useStore } from "@tanstack/react-form";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { useSaveShift } from "../../api/timekeeping-config-query";
import type { ShiftConfig } from "../../api/timekeeping-types";
import { ChipChoice } from "../../components/requests/chip-choice";
import { requestErrorText } from "../../components/requests/request-model";
import { formToShiftCommand, shiftToForm, validateShift, WEEKDAYS } from "./shift-model";

type ShiftDialogProps = { schoolId: string; shift?: ShiftConfig; onClose: () => void };

const UNITS = [
  { value: "1", label: "1 công" },
  { value: "0.5", label: "0,5 công" },
] as const;

/** Add / edit a shift. The server's 409 (overlap with another shift of the same weekday) and 400 texts show inside the dialog. */
export function ShiftDialog({ onClose, schoolId, shift }: ShiftDialogProps) {
  const form = useForm({ defaultValues: shiftToForm(shift) });
  const values = useStore(form.store, (state) => state.values);
  const save = useSaveShift();
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateShift(values) : {};
  const time = (key: "start" | "end", label: string) => (
    <ErgTextField
      error={Boolean(errors[key])}
      helperText={errors[key]}
      label={label}
      onChange={(event) => form.setFieldValue(key, event.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
      type="time"
      value={values[key]}
    />
  );
  const submit = () => {
    setAttempted(true);
    if (Object.keys(validateShift(values)).length) return;
    save.mutate({ id: shift?.id, body: formToShiftCommand(values, schoolId) }, { onSuccess: () => { toast.success("Đã lưu ca làm việc"); onClose(); } });
  };

  return (
    <ErgDialog
      actions={
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton loading={save.isPending} onClick={submit} variant="outlined">Lưu ca</ErgButton>
        </>
      }
      onClose={onClose}
      open
      title={shift ? "Sửa ca làm việc" : "Thêm ca làm việc"}
    >
      <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
        <ErgTextField error={Boolean(errors.name)} helperText={errors.name} label="Tên ca" onChange={(event) => form.setFieldValue("name", event.target.value)} value={values.name} />
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
          {time("start", "Giờ vào ca")}
          {time("end", "Giờ tan ca")}
        </Box>
        <ChipChoice label="Công của ca" onChange={(next) => form.setFieldValue("workUnits", next)} options={UNITS} value={values.workUnits} />
        <Box>
          <Typography id="shift-days" sx={{ mb: 0.75 }} variant="subtitle2">Áp dụng các ngày</Typography>
          <Box aria-labelledby="shift-days" role="group" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {WEEKDAYS.map(({ label, value }) => {
              const on = values.weekdays.includes(value);
              return (
                <Chip
                  aria-checked={on}
                  clickable
                  color={on ? "primary" : "default"}
                  key={value}
                  label={label}
                  onClick={() => form.setFieldValue("weekdays", on ? values.weekdays.filter((d) => d !== value) : [...values.weekdays, value].sort((a, b) => a - b))}
                  role="checkbox"
                  variant={on ? "filled" : "outlined"}
                />
              );
            })}
          </Box>
          {errors.weekdays ? <Typography color="error" variant="caption">{errors.weekdays}</Typography> : null}
        </Box>
        <FormControlLabel
          control={<Switch checked={values.active} onChange={(_, checked) => form.setFieldValue("active", checked)} />}
          label="Đang áp dụng"
        />
        {save.isError ? <Typography color="error" role="alert" variant="body2">{requestErrorText(save.error)}</Typography> : null}
      </Box>
    </ErgDialog>
  );
}

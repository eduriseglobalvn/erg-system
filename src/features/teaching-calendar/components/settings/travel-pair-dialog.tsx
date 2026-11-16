import { useState } from "react";
import Stack from "@mui/material/Stack";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgSelect, ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { TRAVEL_MINUTES_MAX } from "./use-travel-settings";

export type TravelPair = { minutes: number; schoolAId: string; schoolBId: string };

type Props = {
  /** Có giá trị = sửa cặp đã có (hai trường khóa). */
  initial?: TravelPair;
  onClose: () => void;
  onSave: (pair: TravelPair) => void;
  pending: boolean;
  schools: ReadonlyArray<{ schoolId: string; schoolName: string }>;
};

/** Dialog «Thêm cặp trường» / «Sửa»: hai select trường + số phút 0–240. */
export function TravelPairDialog({ initial, onClose, onSave, pending, schools }: Props) {
  const [a, setA] = useState(initial?.schoolAId ?? "");
  const [b, setB] = useState(initial?.schoolBId ?? "");
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 50));
  const value = Number(minutes);
  const minutesOk = minutes.trim() !== "" && Number.isInteger(value) && value >= 0 && value <= TRAVEL_MINUTES_MAX;
  const options = schools.map((school) => ({ label: school.schoolName, value: school.schoolId }));
  const valid = Boolean(a && b && a !== b && minutesOk);
  return (
    <ErgDialog
      actions={(
        <>
          <ErgButton onClick={onClose} variant="text">Huỷ</ErgButton>
          <ErgButton disabled={!valid} loading={pending} onClick={() => onSave({ minutes: value, schoolAId: a, schoolBId: b })} variant="contained">Lưu</ErgButton>
        </>
      )}
      onClose={onClose} open title={initial ? "Sửa cặp trường" : "Thêm cặp trường"}
    >
      <Stack spacing={2}>
        <ErgSelect disabled={Boolean(initial)} label="Trường A" onChange={(event) => setA(event.target.value)} options={options} value={a} />
        <ErgSelect disabled={Boolean(initial)} label="Trường B" onChange={(event) => setB(event.target.value)} options={options.filter((option) => option.value !== a)} value={b} />
        <ErgTextField
          error={!minutesOk} helperText={`Từ 0 đến ${TRAVEL_MINUTES_MAX} phút`} label="Thời gian tối thiểu (phút)" onChange={(event) => setMinutes(event.target.value)}
          slotProps={{ htmlInput: { inputMode: "numeric", max: TRAVEL_MINUTES_MAX, min: 0 } }} type="number" value={minutes}
        />
      </Stack>
    </ErgDialog>
  );
}

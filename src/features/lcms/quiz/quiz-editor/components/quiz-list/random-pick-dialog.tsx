import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";

export type RandomPickCandidate = { key: string; ready: boolean };

/** Picks `count` of the candidates at random (Fisher–Yates), the not-ready ones left out when asked. */
export function pickRandom(candidates: readonly RandomPickCandidate[], count: number, skipNotReady: boolean, random = Math.random) {
  const pool = candidates.filter((candidate) => !skipNotReady || candidate.ready).map((candidate) => candidate.key);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other]!, pool[index]!];
  }
  return pool.slice(0, count);
}

/** "Bốc ngẫu nhiên…": ticks a random set of the questions on screen, replacing the current selection. */
export function RandomPickDialog({ candidates, onClose, onPick }: {
  candidates: readonly RandomPickCandidate[];
  onClose: () => void;
  onPick: (keys: string[]) => void;
}) {
  const [skipNotReady, setSkipNotReady] = useState(true);
  const available = candidates.filter((candidate) => !skipNotReady || candidate.ready).length;
  const [count, setCount] = useState(() => Math.min(10, candidates.length));
  const valid = Number.isInteger(count) && count >= 1 && count <= available;

  return (
    <ErgDialog
      open
      title="Bốc ngẫu nhiên"
      description="Chọn ngẫu nhiên trong các câu đang hiện ở bảng. Câu bốc được sẽ thay cho các câu đang chọn."
      onClose={onClose}
      actions={(
        <>
          <Button onClick={onClose} variant="text">Huỷ</Button>
          <ErgButton disabled={!valid} onClick={() => onPick(pickRandom(candidates, count, skipNotReady))} variant="contained">
            {valid ? `Bốc ${count} câu` : "Bốc"}
          </ErgButton>
        </>
      )}
    >
      <Stack spacing={1.5} sx={{ pt: 1 }}>
        <ErgTextField
          error={!valid}
          helperText={`Có ${available} câu có thể bốc.`}
          label="Số câu"
          onChange={(event) => setCount(Number(event.target.value))}
          slotProps={{ htmlInput: { max: available, min: 1, step: 1 } }}
          type="number"
          value={Number.isFinite(count) ? count : ""}
        />
        <FormControlLabel
          control={<Checkbox checked={skipNotReady} onChange={(event) => setSkipNotReady(event.target.checked)} />}
          label={<Typography variant="body2">Bỏ qua câu chưa sẵn sàng</Typography>}
        />
      </Stack>
    </ErgDialog>
  );
}

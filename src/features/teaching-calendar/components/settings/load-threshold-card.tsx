import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { LOAD_ERROR, validateLoad } from "./use-travel-settings";

type Props = { loadMax: number; loadWarn: number; onSave: (values: { loadMax: number; loadWarn: number }) => void; pending: boolean; serverError?: boolean };

/** Card «Ngưỡng tải tuần» (6.12): hai ô số, «Lưu» là nút outlined (nút contained duy nhất của trang là «+ Thêm cặp trường»). */
export function LoadThresholdCard({ loadMax, loadWarn, onSave, pending, serverError }: Props) {
  const [warn, setWarn] = useState(String(loadWarn));
  const [max, setMax] = useState(String(loadMax));
  const error = validateLoad(Number(warn), Number(max)) ?? (serverError ? LOAD_ERROR : null);
  const changed = Number(warn) !== loadWarn || Number(max) !== loadMax;
  return (
    <Stack spacing={1.5} sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px`, p: 3 }}>
      <Typography component="h2" sx={{ typography: "subtitle1" }}>Ngưỡng tải tuần</Typography>
      <Stack direction={{ sm: "row", xs: "column" }} spacing={2}>
        <ErgTextField error={Boolean(error)} label="Cảnh báo khi quá" onChange={(event) => setWarn(event.target.value)} slotProps={{ input: { endAdornment: <Typography sx={{ color: "text.secondary", typography: "caption", whiteSpace: "nowrap" }}>tiết/tuần</Typography> }, htmlInput: { min: 0 } }} type="number" value={warn} />
        <ErgTextField error={Boolean(error)} label="Tối đa" onChange={(event) => setMax(event.target.value)} slotProps={{ input: { endAdornment: <Typography sx={{ color: "text.secondary", typography: "caption", whiteSpace: "nowrap" }}>tiết/tuần</Typography> }, htmlInput: { min: 0 } }} type="number" value={max} />
      </Stack>
      {error ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>{error}</Typography> : <Typography sx={{ color: "text.secondary", typography: "caption" }}>Áp dụng cho mọi giáo viên. Tiết trợ giảng được tính.</Typography>}
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <ErgButton disabled={Boolean(error) || !changed} loading={pending} onClick={() => onSave({ loadMax: Number(max), loadWarn: Number(warn) })} variant="outlined">Lưu</ErgButton>
      </Stack>
    </Stack>
  );
}

import type { ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { mapsUrl, RADIUS_MAX, RADIUS_MIN, validateSite, type SiteErrors, type SiteForm } from "./settings-model";

type SiteEditorProps = {
  value: SiteForm;
  onChange: (patch: Partial<SiteForm>) => void;
  /** Errors are hidden until the admin has changed something, so a fresh "Thêm" form is not red. */
  showErrors: boolean;
  onDelete?: () => void;
};

const clampRadius = (text: string) => Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, Number(text) || RADIUS_MIN));

/** Centre and radius of one punch site. Saving is the page header's "Lưu thay đổi". */
export function SiteEditor({ onChange, onDelete, showErrors, value }: SiteEditorProps) {
  const errors: SiteErrors = showErrors ? validateSite(value) : {};
  const hasPoint = !validateSite(value).lat && !validateSite(value).lng;
  const field = (key: keyof SiteForm, label: string) => ({
    label,
    value: value[key],
    error: Boolean(errors[key]),
    helperText: errors[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) => onChange({ [key]: event.target.value }),
  });

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <ErgTextField {...field("name", "Tên địa điểm")} required />
      <ErgTextField {...field("address", "Địa chỉ")} />
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <ErgTextField {...field("lat", "Vĩ độ")} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
        <ErgTextField {...field("lng", "Kinh độ")} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
      </Box>
      {hasPoint ? (
        <Link href={mapsUrl(value)} rel="noopener noreferrer" target="_blank" variant="body2">
          Mở trên Google Maps
        </Link>
      ) : null}
      <Box>
        <Typography id="site-radius-label" variant="subtitle2">Bán kính cho phép chấm công</Typography>
        <Box sx={{ alignItems: "center", display: "grid", gap: 2, gridTemplateColumns: "1fr 120px" }}>
          <Slider
            aria-labelledby="site-radius-label"
            max={RADIUS_MAX}
            min={RADIUS_MIN}
            onChange={(_, next) => onChange({ radiusM: String(next) })}
            step={10}
            value={clampRadius(value.radiusM)}
          />
          <ErgTextField
            {...field("radiusM", "Mét")}
            slotProps={{ htmlInput: { "aria-label": "Bán kính (m)", inputMode: "numeric" } }}
          />
        </Box>
        <Typography color="text.secondary" variant="caption">Khuyến nghị 100–150 m để GPS trong nhà vẫn đạt.</Typography>
      </Box>
      {onDelete ? (
        <Box>
          <ErgButton color="error" onClick={onDelete} variant="outlined">Xoá địa điểm</ErgButton>
        </Box>
      ) : null}
    </Box>
  );
}

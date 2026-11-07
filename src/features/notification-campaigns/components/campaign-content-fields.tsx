import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgTextField } from "@/components/erg-mui";

import type { CampaignPriority } from "../api/campaign-types";
import { BODY_MAX, type CampaignFormErrors, formatCountVi, TITLE_MAX } from "../model/campaign-form-schema";

const PRIORITIES: Array<[CampaignPriority, string]> = [["INFO", "Thông tin"], ["IMPORTANT", "Quan trọng"], ["URGENT", "Khẩn"]];

type Values = { body: string; priority: CampaignPriority; title: string };
type Props = {
  /** Errors to show now (already filtered to touched fields). */
  errors: Pick<CampaignFormErrors, "body" | "title">;
  onBlur: (field: "body" | "title") => void;
  onChange: (patch: Partial<Values>) => void;
  values: Values;
};

/** Mức độ, Tiêu đề, Nội dung (with the "142 / 2.000 ký tự" counter). */
export function CampaignContentFields({ errors, onBlur, onChange, values }: Props) {
  return (
    <Stack sx={{ gap: 2.5 }}>
      <Stack sx={{ gap: 1 }}>
        <Typography component="h2" id="campaign-priority" variant="subtitle2">Mức độ</Typography>
        <ToggleButtonGroup
          aria-labelledby="campaign-priority"
          color="primary"
          exclusive
          onChange={(_, next: CampaignPriority | null) => next && onChange({ priority: next })}
          size="small"
          value={values.priority}
        >
          {PRIORITIES.map(([value, label]) => <ToggleButton key={value} value={value}>{label}</ToggleButton>)}
        </ToggleButtonGroup>
        {values.priority === "URGENT" ? (
          <Typography color="text.secondary" variant="caption">
            “Khẩn” ghim đầu Hộp thư và gửi đẩy kể cả khi người nhận tắt thông báo thường.
          </Typography>
        ) : null}
      </Stack>
      <ErgTextField
        error={Boolean(errors.title)}
        helperText={errors.title ?? `${values.title.length} / ${TITLE_MAX} ký tự`}
        label="Tiêu đề"
        onBlur={() => onBlur("title")}
        onChange={(event) => onChange({ title: event.target.value })}
        slotProps={{ htmlInput: { "aria-required": true } }}
        value={values.title}
      />
      <Stack sx={{ gap: 0.5 }}>
        <ErgTextField
          error={Boolean(errors.body)}
          helperText={errors.body}
          label="Nội dung"
          minRows={5}
          multiline
          onBlur={() => onBlur("body")}
          onChange={(event) => onChange({ body: event.target.value })}
          slotProps={{ htmlInput: { "aria-required": true } }}
          value={values.body}
        />
        <Typography color={values.body.length > BODY_MAX ? "error" : "text.secondary"} sx={{ textAlign: "right" }} variant="caption">
          {`${formatCountVi(values.body.length)} / ${formatCountVi(BODY_MAX)} ký tự`}
        </Typography>
      </Stack>
    </Stack>
  );
}

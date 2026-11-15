import { useState, type KeyboardEvent } from "react";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { BATCH_LABEL_MAX } from "./use-rename-batch";

type Props = {
  anchorEl: HTMLElement | null;
  error: string | null;
  label: string;
  onCancel: () => void;
  onChange: () => void;
  onSave: (label: string) => void;
  pending: boolean;
};

/** Popover «Đổi tên đợt» (6.15): Enter luu, Esc huy; «Lưu tên» khoa khi chua doi, rong, qua 80 ky tu hoac dang loi. */
export function BatchRenamePopover(props: Props) {
  const { anchorEl, onCancel } = props;
  return (
    <Popover anchorEl={anchorEl} onClose={onCancel} open={Boolean(anchorEl)} slotProps={{ paper: { sx: { borderRadius: "14px", p: 2, width: 360 } } }}>
      <RenameForm {...props} />
    </Popover>
  );
}

/** Chi mount khi popover mo nen `value` tu lay lai `label` moi lan mo. */
function RenameForm({ error, label, onCancel, onChange, onSave, pending }: Props) {
  const [value, setValue] = useState(label);
  const trimmed = value.trim();
  const canSave = Boolean(trimmed) && trimmed !== label && value.length <= BATCH_LABEL_MAX && !error && !pending;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && canSave) { event.preventDefault(); onSave(value); }
    if (event.key === "Escape") onCancel();
  };

  return (
      <Stack onKeyDown={onKeyDown} spacing={1.25}>
        <Typography sx={{ typography: "subtitle1" }}>Đổi tên đợt</Typography>
        <ErgTextField
          autoFocus
          error={Boolean(error)}
          label="Tên đợt"
          onChange={(event) => { setValue(event.target.value); onChange(); }}
          onFocus={(event) => event.target.select()}
          slotProps={{ htmlInput: { "aria-invalid": Boolean(error) }, input: { endAdornment: <Typography sx={{ color: "text.secondary", typography: "caption" }}>{value.length}/{BATCH_LABEL_MAX}</Typography> } }}
          value={value}
        />
        {error ? <Typography color="error" role="alert" sx={{ typography: "caption" }}>{error}</Typography> : (
          <Typography sx={{ color: "text.secondary", typography: "caption" }}>
            Tên chỉ để giáo vụ nhận ra đợt trong danh sách và bảng tổng. Giáo viên không thấy tên này, đổi tên không cần xuất bản lại.
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <ErgButton onClick={onCancel} variant="text">Huỷ</ErgButton>
          <ErgButton disabled={!canSave} loading={pending} onClick={() => onSave(value)} variant="outlined">Lưu tên</ErgButton>
        </Stack>
      </Stack>
  );
}

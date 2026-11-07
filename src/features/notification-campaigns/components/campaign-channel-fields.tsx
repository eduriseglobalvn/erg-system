import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

type Props = {
  onChange: (patch: { pushEnabled?: boolean; requireReadAck?: boolean }) => void;
  pushEnabled: boolean;
  requireReadAck: boolean;
};

function ChannelRow({ checked, disabled, hint, label, onChange }: { checked: boolean; disabled?: boolean; hint: string; label: string; onChange?: (on: boolean) => void }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 2, px: 2, py: 1.25, "& + &": { borderTop: 1, borderColor: "divider" } }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography color="text.secondary" variant="caption">{hint}</Typography>
      </Box>
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={(_, on) => onChange?.(on)}
        slotProps={{ input: { "aria-label": label, role: "switch" } }}
      />
    </Box>
  );
}

/** Kênh gửi: in-app inbox (always on), web push, read acknowledgement. No email channel in this phase. */
export function CampaignChannelFields({ onChange, pushEnabled, requireReadAck }: Props) {
  return (
    <Stack component="section" aria-labelledby="campaign-channels" sx={{ gap: 1 }}>
      <Typography component="h2" id="campaign-channels" variant="subtitle2">Kênh gửi</Typography>
      <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${ergEnterpriseTokens.radius.card}px` }}>
        <ChannelRow checked disabled hint="Luôn bật" label="Hộp thư trong ứng dụng" />
        <ChannelRow
          checked={pushEnabled}
          hint="Đến các thiết bị đã cho phép nhận thông báo"
          label="Thông báo đẩy (PWA)"
          onChange={(on) => onChange({ pushEnabled: on })}
        />
        <ChannelRow
          checked={requireReadAck}
          hint="Hiện nút “Đã nắm thông tin”, theo dõi ai chưa xác nhận"
          label="Yêu cầu xác nhận đã đọc"
          onChange={(on) => onChange({ requireReadAck: on })}
        />
      </Box>
    </Stack>
  );
}

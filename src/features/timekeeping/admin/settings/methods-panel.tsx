import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ChipChoice } from "../../components/requests/chip-choice";

type MethodsPanelProps = {
  requireFace: boolean;
  allowOutside: boolean;
  onChange: (patch: { requireFace?: boolean; allowOutside?: boolean }) => void;
};

function Row({ control, hint, title }: { title: string; hint: string; control?: ReactNode }) {
  return (
    <Box sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "flex", gap: 2, justifyContent: "space-between", py: 1.25 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography color="text.secondary" variant="body2">{hint}</Typography>
      </Box>
      {control}
    </Box>
  );
}

const CONDITION = [
  { value: "FACE", label: "GPS + khuôn mặt" },
  { value: "GPS", label: "Chỉ GPS" },
] as const;

/** Punch methods. The flags are the policy's `requireFace` / `allowOutside`; "Điều kiện hợp lệ" is derived from `requireFace`. */
export function MethodsPanel({ allowOutside, onChange, requireFace }: MethodsPanelProps) {
  return (
    <Box>
      <Row hint="Chặn vị trí giả lập trên Android" title="GPS trong bán kính" />
      <Row hint="Chấm công được bằng Wi-Fi hoặc dữ liệu di động" title="Không ràng buộc mạng" />
      <Row
        control={<Switch checked={requireFace} onChange={(_, checked) => onChange({ requireFace: checked })} slotProps={{ input: { "aria-label": "Khuôn mặt (selfie)" } }} />}
        hint="Ảnh lưu 60 ngày rồi tự xoá · cần nhân sự đồng ý"
        title="Khuôn mặt (selfie)"
      />
      <Row
        control={<Switch checked={allowOutside} onChange={(_, checked) => onChange({ allowOutside: checked })} slotProps={{ input: { "aria-label": "Cho chấm ngoài vùng kèm lý do" } }} />}
        hint="Chấm ngoài bán kính được ghi nhận kèm lý do và chờ duyệt"
        title="Cho chấm ngoài vùng kèm lý do"
      />
      <Box sx={{ pt: 1.5 }}>
        <ChipChoice
          label="Điều kiện hợp lệ"
          onChange={(next) => onChange({ requireFace: next === "FACE" })}
          options={CONDITION}
          value={requireFace ? "FACE" : "GPS"}
        />
      </Box>
    </Box>
  );
}

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";

/** Shown instead of "Giải trình" when that day already has an explanation waiting for approval (a second one would be refused as an overlap). */
export function PendingExplanationNote({ onOpen }: { onOpen: () => void }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
      <Typography variant="body2">Đã gửi giải trình, chờ duyệt</Typography>
      <ErgButton onClick={onOpen} size="small" variant="text">Xem đơn</ErgButton>
    </Box>
  );
}

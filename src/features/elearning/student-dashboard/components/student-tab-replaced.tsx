import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** Shown in a tab that another tab of the same student account took over. */
export function StudentTabReplaced({ onUseHere }: { onUseHere: () => void }) {
  return (
    <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "grid", minHeight: "100vh", p: 3, placeItems: "center" }}>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: `${t.radius.card}px`,
          maxWidth: 440,
          p: 3,
          textAlign: "center",
          width: "100%",
        }}
      >
        <Typography component="h1" variant="h6">Tài khoản đang mở ở tab khác</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
          Mỗi tài khoản học sinh chỉ dùng được một tab. Bài đang làm đã được lưu, bạn có thể làm tiếp ở tab mới.
        </Typography>
        <ErgButton onClick={onUseHere} sx={{ mt: 2.5 }}>Dùng ở tab này</ErgButton>
      </Box>
    </Box>
  );
}

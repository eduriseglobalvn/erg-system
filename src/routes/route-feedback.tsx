import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";

export function RoutePendingSkeleton() {
  return (
    <Box
      aria-label="Đang tải trang"
      role="status"
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        minHeight: "100svh",
        px: 3,
      }}
    >
      <Skeleton height={8} sx={{ borderRadius: 999, transform: "none" }} variant="rounded" width={128} />
    </Box>
  );
}

export function RouteErrorBoundary(_props: ErrorComponentProps) {
  const router = useRouter();

  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        minHeight: "100svh",
        p: 3,
      }}
    >
      <Paper
        role="alert"
        sx={{ border: "1px solid", borderColor: "divider", display: "grid", gap: 1.5, maxWidth: 480, p: 3 }}
        variant="outlined"
      >
        <Typography sx={{ fontWeight: 800 }} variant="h6">
          Không thể tải trang
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Dữ liệu hoặc thành phần của trang chưa tải được. Vui lòng thử lại.
        </Typography>
        <Box>
          <Button
            onClick={() => void router.invalidate()}
            startIcon={<ReplayRoundedIcon />}
            variant="contained"
          >
            Thử lại
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

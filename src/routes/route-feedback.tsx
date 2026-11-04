import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, useState } from "react";

const topBarGrow = keyframes`from { width: 0; } to { width: 92%; }`;

// Boot -> auth -> Suspense -> route pending each mount a new bar; share one start
// time so the bar keeps growing instead of jumping back to 0.
const CONTINUE_WITHIN_MS = 300;
const barClock = { start: 0 /* index.html boot bar starts at navigation */, hiddenAt: null as number | null, mounted: 0 };

export function pendingBarOffsetMs(now: number, clock = barClock) {
  if (clock.mounted === 0 && clock.hiddenAt !== null && now - clock.hiddenAt > CONTINUE_WITHIN_MS) clock.start = now;
  return now - clock.start;
}

export function releasePendingBar(now: number, clock = barClock) {
  clock.mounted -= 1;
  if (clock.mounted === 0) clock.hiddenAt = now;
}

/** Route/chunk loading: thin top bar only, so the page never flashes to a full-screen loader. */
export function RoutePendingSkeleton() {
  const [offsetMs] = useState(() => pendingBarOffsetMs(performance.now()));
  useEffect(() => {
    barClock.mounted += 1;
    return () => releasePendingBar(performance.now());
  }, []);

  return (
    <Box aria-label="Đang tải trang" role="status">
      <Box
        sx={{
          animation: `${topBarGrow} 8s cubic-bezier(.1,.7,.2,1) -${Math.round(offsetMs)}ms forwards`,
          bgcolor: "#696CFF",
          height: 3,
          left: 0,
          position: "fixed",
          top: 0,
          zIndex: (theme) => theme.zIndex.tooltip + 1,
        }}
      />
    </Box>
  );
}

/** Data/section loading inside an already-rendered shell. */
export function ContentPendingSkeleton() {
  return (
    <Stack aria-label="Đang tải nội dung" role="status" spacing={1.5} sx={{ p: 2.5 }}>
      <Skeleton height={36} variant="rounded" width="35%" />
      <Skeleton height={180} variant="rounded" />
      <Skeleton height={180} variant="rounded" />
    </Stack>
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

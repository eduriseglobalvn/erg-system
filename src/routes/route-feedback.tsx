import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { reloadFresh } from "@/platform/pwa/reload-fresh";
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";

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
          bgcolor: "#0071E3",
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

const CHUNK_RELOAD_KEY = "erg-chunk-reload";
const CHUNK_ERROR_PATTERN = /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i;

export function isChunkLoadError(error: unknown) {
  if (!error) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  return CHUNK_ERROR_PATTERN.test(`${typeof name === "string" ? name : ""} ${typeof message === "string" ? message : String(error)}`);
}

// Indirection so tests can observe the hard reload (jsdom's location.reload is not spy-able).
export const pageReload = { run: () => void reloadFresh() };

function readReloadGuard() {
  try {
    return sessionStorage.getItem(CHUNK_RELOAD_KEY) !== null;
  } catch {
    return true; // storage unavailable: never auto-reload, avoids a loop
  }
}

function setReloadGuard() {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** A stale shell after a deploy: reload once automatically; the button always reloads. */
function useChunkReload(error: unknown) {
  const chunk = isChunkLoadError(error);
  useEffect(() => {
    if (chunk && !readReloadGuard()) {
      setReloadGuard();
      pageReload.run();
    }
  }, [chunk]);
  return chunk;
}

function ErrorCard({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel: string; onAction: () => void }) {
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
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {body}
        </Typography>
        <Box>
          <Button onClick={onAction} startIcon={<ReplayRoundedIcon />} variant="contained">
            {actionLabel}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export function RouteErrorBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();
  const chunk = useChunkReload(error);

  if (chunk) {
    return (
      <ErrorCard
        actionLabel="Tải lại trang"
        body="Ứng dụng vừa được cập nhật phiên bản mới. Vui lòng tải lại trang để tiếp tục."
        onAction={() => {
          setReloadGuard();
          pageReload.run();
        }}
        title="Có phiên bản mới"
      />
    );
  }
  return (
    <ErrorCard
      actionLabel="Thử lại"
      body="Dữ liệu hoặc thành phần của trang chưa tải được. Vui lòng thử lại."
      onAction={() => void router.invalidate()}
      title="Không thể tải trang"
    />
  );
}

/** Outermost safety net (outside RouterProvider): render errors the router cannot catch. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: unknown; failed: boolean }> {
  state = { error: null as unknown, failed: false };

  static getDerivedStateFromError(error: unknown) {
    return { error, failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("App render error", error, info.componentStack);
    if (isChunkLoadError(error) && !readReloadGuard()) {
      setReloadGuard();
      pageReload.run();
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ErrorCard
        actionLabel="Tải lại trang"
        body="Đã xảy ra lỗi không mong muốn. Vui lòng tải lại trang; nếu lỗi còn lặp lại, hãy liên hệ quản trị viên."
        onAction={() => pageReload.run()}
        title="Ứng dụng gặp sự cố"
      />
    );
  }
}

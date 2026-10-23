import { useEffect, useMemo, useState } from "react";
import Download from "@mui/icons-material/Download";
import DesktopWindows from "@mui/icons-material/DesktopWindows";
import Apple from "@mui/icons-material/Apple";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { loadDesktopReleaseManifest } from "@/features/desktop-release/api/desktop-release-api";
import type { DesktopReleaseArtifact, DesktopReleaseManifest } from "@/features/desktop-release/types/desktop-release-types";

export type DesktopReleaseWorkspace = "TEACHER" | "STUDENT";

export function DesktopReleaseDownloadPage({ workspace }: { workspace: DesktopReleaseWorkspace }) {
  const [manifest, setManifest] = useState<DesktopReleaseManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void loadDesktopReleaseManifest()
      .then((next) => {
        if (mounted) setManifest(next);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : "Không thể tải danh sách bản desktop.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const artifacts = useMemo(
    () =>
      [...(manifest?.artifacts ?? [])].sort((left, right) => {
        if (left.platform !== right.platform) return left.platform === "windows" ? -1 : 1;
        return left.architecture.localeCompare(right.architecture);
      }),
    [manifest?.artifacts],
  );

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, md: 6 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 900, letterSpacing: 1.2 }}>
              ERG · {workspace === "TEACHER" ? "Teacher" : "Student"} workspace
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -1 }}>
              Tải ERG LMS Desktop
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 780 }}>
              Ứng dụng dùng cùng giao diện và tài khoản với web/PWA. Desktop updater chỉ hoạt động trong bản Tauri đã ký; trình duyệt luôn tải installer từ release manifest đã kiểm tra.
            </Typography>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {!manifest && !error ? <LoadingReleaseCards /> : null}
          {manifest ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" sx={{ fontWeight: 850 }}>Kênh {manifest.channel}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manifest.currentVersion ? `Phiên bản hiện tại: ${manifest.currentVersion} · ` : ""}
                      Phát hành {formatDate(manifest.generatedAt)}
                    </Typography>
                  </Stack>
                  <Chip label={`${artifacts.length} gói cài đặt`} color="primary" variant="outlined" />
                </Stack>
              </Paper>
              {artifacts.map((artifact) => <ReleaseArtifactCard artifact={artifact} key={`${artifact.platform}-${artifact.architecture}-${artifact.version}`} />)}
              <Alert severity="info">
                Chỉ cài file tải từ domain ERG đã xác thực. Có thể đối chiếu SHA-256 trước khi phân phối nội bộ; chữ ký updater được Tauri kiểm tra trong ứng dụng.
              </Alert>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

function ReleaseArtifactCard({ artifact }: { artifact: DesktopReleaseArtifact }) {
  const isWindows = artifact.platform === "windows";
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          {isWindows ? <DesktopWindows color="primary" /> : <Apple color="primary" />}
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 850 }}>{isWindows ? "Windows" : "macOS"} · {artifact.architecture}</Typography>
            <Typography variant="body2" color="text.secondary">v{artifact.version} · {artifact.installer.toUpperCase()} · {formatBytes(artifact.sizeBytes)}</Typography>
            {artifact.notes ? <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{artifact.notes}</Typography> : null}
          </Stack>
        </Stack>
        <Button
          component="a"
          href={artifact.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          startIcon={<Download />}
          sx={{ borderRadius: 1.5, fontWeight: 800, flexShrink: 0 }}
        >
          Tải xuống
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontFamily: "monospace", overflowWrap: "anywhere" }}>
        SHA-256: {artifact.sha256.replace(/^sha256:/, "")}
      </Typography>
    </Paper>
  );
}

function LoadingReleaseCards() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={96} />
      <Skeleton variant="rounded" height={120} />
      <Skeleton variant="rounded" height={120} />
    </Stack>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value));
}

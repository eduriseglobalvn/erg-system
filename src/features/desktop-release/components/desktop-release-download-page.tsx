import { useCallback, useEffect, useMemo, useState } from "react";
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

import { formatDateVi } from "@/domain/formatters/format-date";
import { loadDesktopReleaseManifest } from "@/features/desktop-release/api/desktop-release-api";
import type { DesktopReleaseArtifact, DesktopReleaseManifest } from "@/features/desktop-release/types/desktop-release-types";

export type DesktopReleaseWorkspace = "TEACHER" | "STUDENT";

export function DesktopReleaseDownloadPage({ workspace }: { workspace: DesktopReleaseWorkspace }) {
  const [manifest, setManifest] = useState<DesktopReleaseManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    void loadDesktopReleaseManifest()
      .then(setManifest)
      .catch(() => setError("Không thể tải danh sách bản cài đặt. Vui lòng kiểm tra kết nối mạng và thử lại."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
            <Typography variant="overline" color="primary" sx={{ fontWeight: 600, letterSpacing: 1.2 }}>
              ERG · {workspace === "TEACHER" ? "Dành cho giáo viên" : "Dành cho học viên"}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: -1 }}>
              Tải ứng dụng ERG cho Windows và macOS
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 780 }}>
              Ứng dụng dùng cùng giao diện và tài khoản với bản web, giúp làm bài thi ổn định hơn ngay cả khi mạng yếu. Chọn bản phù hợp với máy của bạn bên dưới.
            </Typography>
          </Stack>

          {error ? <Alert severity="error" action={<Button color="inherit" size="small" variant="text" onClick={load}>Thử lại</Button>}>{error}</Alert> : null}
          {!manifest && !error ? <LoadingReleaseCards /> : null}
          {manifest ? (
            <Stack spacing={2}>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                  <Stack spacing={0.5}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Bản cài đặt mới nhất</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {manifest.currentVersion ? `Phiên bản hiện tại: ${manifest.currentVersion} · ` : ""}
                      Phát hành {formatDateVi(manifest.generatedAt)}
                    </Typography>
                  </Stack>
                  <Chip label={`${artifacts.length} gói cài đặt`} color="primary" variant="outlined" />
                </Stack>
              </Paper>
              {artifacts.map((artifact, index) => <ReleaseArtifactCard artifact={artifact} primary={index === 0} key={`${artifact.platform}-${artifact.architecture}-${artifact.version}`} />)}
              <Alert severity="info">
                Chỉ cài tệp tải từ trang chính thức của ERG. Nhà trường có thể đối chiếu mã SHA-256 bên dưới trước khi cài cho nhiều máy.
              </Alert>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}

function ReleaseArtifactCard({ artifact, primary }: { artifact: DesktopReleaseArtifact; primary: boolean }) {
  const isWindows = artifact.platform === "windows";
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          {isWindows ? <DesktopWindows color="primary" /> : <Apple color="primary" />}
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>{isWindows ? "Windows" : "macOS"} · {artifact.architecture}</Typography>
            <Typography variant="body2" color="text.secondary">v{artifact.version} · {artifact.installer.toUpperCase()} · {formatBytes(artifact.sizeBytes)}</Typography>
            {artifact.notes ? <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{artifact.notes}</Typography> : null}
          </Stack>
        </Stack>
        <Button
          component="a"
          href={artifact.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant={primary ? "contained" : "outlined"}
          startIcon={<Download />}
          sx={{ flexShrink: 0, minHeight: 44 }}
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

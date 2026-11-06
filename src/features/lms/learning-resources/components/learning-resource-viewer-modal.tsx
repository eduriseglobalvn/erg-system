import { lazy, Suspense } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AudioFileOutlinedIcon from "@mui/icons-material/AudioFileOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui";
import type {
  LearningResourceFileType,
  LearningResourceResource,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { LearningStandardPlayerPanel } from "@/features/elearning/content-player/learning-standard-player-panel";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";

type PaletteTone = "primary" | "success" | "warning" | "error" | "info";

const formatBadgeTones: Partial<Record<LearningResourceFileType, PaletteTone>> = {
  PPTX: "warning",
  VIDEO: "error",
  AUDIO: "success",
  HTML5: "info",
  QUIZ: "primary",
  DOCX: "primary",
  XLSX: "success",
  IMAGE: "info",
  LINK: "primary",
};

function getFormatBadgeSx(fileType: LearningResourceFileType): SxProps<Theme> {
  const tone = formatBadgeTones[fileType];
  if (tone) return { bgcolor: `${tone}.main`, color: `${tone}.contrastText` };
  return { bgcolor: fileType === "ZIP" ? "grey.700" : "grey.500", color: "common.white" };
}

function FormatBadge({ resource }: { resource: LearningResourceResource }) {
  return (
    <Box
      component="span"
      sx={[
        { borderRadius: 1, boxShadow: 1, fontWeight: "fontWeightBold", lineHeight: 1, px: 1.25, py: 0.5, typography: "subtitle2" },
        getFormatBadgeSx(resource.fileType),
      ] as SxProps<Theme>}
    >
      {displayText(resource.formatBadge)}
    </Box>
  );
}

const PdfFullScreenPreview = lazy(() =>
  import("@/features/lms/learning-resources/components/pdf-resource-viewer").then((module) => ({
    default: module.PdfFullScreenPreview,
  })),
);

const panelSx = { bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, boxShadow: 1 } as const;

function SlideDeckHeader({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", bgcolor: "background.default", borderBottom: 1, borderColor: "divider", boxShadow: 1, color: "text.primary", height: 56, px: 2 }}
    >
      <IconButton onClick={onClose} aria-label="Quay l?i kho h?c li?u" size="small" sx={{ color: "text.secondary", ml: -0.5 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography component="h1" variant="h6" noWrap sx={{ fontWeight: "fontWeightBold" }}>
        {title}
      </Typography>
    </Stack>
  );
}

function SlideDeckPreview({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  const canEmbed = Boolean(resource.viewer.embedUrl && resource.viewer.embedUrl !== "about:blank");
  const presentationTitle = displayText(resource.viewer.presentationTitle ?? resource.viewer.title);

  if (canEmbed) {
    return (
      <Box sx={{ bgcolor: "background.paper", inset: 0, position: "fixed", zIndex: 240 }}>
        <SlideDeckHeader onClose={onClose} title={presentationTitle} />
        <Box sx={{ bgcolor: "background.default", height: "calc(100vh - 56px)", px: 1.5, py: 2 }}>
          <Box
            component="iframe"
            title={presentationTitle}
            src={resource.viewer.embedUrl ?? ""}
            sx={{ bgcolor: "common.black", border: 0, height: "100%", width: "100%" }}
            loading="lazy"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "background.paper", inset: 0, position: "fixed", zIndex: 240 }}>
      <SlideDeckHeader onClose={onClose} title={presentationTitle} />
      <Box sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", height: "calc(100vh - 56px)", justifyContent: "center", p: 4 }}>
        <Box sx={{ ...panelSx, borderStyle: "dashed", maxWidth: 576, p: 3, textAlign: "center" }}>
          <SlideshowOutlinedIcon fontSize="large" sx={{ color: "primary.main" }} />
          <Typography component="h4" variant="h4" sx={{ mt: 2 }}>
            {displayText(resource.viewer.title)}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, mt: 1.5 }}>
            Chưa có `embedUrl` cho bài giảng này. BE cần trả viewer URL hoặc token URL để FE mở trình chiếu.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

const thumbnailTones = {
  blue: "primary",
  green: "success",
  orange: "warning",
  purple: "primary",
  teal: "info",
  rose: "error",
  yellow: "warning",
  slate: null,
} satisfies Record<LearningResourceResource["thumbnailTheme"], PaletteTone | null>;

function thumbnailThemeSx(themeKey: LearningResourceResource["thumbnailTheme"]): SxProps<Theme> {
  const tone = thumbnailTones[themeKey];
  if (!tone) return { bgcolor: "background.default", borderColor: "divider", color: "text.primary" };
  return (theme) => ({
    bgcolor: alpha(theme.palette[tone].main, 0.08),
    borderColor: alpha(theme.palette[tone].main, 0.3),
    color: theme.palette[tone].dark,
  });
}

function MediaPreview({ resource }: { resource: LearningResourceResource }) {
  const isAudio = resource.launchMode === "audio_player";

  return (
    <Box sx={{ ...panelSx, p: 2.5 }}>
      <Box
        sx={[
          { alignItems: "center", border: 1, borderRadius: 1, display: "flex", justifyContent: "center", minHeight: 320 },
          thumbnailThemeSx(resource.thumbnailTheme),
        ] as SxProps<Theme>}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.9),
            borderRadius: "50%",
            boxShadow: 1,
            color: "text.primary",
            display: "flex",
            height: 56,
            justifyContent: "center",
            width: 56,
          }}
        >
          {isAudio ? <AudioFileOutlinedIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" sx={{ transform: "translateX(2px)" }} />}
        </Box>
      </Box>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mt: 2.5 }}>
        <div>
          <Typography component="h4" variant="h5">
            {displayText(resource.viewer.title)}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {displayText(resource.viewer.description)}
          </Typography>
        </div>
        {resource.viewer.duration ? (
          <Typography
            component="span"
            variant="subtitle2"
            sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 1, color: "text.secondary", fontWeight: "fontWeightBold", px: 1.5, py: 0.75 }}
          >
            {displayText(resource.viewer.duration)}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

function FallbackPreview({ resource }: { resource: LearningResourceResource }) {
  const Icon =
    resource.launchMode === "quiz_runtime"
      ? HelpOutlineOutlinedIcon
      : resource.launchMode === "download_only"
        ? FolderZipOutlinedIcon
        : LockOutlinedIcon;

  return (
    <Box sx={{ ...panelSx, p: 3, textAlign: "center" }}>
      <Box
        sx={{ alignItems: "center", bgcolor: "background.default", borderRadius: 0.75, color: "text.secondary", display: "flex", height: 48, justifyContent: "center", mx: "auto", width: 48 }}
      >
        <Icon />
      </Box>
      <Typography component="h4" variant="h4" sx={{ mt: 2 }}>
        {displayText(resource.viewer.title)}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.7, maxWidth: 576, mt: 1.5, mx: "auto" }}>
        {displayText(resource.viewer.description)}
      </Typography>
      <ErgButton variant="contained" endIcon={<ChevronRightIcon fontSize="small" />} sx={{ mt: 2.5 }}>
        {resource.launchMode === "download_only" ? "Tải gói tài liệu" : "Mở khi tích hợp BE"}
      </ErgButton>
    </Box>
  );
}

function isSlideResource(resource: LearningResourceResource) {
  return (
    resource.fileType === "PPTX" ||
    resource.resourceType === "slide" ||
    resource.launchMode === "google_slide_embed" ||
    resource.launchMode === "slide_image_proxy" ||
    resource.launchMode === "custom_slide_viewer"
  );
}

export function ResourceViewerModal({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  if (resource.launchMode === "pdf_reader" || resource.launchMode === "ebook_reader") {
    return (
      <Suspense fallback={null}>
        <PdfFullScreenPreview resource={resource} onClose={onClose} />
      </Suspense>
    );
  }

  if (isSlideResource(resource)) {
    return <SlideDeckPreview resource={resource} onClose={onClose} />;
  }

  return (
    <Box sx={(theme) => ({ bgcolor: alpha(theme.palette.common.black, 0.45), inset: 0, overflowY: "auto", p: { xs: 0, md: 2 }, position: "fixed", zIndex: 220 })}>
      <Box
        sx={{
          bgcolor: "background.default",
          border: { xs: 0, md: 1 },
          borderColor: "divider",
          borderRadius: { md: 1 },
          boxShadow: 3,
          maxWidth: { md: 1152 },
          minHeight: { xs: "100dvh", md: 0 },
          mx: { md: "auto" },
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            justifyContent: "space-between",
            position: "sticky",
            px: { xs: 1.5, md: 2 },
            py: 1.5,
            top: 0,
            zIndex: 10,
          }}
        >
          <ErgButton
            variant="text"
            color="inherit"
            onClick={onClose}
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{ color: "text.primary", fontWeight: "fontWeightBold", minHeight: { xs: 44, md: 36 }, minWidth: 0, px: 1.25, "&:hover": { color: "primary.main" } }}
          >
            Quay lại kho học liệu
          </ErgButton>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <FormatBadge resource={resource} />
            {resource.isDownloadable ? (
              <ErgButton
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon fontSize="small" />}
                sx={{ display: { xs: "none", sm: "inline-flex" }, fontWeight: "fontWeightBold", height: 36 }}
              >
                Tải xuống
              </ErgButton>
            ) : null}
            <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
        <Box sx={{ p: 2.5 }}>
          {resource.standardPackageId ? <LearningStandardPlayerPanel packageId={resource.standardPackageId} title={displayText(resource.viewer.title)} /> : null}
          {!resource.standardPackageId && (resource.launchMode === "video_player" || resource.launchMode === "audio_player") ? <MediaPreview resource={resource} /> : null}
          {!resource.standardPackageId && ["quiz_runtime", "download_only", "external", "html5_embed"].includes(resource.launchMode) ? (
            <FallbackPreview resource={resource} />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

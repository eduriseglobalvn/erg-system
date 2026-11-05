import { useEffect, useMemo, useState, type PointerEvent } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import AutoFixNormalOutlinedIcon from "@mui/icons-material/AutoFixNormalOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, useTheme, type Theme } from "@mui/material/styles";

import { ErgButton } from "@/components/erg-mui";

import type { LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";

type DrawPoint = {
  x: number;
  y: number;
};

type DrawPath = {
  points: DrawPoint[];
  color: string;
  width: number;
};

type DrawingMode = "cursor" | "pen";

function pointFromPointer(event: PointerEvent<SVGSVGElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}

function pathToD(path: DrawPath) {
  return path.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * 100} ${point.y * 100}`)
    .join(" ");
}

export function LearningResourceSlideViewerModal({
  resource,
  onClose,
}: {
  resource: LearningResourceResource;
  progressRate?: number;
  onClose: () => void;
}) {
  const viewerUrl = resource.viewer.embedUrl || resource.viewer.secureEmbedUrl || "";
  const slides = useMemo(() => resource.viewer.slides ?? [], [resource.viewer.slides]);
  const hasCustomSlides = slides.length > 0;
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("cursor");
  const [annotationsBySlide, setAnnotationsBySlide] = useState<Record<number, DrawPath[]>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const activeSlide = slides[activeSlideIndex];
  const currentPaths = annotationsBySlide[activeSlideIndex] ?? [];
  const slideCounter = hasCustomSlides ? `slide ${activeSlideIndex + 1} / ${slides.length}` : "Google Slides";
  const activeSlideTitle = activeSlide?.title || resource.title;
  const canGoPrevious = hasCustomSlides && activeSlideIndex > 0;
  const canGoNext = hasCustomSlides && activeSlideIndex < slides.length - 1;
  const thumbnailSlides = useMemo(() => slides.slice(0, 18), [slides]);
  const paceStateUpdate = usePacedStateBatch();
  const theme = useTheme();

  useEffect(() => {
    paceStateUpdate(() => {
      setActiveSlideIndex(0);
      setAnnotationsBySlide({});
      setDrawingMode("cursor");
    });
  }, [paceStateUpdate, resource.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (!hasCustomSlides) return;

      if (event.key === "ArrowRight") {
        setActiveSlideIndex((current) => Math.min(slides.length - 1, current + 1));
      }

      if (event.key === "ArrowLeft") {
        setActiveSlideIndex((current) => Math.max(0, current - 1));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasCustomSlides, onClose, slides.length]);

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (drawingMode !== "pen") return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromPointer(event);
    setAnnotationsBySlide((current) => ({
      ...current,
      [activeSlideIndex]: [
        ...(current[activeSlideIndex] ?? []),
        {
          points: [point],
          color: theme.palette.warning.main,
          width: 0.65,
        },
      ],
    }));
    setIsDrawing(true);
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!isDrawing || drawingMode !== "pen") return;

    const point = pointFromPointer(event);
    setAnnotationsBySlide((current) => {
      const paths = current[activeSlideIndex] ?? [];
      const activePath = paths[paths.length - 1];
      if (!activePath) return current;

      return {
        ...current,
        [activeSlideIndex]: [...paths.slice(0, -1), { ...activePath, points: [...activePath.points, point] }],
      };
    });
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (drawingMode === "pen") {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDrawing(false);
  }

  function clearCurrentSlideAnnotations() {
    setAnnotationsBySlide((current) => ({
      ...current,
      [activeSlideIndex]: [],
    }));
  }

  return (
    <Box sx={{ bgcolor: "grey.100", display: "flex", flexDirection: "column", inset: 0, position: "fixed", zIndex: 240 }}>
      <Stack
        component="header"
        direction="row"
        sx={{ alignItems: "center", bgcolor: "grey.800", color: "common.white", flexShrink: 0, height: 56, justifyContent: "space-between", px: 2 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <IconButton onClick={onClose} sx={darkIconSx} aria-label="Quay lại kho học liệu">
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6" noWrap sx={{ fontWeight: "fontWeightBold" }}>
              {resource.title}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: (t) => alpha(t.palette.common.white, 0.7), fontWeight: "fontWeightMedium" }}>
              {slideCounter}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {hasCustomSlides ? (
            <>
              <ErgButton
                variant="text"
                color="inherit"
                size="small"
                onClick={() => setDrawingMode((current) => (current === "pen" ? "cursor" : "pen"))}
                startIcon={drawingMode === "pen" ? <CreateOutlinedIcon fontSize="small" /> : <NearMeOutlinedIcon fontSize="small" />}
                sx={drawingMode === "pen" ? { ...darkTextButtonSx, bgcolor: "common.white", color: "text.primary", "&:hover": { bgcolor: "common.white" } } : darkTextButtonSx}
              >
                {drawingMode === "pen" ? "Đang vẽ" : "Con trỏ"}
              </ErgButton>
              <ErgButton
                variant="text"
                color="inherit"
                size="small"
                onClick={clearCurrentSlideAnnotations}
                startIcon={<AutoFixNormalOutlinedIcon fontSize="small" />}
                sx={darkTextButtonSx}
              >
                Xóa nét
              </ErgButton>
            </>
          ) : null}
          <IconButton onClick={onClose} sx={darkIconSx} aria-label="Đóng viewer">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>

      {hasCustomSlides ? (
        <Box component="main" sx={{ bgcolor: "grey.900", display: "grid", flex: 1, gridTemplateColumns: "96px minmax(0, 1fr)", minHeight: 0 }}>
          <Box
            component="aside"
            sx={(t) => ({ bgcolor: "grey.800", borderRight: 1, borderColor: alpha(t.palette.common.white, 0.1), minHeight: 0, overflowY: "auto", px: 1.5, py: 2 })}
          >
            <Stack spacing={1.5}>
              {thumbnailSlides.map((slide, index) => {
                const isActive = index === activeSlideIndex;

                return (
                  <ButtonBase
                    key={slide.id}
                    onClick={() => setActiveSlideIndex(index)}
                    sx={(t) => ({
                      bgcolor: isActive ? "common.white" : alpha(t.palette.common.white, 0.1),
                      border: 1,
                      borderColor: isActive ? "common.white" : alpha(t.palette.common.white, 0.2),
                      borderRadius: 1,
                      display: "block",
                      overflow: "hidden",
                      textAlign: "left",
                      width: "100%",
                      "&:hover": isActive ? undefined : { borderColor: alpha(t.palette.common.white, 0.35) },
                    })}
                  >
                    <Box
                      component="img"
                      src={slide.thumbnailUrl || slide.imageUrl}
                      alt={slide.title || `Slide ${index + 1}`}
                      sx={{ aspectRatio: "16 / 9", display: "block", objectFit: "cover", width: "100%" }}
                    />
                    <Typography
                      component="span"
                      variant="caption"
                      sx={(t) => ({
                        color: isActive ? "primary.dark" : alpha(t.palette.common.white, 0.75),
                        display: "block",
                        fontWeight: "fontWeightBold",
                        px: 1,
                        py: 0.5,
                        textAlign: "center",
                      })}
                    >
                      {index + 1}
                    </Typography>
                  </ButtonBase>
                );
              })}
            </Stack>
          </Box>

          <Box component="section" sx={{ minHeight: 0, p: 2, position: "relative" }}>
            <Typography
              component="div"
              variant="body2"
              noWrap
              sx={(t) => ({
                bgcolor: alpha(t.palette.common.black, 0.6),
                borderRadius: 1,
                color: alpha(t.palette.common.white, 0.85),
                fontWeight: "fontWeightBold",
                left: 16,
                maxWidth: "calc(100% - 32px)",
                position: "absolute",
                px: 1.5,
                py: 0.75,
                top: 16,
                zIndex: 10,
              })}
            >
              {activeSlideTitle}
            </Typography>
            <Box sx={{ alignItems: "center", display: "flex", height: "100%", justifyContent: "center" }}>
              <Box sx={{ aspectRatio: "16 / 9", bgcolor: "common.black", borderRadius: 1, boxShadow: 1, maxHeight: "100%", maxWidth: 1500, overflow: "hidden", position: "relative", width: "100%" }}>
                <Box component="img" src={activeSlide?.imageUrl} alt={activeSlideTitle} sx={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }} draggable={false} />
                <Box
                  component="svg"
                  sx={{ cursor: drawingMode === "pen" ? "crosshair" : undefined, height: "100%", inset: 0, pointerEvents: drawingMode === "pen" ? undefined : "none", position: "absolute", width: "100%" }}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  {currentPaths.map((path, index) => (
                    <path key={index} d={pathToD(path)} fill="none" stroke={path.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={path.width} />
                  ))}
                </Box>
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", bgcolor: "common.white", borderRadius: 999, bottom: 20, boxShadow: 1, left: "50%", position: "absolute", px: 1.5, py: 1, transform: "translateX(-50%)" }}
            >
              <IconButton
                disabled={!canGoPrevious}
                onClick={() => setActiveSlideIndex((current) => Math.max(0, current - 1))}
                sx={lightIconSx}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography component="span" variant="subtitle2" sx={{ color: "text.primary", minWidth: 80, textAlign: "center" }}>
                {activeSlideIndex + 1} / {slides.length}
              </Typography>
              <IconButton
                disabled={!canGoNext}
                onClick={() => setActiveSlideIndex((current) => Math.min(slides.length - 1, current + 1))}
                sx={lightIconSx}
              >
                <ChevronRightIcon />
              </IconButton>
              <IconButton
                onClick={() => setActiveSlideIndex(0)}
                sx={{ ...lightIconSx, color: "text.secondary" }}
                aria-label="Quay lại slide đầu"
              >
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      ) : (
        <Box component="main" sx={{ flex: 1, minHeight: 0, p: 2 }}>
          <Box sx={{ bgcolor: "common.black", borderRadius: 1, height: "100%", overflow: "hidden", position: "relative" }}>
            <Box
              component="iframe"
              src={viewerUrl}
              title={resource.title}
              sx={{ border: 0, display: "block", height: "100%", width: "100%" }}
              allow="fullscreen; autoplay; clipboard-read; clipboard-write"
              allowFullScreen
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

const darkIconSx = {
  color: "common.white",
  height: 36,
  width: 36,
  "&:hover": { bgcolor: (t: Theme) => alpha(t.palette.common.white, 0.1) },
} as const;

const darkTextButtonSx = {
  color: "common.white",
  fontWeight: "fontWeightBold",
  height: 36,
  px: 1.5,
  "&:hover": { bgcolor: (t: Theme) => alpha(t.palette.common.white, 0.1) },
} as const;

const lightIconSx = {
  color: "text.primary",
  height: 36,
  width: 36,
  "&.Mui-disabled": { opacity: 0.7 },
} as const;

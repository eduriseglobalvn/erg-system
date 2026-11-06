import { useEffect, useRef, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";

import { getStoredAccessToken } from "@/platform/auth/api/auth-token-storage";
import type {
  LearningResourceResource,
  LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-data";

type PdfJsModule = typeof import("pdfjs-dist");
type PdfLoadingTask = ReturnType<PdfJsModule["getDocument"]>;

type PaletteTone = "primary" | "success" | "warning" | "error" | "info";

let pdfJsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.mjs?url"),
    ]).then(([pdfJs, worker]) => {
      pdfJs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfJs;
    });
  }

  return pdfJsPromise;
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

function displayText(value?: string) {
  if (!value) return "";

  if (!/[\u00c3\u00c4\u00c2\u00ba\u00bb\u00bc\u00bd\u00be\u0080-\u009f]/.test(value)) {
    return value;
  }

  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(
      Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 0xff)),
    );
  } catch {
    return value;
  }
}

function hasEmbeddableViewer(resource: LearningResourceResource) {
  return Boolean(resource.viewer.embedUrl && resource.viewer.embedUrl !== "about:blank");
}

function base64ToUint8Array(value: string) {
  const binary = window.atob(value.trim());
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getDefaultViewerUnits(resource: LearningResourceResource): LearningResourceViewerUnit[] {
  if (resource.viewer.units?.length) return resource.viewer.units;

  if (resource.subjectId === "tieng-anh") {
    return [
      {
        id: "unit-1",
        title: "Unit 1: My new school",
        children: [
          { id: "lesson-1", title: "Unit 1_Lesson 1_Period 1" },
          { id: "lesson-2", title: "Unit 1_Lesson 2_Period 2" },
          { id: "lesson-3", title: "Unit 1_Lesson 3_Period 3" },
        ],
      },
      { id: "unit-2", title: "Unit 2: My house" },
      { id: "unit-3", title: "Unit 3: My friends" },
      { id: "unit-4", title: "Unit 4: My neighbourhood" },
      { id: "unit-5", title: "Unit 5: Natural wonders of Viet Nam" },
      { id: "unit-6", title: "Unit 6: Our Tet holiday" },
      { id: "unit-7", title: "Unit 7: Television" },
      { id: "unit-8", title: "Unit 8: Sports and Games" },
      { id: "unit-9", title: "Unit 9: Cities of the World" },
    ];
  }

  return [
    {
      id: "module-1",
      title: displayText(resource.viewer.title),
      children: [
        { id: "part-1", title: "Lesson 1 - GETTING STARTED" },
        { id: "part-2", title: "Lesson 2 - PRACTICE" },
        { id: "part-3", title: "Lesson 3 - REVIEW" },
      ],
    },
  ];
}

function formatLessonTitle(value: string) {
  const text = displayText(value);
  const match = text.match(/Lesson\s+(\d+).*Period\s+(\d+)/i);

  if (match) {
    const lessonTitles: Record<string, string> = {
      "1": "GETTING STARTED",
      "2": "A CLOSER LOOK 1",
      "3": "A CLOSER LOOK 2",
      "4": "COMMUNICATION",
      "5": "SKILLS 1",
      "6": "SKILLS 2",
    };

    return {
      eyebrow: `LESSON ${match[1]} - PERIOD ${match[2]}`,
      title: lessonTitles[match[1]] ?? text,
    };
  }

  return {
    eyebrow: "LESSON",
    title: text,
  };
}

function getLectureDeckLabel(resource: LearningResourceResource) {
  const title = displayText(resource.viewer.presentationTitle ?? resource.viewer.title).toLowerCase();

  if (title.includes("global success")) return "Global Success";
  if (title.includes("english") || resource.subjectId === "tieng-anh") return "English";
  if (resource.subjectId === "tin-hoc") return "Digital Skills";
  return "ERG Lesson";
}

function getLectureDeckTone(resource: LearningResourceResource): PaletteTone {
  return resource.subjectId === "tieng-anh" ? "warning" : "primary";
}

const toolbarIconSx = { borderRadius: 0.75, color: "inherit", height: 32, width: 32, "&:hover": { bgcolor: "background.paper", color: "text.primary" } } as const;

function LectureUnitCard({
  index,
  onOpenLesson,
  tone,
  unit,
}: {
  index: number;
  onOpenLesson: (title: string) => void;
  tone: PaletteTone;
  unit: LearningResourceViewerUnit;
}) {
  const children = unit.children?.length ? unit.children : [{ id: `${unit.id}-default`, title: unit.title }];

  return (
    <Box
      component="article"
      sx={(theme) => ({
        bgcolor: alpha(theme.palette[tone].main, 0.08),
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.3),
        borderRadius: 1,
        boxShadow: 1,
        p: 2,
      })}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box
          component="span"
          sx={{
            bgcolor: `${tone}.main`,
            borderRadius: 0.75,
            color: `${tone}.contrastText`,
            display: "grid",
            flexShrink: 0,
            height: 40,
            placeItems: "center",
            typography: "subtitle2",
            width: 40,
          }}
        >
          {index + 1}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" variant="subtitle2">
            {displayText(unit.title)}
          </Typography>
          <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
            {children.map((child) => {
              const lesson = formatLessonTitle(child.title);
              return (
                <ButtonBase
                  key={child.id}
                  onClick={() => onOpenLesson(displayText(child.title))}
                  sx={(theme) => ({
                    bgcolor: "background.paper",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    display: "block",
                    px: 1.5,
                    py: 1.25,
                    textAlign: "left",
                    transition: "background-color 0.15s ease, border-color 0.15s ease",
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04), borderColor: alpha(theme.palette.primary.main, 0.3) },
                  })}
                >
                  <Typography variant="body2" sx={{ color: "primary.main", fontWeight: "fontWeightBold" }}>
                    {lesson.eyebrow}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                    {lesson.title}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

function PdfLessonBankView({
  resource,
  onClose,
  onOpenLesson,
}: {
  resource: LearningResourceResource;
  onClose: () => void;
  onOpenLesson: (title: string) => void;
}) {
  const units = getDefaultViewerUnits(resource);
  const tone = getLectureDeckTone(resource);
  const deckLabel = getLectureDeckLabel(resource);

  return (
    <Box sx={{ bgcolor: "background.default", inset: 0, overflow: "hidden", position: "fixed", zIndex: 240 }}>
      <ButtonBase
        onClick={onClose}
        aria-label="Quay lại kho học liệu"
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderBottomRightRadius: 8,
          borderColor: "divider",
          borderLeft: 0,
          borderTopRightRadius: 8,
          boxShadow: 1,
          color: "primary.main",
          height: 40,
          left: 0,
          position: "fixed",
          top: 20,
          transition: "width 0.15s ease",
          width: 64,
          zIndex: 10,
          "&:hover": { width: 80 },
        }}
      >
        <Typography component="span" variant="body2" sx={{ fontWeight: "fontWeightBold", lineHeight: 1.2, textAlign: "center" }}>
          ERG
        </Typography>
      </ButtonBase>
      <Box
        component="main"
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          boxShadow: 1,
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 40px)",
          mx: "auto",
          my: 2.5,
          overflow: "hidden",
          position: "relative",
          width: "min(1350px, calc(100vw - 96px))",
        }}
      >
        <Box component="header" sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider", color: "text.primary", flexShrink: 0, overflow: "hidden", position: "relative", px: 2.5, py: 2 }}>
          <Box sx={{ maxWidth: 768, position: "relative" }}>
            <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
              {deckLabel}
            </Typography>
            <Typography component="h1" variant="h3" sx={{ lineHeight: 1.25, mt: 0.5 }}>
              {displayText(resource.viewer.title)}
            </Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ display: "grid", flex: 1, gap: 2, gridTemplateColumns: { lg: "repeat(2, minmax(0, 1fr))" }, overflowY: "auto", p: 2.5 }}>
          {units.map((unit, index) => (
            <LectureUnitCard key={unit.id} unit={unit} index={index} tone={tone} onOpenLesson={onOpenLesson} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function PdfFullScreenPreview({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  const canEmbed = hasEmbeddableViewer(resource);
  const viewerSrc = resource.viewer.secureEmbedUrl ?? resource.viewer.embedUrl ?? "";
  const [activeLessonTitle, setActiveLessonTitle] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const viewerRootRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [renderState, setRenderState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  useEffect(() => {
    const container = canvasContainerRef.current;

    if (!activeLessonTitle || !canEmbed || !container) return undefined;

    const viewerContainer = container;
    let isCancelled = false;
    let loadingTask: PdfLoadingTask | null = null;

    async function createLoadingTask() {
      const source = viewerSrc.split("#")[0];
      const pdfJs = await loadPdfJs();

      if (source.endsWith(".b64")) {
        const response = await fetch(source, { cache: "force-cache" });

        if (!response.ok) {
          throw new Error("Cannot load encoded PDF asset");
        }

        return pdfJs.getDocument({ data: base64ToUint8Array(await response.text()) });
      }

      const token = getStoredAccessToken();
      const response = await fetch(source, {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error("Cannot load protected PDF asset");
      }

      return pdfJs.getDocument({ data: new Uint8Array(await response.arrayBuffer()) });
    }

    async function renderPdf() {
      setRenderState("loading");
      viewerContainer.replaceChildren();

      try {
        loadingTask = await createLoadingTask();
        const pdf = await loadingTask.promise;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (isCancelled) return;

          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.min(viewerContainer.clientWidth - 32, 980);
          const scale = Math.max(0.8, Math.min(1.45, availableWidth / baseViewport.width)) * zoom;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          const outputScale = window.devicePixelRatio || 1;

          if (!context) continue;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          viewerContainer.appendChild(canvas);

          await page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          }).promise;

          if (pageNumber === 1 && !isCancelled) setRenderState("ready");
        }

        if (!isCancelled) setRenderState("ready");
      } catch {
        if (!isCancelled) setRenderState("error");
      }
    }

    void renderPdf();

    return () => {
      isCancelled = true;
      loadingTask?.destroy();
      viewerContainer.replaceChildren();
    };
  }, [activeLessonTitle, canEmbed, viewerSrc, zoom]);

  async function toggleFullscreen() {
    const element = viewerRootRef.current;

    if (!element) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  }

  if (!activeLessonTitle) {
    return <PdfLessonBankView resource={resource} onClose={onClose} onOpenLesson={setActiveLessonTitle} />;
  }

  return (
    <Box ref={viewerRootRef} sx={{ bgcolor: "background.default", inset: 0, overflow: "hidden", position: "fixed", zIndex: 240 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", bgcolor: "background.default", borderBottom: 1, borderColor: "divider", boxShadow: 1, color: "text.primary", height: 56, justifyContent: "space-between", px: 2 }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
          <IconButton
            onClick={() => setActiveLessonTitle(null)}
            sx={{ ...toolbarIconSx, color: "text.secondary", flexShrink: 0, ml: -0.5 }}
            aria-label="Quay lại danh sách bài"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography component="h1" variant="h6" noWrap sx={{ fontWeight: "fontWeightBold" }}>
            {activeLessonTitle}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary" }}>
          <IconButton
            onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
            sx={toolbarIconSx}
            aria-label="Thu nhỏ PDF"
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
            sx={toolbarIconSx}
            aria-label="Phóng to PDF"
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => void toggleFullscreen()}
            sx={toolbarIconSx}
            aria-label="Mở toàn màn hình"
          >
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      {canEmbed ? (
        <Box sx={{ bgcolor: "background.default", height: "calc(100vh - 48px)", overflowY: "auto", px: 2, py: 3 }}>
          {renderState === "loading" ? (
            <Box
              sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, boxShadow: 1, display: "grid", gap: 2, maxWidth: 980, mb: 3, mx: "auto", p: 2.5 }}
              aria-hidden="true"
            >
              <Skeleton variant="rectangular" sx={{ height: 20, width: 192, borderRadius: "6px" }} />
              <Skeleton variant="rectangular" sx={{ height: 520, width: "100%", borderRadius: "8px" }} />
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" } }}>
                <Skeleton variant="rectangular" sx={{ height: 12, borderRadius: "6px" }} />
                <Skeleton variant="rectangular" sx={{ height: 12, borderRadius: "6px" }} />
                <Skeleton variant="rectangular" sx={{ height: 12, borderRadius: "6px" }} />
              </Box>
            </Box>
          ) : null}
          {renderState === "error" ? (
            <Typography
              component="div"
              variant="body2"
              sx={(theme) => ({
                bgcolor: "background.paper",
                border: 1,
                borderColor: alpha(theme.palette.error.main, 0.3),
                borderRadius: 1,
                boxShadow: 1,
                color: "error.main",
                fontWeight: "fontWeightMedium",
                maxWidth: 720,
                mx: "auto",
                p: 3,
              })}
            >
              Không thể mở PDF. BE cần trả file dạng `application/pdf` qua viewer endpoint cùng domain.
            </Typography>
          ) : null}
          {/* pdf.js pages are appended imperatively, so they are styled from the container */}
          <Box
            ref={canvasContainerRef}
            sx={(theme) => ({
              maxWidth: 1100,
              mx: "auto",
              "& canvas": {
                bgcolor: "background.paper",
                borderRadius: "2px",
                boxShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.12)}`,
                display: "block",
                maxWidth: "100%",
                mb: 3,
                mx: "auto",
              },
            })}
          />
        </Box>
      ) : (
        <Box sx={{ alignItems: "center", display: "flex", height: "calc(100vh - 48px)", justifyContent: "center", p: 3 }}>
          <Box
            sx={[
              { aspectRatio: "3 / 4", border: 1, borderRadius: 1, boxShadow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", p: 4, textAlign: "center", width: 280 },
              thumbnailThemeSx(resource.thumbnailTheme),
            ] as SxProps<Theme>}
          >
            <div>
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {displayText(resource.formatBadge)}
              </Typography>
              <Typography component="h4" variant="h3" sx={{ lineHeight: 1.25, mt: 4 }}>
                {displayText(resource.title)}
              </Typography>
            </div>
            <Typography variant="body2" sx={{ color: (theme) => alpha(theme.palette.common.white, 0.8), fontWeight: "fontWeightMedium" }}>
              {resource.viewer.pageCount ?? 1} pages
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}

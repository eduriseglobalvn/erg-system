import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getStoredAccessToken } from "@/platform/auth/api/auth-token-storage";
import type {
  LearningResourceResource,
  LearningResourceViewerUnit,
} from "@/features/lms/learning-resources/api/learning-resource-data";

type PdfJsModule = typeof import("pdfjs-dist");
type PdfLoadingTask = ReturnType<PdfJsModule["getDocument"]>;

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

const thumbnailThemes = {
  blue: "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  orange: "border-orange-200 bg-orange-50 text-orange-900",
  purple: "border-[#b8d6fa] bg-[var(--erg-blue-light)] text-[var(--erg-blue)]",
  teal: "border-cyan-200 bg-cyan-50 text-cyan-900",
  rose: "border-rose-200 bg-rose-50 text-rose-900",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  slate: "border-slate-200 bg-slate-50 text-slate-900",
} satisfies Record<LearningResourceResource["thumbnailTheme"], string>;

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

function getLectureDeckTheme(resource: LearningResourceResource) {
  if (resource.subjectId === "tieng-anh") {
    return {
      background: "bg-[#f8fbff]",
      panel: "border-[#cbd7e6] bg-white text-slate-900",
      card: "border-orange-100 bg-orange-50/80",
      icon: "bg-orange-500 text-white",
    };
  }

  if (resource.subjectId === "tin-hoc") {
    return {
      background: "bg-[#f8fbff]",
      panel: "border-[#cbd7e6] bg-white text-slate-900",
      card: "border-[#b8d6fa] bg-[var(--erg-blue-light)]",
      icon: "bg-[var(--erg-blue)] text-white",
    };
  }

  return {
    background: "bg-[#f8fbff]",
    panel: "border-[#cbd7e6] bg-white text-slate-900",
    card: "border-[#b8d6fa] bg-[var(--erg-blue-light)]",
    icon: "bg-[var(--erg-blue)] text-white",
  };
}

function LectureUnitCard({
  index,
  onOpenLesson,
  theme,
  unit,
}: {
  index: number;
  onOpenLesson: (title: string) => void;
  theme: ReturnType<typeof getLectureDeckTheme>;
  unit: LearningResourceViewerUnit;
}) {
  const children = unit.children?.length ? unit.children : [{ id: `${unit.id}-default`, title: unit.title }];

  return (
    <article className={`rounded-lg border ${theme.card} p-4 shadow-sm`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-md text-sm font-semibold ${theme.icon}`}>{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-slate-950">{displayText(unit.title)}</h2>
          <div className="mt-4 grid gap-3">
            {children.map((child) => {
              const lesson = formatLessonTitle(child.title);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onOpenLesson(displayText(child.title))}
                  className="rounded-lg border border-[#cbd7e6] bg-white px-3 py-2.5 text-left transition hover:border-[#b8d6fa] hover:bg-[#f7fbff]"
                >
                  <p className="text-[13px] font-bold text-[var(--erg-blue)]">{lesson.eyebrow}</p>
                  <p className="mt-1 text-[14px] font-semibold text-slate-800">{lesson.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </article>
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
  const theme = getLectureDeckTheme(resource);
  const deckLabel = getLectureDeckLabel(resource);

  return (
    <div className={`fixed inset-0 z-[240] overflow-hidden ${theme.background}`}>
      <button
        type="button"
        onClick={onClose}
        className="fixed left-0 top-5 z-10 flex h-10 w-16 items-center justify-center rounded-r-lg border border-l-0 border-[#cbd7e6] bg-white text-[var(--erg-blue)] shadow-sm transition hover:w-20"
        aria-label="Quay lại kho học liệu"
      >
        <span className="text-center text-[13px] font-bold leading-4">
          ERG
        </span>
      </button>
      <main className="relative mx-auto my-5 flex h-[calc(100vh-40px)] w-[min(1350px,calc(100vw-96px))] flex-col overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-sm">
        <header className={`relative shrink-0 overflow-hidden border-b ${theme.panel} px-5 py-4`}>
          <div className="relative max-w-3xl">
            <p className="text-[13px] font-semibold text-[var(--erg-blue)]">{deckLabel}</p>
            <h1 className="mt-1 text-xl font-semibold leading-tight text-slate-950">{displayText(resource.viewer.title)}</h1>
          </div>
        </header>

        <section className="grid flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-2">
          {units.map((unit, index) => (
            <LectureUnitCard key={unit.id} unit={unit} index={index} theme={theme} onOpenLesson={onOpenLesson} />
          ))}
        </section>
      </main>
    </div>
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
          canvas.className = "mx-auto mb-6 block max-w-full rounded-sm bg-white shadow-sm shadow-slate-950/12";
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
    <div ref={viewerRootRef} className="fixed inset-0 z-[240] overflow-hidden bg-[#f8fbff]">
      <div className="flex h-14 items-center justify-between border-b border-[#cbd7e6] bg-[#f8fbff] px-4 text-slate-900 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveLessonTitle(null)}
            className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900"
            aria-label="Quay lại danh sách bài"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-[15px] font-bold">{activeLessonTitle}</h1>
        </div>
        <div className="flex items-center gap-1 text-slate-600">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-white hover:text-slate-900"
            aria-label="Thu nhỏ PDF"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-white hover:text-slate-900"
            aria-label="Phóng to PDF"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md transition hover:bg-white hover:text-slate-900"
            aria-label="Mở toàn màn hình"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {canEmbed ? (
        <div className="h-[calc(100vh-48px)] overflow-y-auto bg-[#f8fbff] px-4 py-6">
          {renderState === "loading" ? (
            <div className="mx-auto mb-6 grid max-w-[980px] gap-4 rounded-lg border border-[#cbd7e6] bg-white p-5 shadow-sm" aria-hidden="true">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-[520px] w-full rounded-lg" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-3" />
                <Skeleton className="h-3" />
                <Skeleton className="h-3" />
              </div>
            </div>
          ) : null}
          {renderState === "error" ? (
            <div className="mx-auto max-w-[720px] rounded-lg border border-rose-200 bg-white p-6 text-sm font-medium text-rose-600 shadow-sm">
              Không thể mở PDF. BE cần trả file dạng `application/pdf` qua viewer endpoint cùng domain.
            </div>
          ) : null}
          <div ref={canvasContainerRef} className="mx-auto max-w-[1100px]" />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-48px)] items-center justify-center p-6">
          <div className={`flex aspect-[3/4] w-[280px] flex-col justify-between rounded-lg border ${thumbnailThemes[resource.thumbnailTheme]} p-8 text-center shadow-sm`}>
            <div>
              <p className="text-sm font-semibold text-current">{displayText(resource.formatBadge)}</p>
              <h4 className="mt-8 text-xl font-semibold leading-tight">{displayText(resource.title)}</h4>
            </div>
            <p className="text-sm font-medium text-white/80">{resource.viewer.pageCount ?? 1} pages</p>
          </div>
        </div>
      )}
    </div>
  );
}

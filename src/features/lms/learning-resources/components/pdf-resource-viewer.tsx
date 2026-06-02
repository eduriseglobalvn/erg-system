import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

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
  blue: "from-sky-100 via-blue-200 to-blue-500 text-blue-950",
  green: "from-emerald-100 via-emerald-200 to-emerald-500 text-emerald-950",
  orange: "from-orange-100 via-amber-200 to-orange-500 text-orange-950",
  purple: "from-violet-100 via-purple-200 to-indigo-500 text-violet-950",
  teal: "from-cyan-100 via-teal-200 to-teal-500 text-teal-950",
  rose: "from-rose-100 via-orange-200 to-rose-500 text-rose-950",
  yellow: "from-yellow-100 via-amber-100 to-yellow-500 text-yellow-950",
  slate: "from-slate-100 via-slate-200 to-slate-500 text-slate-950",
} satisfies Record<LearningResourceResource["thumbnailTheme"], string>;

function displayText(value?: string) {
  if (!value) return "";

  if (!/[ÃÄÂº»¼½¾\u0080-\u009f]/.test(value)) {
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
      background: "from-orange-100 via-amber-50 to-sky-100",
      panel: "from-orange-500 via-amber-400 to-sky-500",
      card: "border-orange-100 bg-orange-50/80",
      icon: "bg-orange-500 text-white",
    };
  }

  if (resource.subjectId === "tin-hoc") {
    return {
      background: "from-sky-100 via-blue-50 to-indigo-100",
      panel: "from-sky-600 via-blue-500 to-indigo-600",
      card: "border-sky-100 bg-sky-50/80",
      icon: "bg-sky-600 text-white",
    };
  }

  return {
    background: "from-violet-100 via-white to-slate-100",
    panel: "from-violet-600 via-fuchsia-500 to-slate-700",
    card: "border-violet-100 bg-violet-50/80",
    icon: "bg-violet-600 text-white",
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
    <article className={`rounded-2xl border ${theme.card} p-5 shadow-sm`}>
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black ${theme.icon}`}>{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black uppercase text-slate-950">{displayText(unit.title)}</h2>
          <div className="mt-4 grid gap-3">
            {children.map((child) => {
              const lesson = formatLessonTitle(child.title);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onOpenLesson(displayText(child.title))}
                  className="rounded-xl border border-white/70 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">{lesson.eyebrow}</p>
                  <p className="mt-1 text-sm font-black uppercase text-slate-800">{lesson.title}</p>
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
    <div className={`fixed inset-0 z-[240] overflow-hidden bg-gradient-to-br ${theme.background}`}>
      <button
        type="button"
        onClick={onClose}
        className="fixed left-0 top-7 z-10 flex h-16 w-24 items-center justify-center rounded-r-full bg-white/95 text-[var(--erg-blue)] shadow-lg shadow-slate-950/15 transition hover:w-28"
        aria-label="Quay lại kho học liệu"
      >
        <span className="text-center text-xs font-black leading-4">
          ERG
          <br />
          Hub
        </span>
      </button>
      <main className="relative mx-auto my-8 flex h-[calc(100vh-64px)] w-[min(1350px,calc(100vw-120px))] flex-col overflow-hidden rounded-xl bg-white shadow-md">
        <header className={`relative min-h-[200px] shrink-0 overflow-hidden bg-gradient-to-r ${theme.panel} px-7 py-7 text-white`}>
          <div className="absolute right-10 top-5 hidden h-36 w-48 rounded-lg border-4 border-white/70 bg-white/25 rotate-3 lg:block" />
          <div className="absolute right-6 top-9 hidden rounded-2xl bg-white px-4 py-2 text-2xl font-black text-orange-500 shadow-xl lg:block">
            Global
            <br />
            Success
          </div>
          <div className="relative max-w-3xl">
            <p className="text-5xl font-black uppercase leading-none text-white drop-shadow-sm sm:text-6xl">{deckLabel}</p>
            <h1 className="mt-8 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">{displayText(resource.viewer.title)}</h1>
          </div>
        </header>

        <section className="grid flex-1 gap-8 overflow-y-auto p-8 lg:grid-cols-2">
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
          canvas.className = "mx-auto mb-6 block max-w-full rounded-sm bg-white shadow-lg shadow-slate-950/12";
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
    <div ref={viewerRootRef} className="fixed inset-0 z-[240] overflow-hidden bg-[#f3f4f6]">
      <div className="flex h-12 items-center justify-between bg-[#3b3b3b] px-5 text-white shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveLessonTitle(null)}
            className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
            aria-label="Quay lại danh sách bài"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black tracking-tight">{activeLessonTitle}</h1>
        </div>
        <div className="flex items-center gap-1 text-white/90">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(2))))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Thu nhỏ PDF"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Phóng to PDF"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Mở toàn màn hình"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {canEmbed ? (
        <div className="h-[calc(100vh-48px)] overflow-y-auto bg-slate-100 px-4 py-6">
          {renderState === "loading" ? (
            <div className="mx-auto mb-6 max-w-[980px] rounded-xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
              Đang tải tài liệu...
            </div>
          ) : null}
          {renderState === "error" ? (
            <div className="mx-auto max-w-[720px] rounded-xl border border-rose-200 bg-white p-6 text-sm font-bold text-rose-600 shadow-sm">
              Không thể mở PDF. BE cần trả file dạng `application/pdf` qua viewer endpoint cùng domain.
            </div>
          ) : null}
          <div ref={canvasContainerRef} className="mx-auto max-w-[1100px]" />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-48px)] items-center justify-center p-6">
          <div className={`flex aspect-[3/4] w-[280px] flex-col justify-between rounded-2xl bg-gradient-to-br ${thumbnailThemes[resource.thumbnailTheme]} p-8 text-center shadow-xl`}>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">{displayText(resource.formatBadge)}</p>
              <h4 className="mt-8 text-3xl font-black leading-tight text-white drop-shadow-sm">{displayText(resource.title)}</h4>
            </div>
            <p className="text-sm font-bold text-white/80">{resource.viewer.pageCount ?? 1} pages</p>
          </div>
        </div>
      )}
    </div>
  );
}

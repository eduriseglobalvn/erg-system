import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Eraser, MousePointer2, PenLine, RotateCcw, X } from "lucide-react";

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
          color: "#f97316",
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
    <div className="fixed inset-0 z-[240] flex flex-col bg-[#f3f4f6]">
      <header className="flex h-14 shrink-0 items-center justify-between bg-[#3f3f3f] px-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Quay lại kho học liệu">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium">{resource.title}</h2>
            <p className="truncate text-xs text-white/65">{slideCounter}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCustomSlides ? (
            <>
              <button
                type="button"
                onClick={() => setDrawingMode((current) => (current === "pen" ? "cursor" : "pen"))}
                className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium ${
                  drawingMode === "pen" ? "bg-white text-slate-950" : "text-white/85 hover:bg-white/10"
                }`}
              >
                {drawingMode === "pen" ? <PenLine className="h-4 w-4" /> : <MousePointer2 className="h-4 w-4" />}
                {drawingMode === "pen" ? "Đang vẽ" : "Con trỏ"}
              </button>
              <button
                type="button"
                onClick={clearCurrentSlideAnnotations}
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium text-white/85 hover:bg-white/10"
              >
                <Eraser className="h-4 w-4" />
                Xóa nét
              </button>
            </>
          ) : null}
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Đóng viewer">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {hasCustomSlides ? (
        <main className="grid min-h-0 flex-1 grid-cols-[96px_minmax(0,1fr)] bg-slate-950">
          <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-slate-900 px-3 py-4">
            <div className="space-y-3">
              {thumbnailSlides.map((slide, index) => {
                const isActive = index === activeSlideIndex;

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(index)}
                    className={`block w-full overflow-hidden rounded-lg border text-left ${isActive ? "border-white bg-white" : "border-white/10 bg-white/10"}`}
                  >
                    <img src={slide.thumbnailUrl || slide.imageUrl} alt={slide.title || `Slide ${index + 1}`} className="aspect-video w-full object-cover" />
                    <span className={`block px-2 py-1 text-center text-[11px] font-semibold ${isActive ? "text-[#091f80]" : "text-white/70"}`}>{index + 1}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="relative min-h-0 p-4">
            <div className="absolute left-4 top-4 z-10 rounded-md bg-black/55 px-3 py-1 text-xs font-medium text-white/80">{activeSlideTitle}</div>
            <div className="flex h-full items-center justify-center">
              <div className="relative aspect-video max-h-full w-full max-w-[1500px] overflow-hidden rounded-lg bg-black shadow-sm">
                <img src={activeSlide?.imageUrl} alt={activeSlideTitle} className="h-full w-full object-contain" draggable={false} />
                <svg
                  className={`absolute inset-0 h-full w-full ${drawingMode === "pen" ? "cursor-crosshair" : "pointer-events-none"}`}
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
                </svg>
              </div>
            </div>

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setActiveSlideIndex((current) => Math.max(0, current - 1))}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="min-w-20 text-center text-sm font-semibold text-slate-900">
                {activeSlideIndex + 1} / {slides.length}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setActiveSlideIndex((current) => Math.min(slides.length - 1, current + 1))}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlideIndex(0)}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Quay lại slide đầu"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </section>
        </main>
      ) : (
        <main className="min-h-0 flex-1 p-4">
          <div className="relative h-full overflow-hidden rounded-lg bg-black">
            <iframe
              src={viewerUrl}
              title={resource.title}
              className="h-full w-full border-0"
              allow="fullscreen; autoplay; clipboard-read; clipboard-write"
              allowFullScreen
            />
          </div>
        </main>
      )}
    </div>
  );
}

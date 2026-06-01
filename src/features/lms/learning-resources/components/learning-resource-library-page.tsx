import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileQuestion,
  FileText,
  Film,
  Image as ImageIcon,
  Lock,
  Maximize2,
  MonitorPlay,
  Play,
  Presentation,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from "lucide-react";

import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/features/auth";
import { getStoredAccessToken } from "@/features/auth/api/auth-token-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import { loadHocLieuLibrarySections, loadHocLieuResourceForViewer } from "@/features/lms/learning-resources/api/learning-resource-api";
import {
  DEFAULT_HOCLIEU_SELECTION,
  getCategoryChildren,
  getTopLevelCategories,
  HOCLIEU_CATEGORIES,
  HOCLIEU_GRADES,
  HOCLIEU_LIBRARY_SECTIONS,
  HOCLIEU_SUBJECTS,
  type HocLieuAccessState,
  type HocLieuCategory,
  type HocLieuFileType,
  type HocLieuResource,
  type HocLieuViewerUnit,
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

const categoryIcons: Record<HocLieuCategory["icon"], LucideIcon> = {
  book: FileText,
  document: FileText,
  stem: Sparkles,
  certificate: FileQuestion,
  computer: MonitorPlay,
  smart: Sparkles,
};

const fileIcons: Record<HocLieuFileType, LucideIcon> = {
  PDF: FileText,
  PPTX: Presentation,
  VIDEO: Film,
  AUDIO: FileAudio,
  HTML5: MonitorPlay,
  LINK: ExternalLink,
  QUIZ: FileQuestion,
  ZIP: FileArchive,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  IMAGE: ImageIcon,
};

const thumbnailThemes = {
  blue: "from-sky-100 via-blue-200 to-blue-500 text-blue-950",
  green: "from-emerald-100 via-emerald-200 to-emerald-500 text-emerald-950",
  orange: "from-orange-100 via-amber-200 to-orange-500 text-orange-950",
  purple: "from-violet-100 via-purple-200 to-indigo-500 text-violet-950",
  teal: "from-cyan-100 via-teal-200 to-teal-500 text-teal-950",
  rose: "from-rose-100 via-orange-200 to-rose-500 text-rose-950",
  yellow: "from-yellow-100 via-amber-100 to-yellow-500 text-yellow-950",
  slate: "from-slate-100 via-slate-200 to-slate-500 text-slate-950",
} satisfies Record<HocLieuResource["thumbnailTheme"], string>;

const accessLabels: Record<HocLieuAccessState, string> = {
  open: "Miá»…n phÃ­",
  login_required: "Cáº§n Ä‘Äƒng nháº­p",
  license_required: "KÃ­ch hoáº¡t sá»­ dá»¥ng",
  unavailable: "ChÆ°a sáºµn sÃ ng",
};

function displayText(value?: string) {
  if (!value) return "";

  if (!/[ÃƒÃ„Ã‚ÂºÂ»Â¼Â½Â¾\u0080-\u009f]/.test(value)) {
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

function hasEmbeddableViewer(resource: HocLieuResource) {
  return Boolean(resource.viewer.embedUrl && resource.viewer.embedUrl !== "about:blank");
}

function getCategoryScope(categoryId: string): string[] {
  if (categoryId === "sach-mem-2") {
    return ["sgk-tieng-anh", "sach-mem-2", "hop-phan-bo-tro"];
  }

  const children = getCategoryChildren(categoryId);
  return [categoryId, ...children.flatMap((child) => getCategoryScope(child.id))];
}

function getFormatBadgeClass(fileType: HocLieuFileType) {
  switch (fileType) {
    case "PDF":
      return "bg-slate-500 text-white";
    case "PPTX":
      return "bg-orange-500 text-white";
    case "VIDEO":
      return "bg-rose-500 text-white";
    case "AUDIO":
      return "bg-emerald-500 text-white";
    case "HTML5":
      return "bg-cyan-600 text-white";
    case "QUIZ":
      return "bg-violet-500 text-white";
    case "ZIP":
      return "bg-slate-700 text-white";
    case "DOCX":
      return "bg-blue-600 text-white";
    case "XLSX":
      return "bg-emerald-600 text-white";
    case "IMAGE":
      return "bg-cyan-600 text-white";
    case "LINK":
      return "bg-blue-500 text-white";
    default:
      return "bg-slate-500 text-white";
  }
}

function matchesResource(
  resource: HocLieuResource,
  selected: { gradeId: string; subjectId: string; categoryId: string; keyword: string },
) {
  const categoryScope = getCategoryScope(selected.categoryId);
  const categoryMatches = categoryScope.includes(resource.categoryId);
  const categoryOwnsSubject = ["giao-duc-stem", "ic3-digital-literacy", "mos", "tin-hoc-pho-thong"].includes(selected.categoryId);
  const subjectMatches = categoryOwnsSubject || selected.subjectId === "all" || resource.subjectId === selected.subjectId;
  const gradeMatches =
    !resource.gradeId || resource.gradeId === selected.gradeId || ["ic3", "mos", "tin-hoc"].includes(resource.subjectId);
  const keyword = selected.keyword.trim().toLowerCase();
  const keywordMatches =
    keyword.length === 0 ||
    [resource.title, resource.subtitle, resource.formatBadge, resource.viewer.title]
      .join(" ")
      .toLowerCase()
      .includes(keyword);

  return categoryMatches && subjectMatches && gradeMatches && keywordMatches;
}

function getPreferredCategoryForSubject(subjectId: string) {
  switch (subjectId) {
    case "ic3":
      return "ic3-digital-literacy";
    case "mos":
      return "mos";
    case "tin-hoc":
      return "tin-hoc-pho-thong";
    case "giao-duc-stem":
      return "giao-duc-stem";
    case "tieng-anh":
      return "sach-mem-2";
    default:
      return DEFAULT_HOCLIEU_SELECTION.categoryId;
  }
}

function getDefaultSelectionForGrade(gradeId: string) {
  if (gradeId === DEFAULT_HOCLIEU_SELECTION.gradeId) {
    return DEFAULT_HOCLIEU_SELECTION;
  }

  return {
    gradeId,
    subjectId: "tieng-anh",
    categoryId: "sach-mem-2",
  };
}

function GradeSubjectFilter({
  activeSubjectId,
  onSubjectChange,
}: {
  activeSubjectId: string;
  onSubjectChange: (subjectId: string) => void;
}) {
  const availableSubjects = HOCLIEU_SUBJECTS.filter(
    (subject) => subject.id !== "all",
  );

  return (
    <div className="border-b border-[var(--erg-blue)]/15 bg-[#f3f6ff]">
      <div className="flex min-h-12 items-center overflow-x-auto px-4 lg:px-6">
        <div className="mx-auto flex min-w-max items-center gap-2">
        {availableSubjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => onSubjectChange(subject.id)}
              className={`h-8 rounded-md border px-3 text-sm font-bold transition ${
              activeSubjectId === subject.id
                  ? "border-[var(--erg-blue)] bg-white text-[var(--erg-blue)] shadow-sm"
                  : "border-[var(--erg-blue)]/35 bg-transparent text-[var(--erg-blue)] hover:bg-white"
            }`}
          >
            {displayText(subject.label)}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}

function CategoryTree({
  activeCategoryId,
  onSelectCategory,
}: {
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  const topLevelCategories = getTopLevelCategories();

  return (
    <aside className="border-r border-slate-200 bg-white">
      <div className="grid grid-cols-2 border-b border-[var(--erg-blue)]/20 p-3">
        <button type="button" className="h-10 rounded-md bg-[var(--erg-blue)] text-sm font-black text-white">
          Há»c liá»‡u
        </button>
        <button type="button" className="h-10 rounded-md border border-[var(--erg-blue)] bg-white text-sm font-black text-[var(--erg-blue)]">
          ..cá»§a tÃ´i
        </button>
      </div>

      <nav className="space-y-1 p-3">
        {topLevelCategories.map((category) => {
          const Icon = categoryIcons[category.icon];
          const children = getCategoryChildren(category.id);
          const isActiveParent = category.id === activeCategoryId || children.some((child) => child.id === activeCategoryId);

          return (
            <div key={category.id} className="space-y-1">
              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[15px] font-bold transition ${
                  isActiveParent ? "bg-[var(--erg-blue)]/8 text-[var(--erg-blue)]" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--erg-blue)]"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">{displayText(category.label)}</span>
              </button>
              {children.length > 0 ? (
                <div className="space-y-1 pl-10">
                  {children.map((child) => {
                    const isChildActive = child.id === activeCategoryId;

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectCategory(child.id)}
                        className={`block w-full rounded-md px-3 py-1.5 text-left text-[15px] font-medium leading-6 transition ${
                          isChildActive ? "bg-[var(--erg-blue)]/8 text-[var(--erg-blue)]" : "text-slate-600 hover:bg-slate-50 hover:text-[var(--erg-blue)]"
                        }`}
                      >
                        {displayText(child.label)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function ResourceThumbnail({ resource }: { resource: HocLieuResource }) {
  const FileIcon = fileIcons[resource.fileType];

  return (
    <div className={`relative flex aspect-[16/9] overflow-hidden rounded-t-lg bg-gradient-to-br ${thumbnailThemes[resource.thumbnailTheme]}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.75),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.38),transparent_28%)]" />
      <div className="relative flex w-full items-start justify-between p-3">
        <div className="space-y-1">
          {resource.thumbnailSubLabel ? (
            <span className="inline-flex rounded-sm bg-[#d71920] px-2 py-1 text-[10px] font-black uppercase leading-none text-white">
              {displayText(resource.thumbnailSubLabel)}
            </span>
          ) : null}
          <p className="max-w-[150px] text-sm font-black uppercase leading-5 text-white drop-shadow-sm">{displayText(resource.thumbnailLabel)}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/90 text-slate-700 shadow-sm">
          <FileIcon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FormatBadge({ resource }: { resource: HocLieuResource }) {
  return (
    <span className={`rounded-md px-2 py-1 text-[11px] font-black leading-none ${getFormatBadgeClass(resource.fileType)}`}>
      {displayText(resource.formatBadge)}
    </span>
  );
}

function ResourceCard({ resource, onOpen }: { resource: HocLieuResource; onOpen: (resource: HocLieuResource) => void }) {
  const isLocked = resource.accessState !== "open";

  return (
    <button
      type="button"
      onClick={() => onOpen(resource)}
      className="group flex min-h-[326px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left hover:border-[var(--erg-blue)]/35"
    >
      <ResourceThumbnail resource={resource} />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-3 min-h-16 text-base font-black leading-6 text-slate-950 group-hover:text-[var(--erg-blue)]">
          {displayText(resource.title)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-500">{displayText(resource.subtitle)}</p>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isLocked ? "text-[#f0a000]" : "text-emerald-500"}`}>
          <span className={`h-2 w-2 rounded-full ${isLocked ? "bg-[#f0a000]" : "bg-emerald-500"}`} />
          {accessLabels[resource.accessState]}
        </span>
        <FormatBadge resource={resource} />
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-950">KhÃ´ng tÃ¬m tháº¥y tÃ i liá»‡u phÃ¹ há»£p</h3>
      <p className="mt-2 text-sm text-slate-500">HÃ£y Ä‘á»•i bá»™ lá»c lá»›p, mÃ´n, nhÃ³m há»c liá»‡u hoáº·c tá»« khÃ³a tÃ¬m kiáº¿m.</p>
    </div>
  );
}

function base64ToUint8Array(value: string) {
  const binary = window.atob(value.trim());
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getDefaultViewerUnits(resource: HocLieuResource): HocLieuViewerUnit[] {
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

function PdfLessonBankView({
  resource,
  onClose,
  onOpenLesson,
}: {
  resource: HocLieuResource;
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
        aria-label="Quay láº¡i kho há»c liá»‡u"
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

function PdfFullScreenPreview({ resource, onClose }: { resource: HocLieuResource; onClose: () => void }) {
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
            aria-label="Quay láº¡i danh sÃ¡ch bÃ i"
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
            aria-label="Thu nhá» PDF"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.8, Number((value + 0.1).toFixed(2))))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="PhÃ³ng to PDF"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
            aria-label="Má»Ÿ toÃ n mÃ n hÃ¬nh"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {canEmbed ? (
        <div className="h-[calc(100vh-48px)] overflow-y-auto bg-slate-100 px-4 py-6">
          {renderState === "loading" ? (
            <div className="mx-auto mb-6 max-w-[980px] rounded-xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500 shadow-sm">
              Äang táº£i tÃ i liá»‡u...
            </div>
          ) : null}
          {renderState === "error" ? (
            <div className="mx-auto max-w-[720px] rounded-xl border border-rose-200 bg-white p-6 text-sm font-bold text-rose-600 shadow-sm">
              KhÃ´ng thá»ƒ má»Ÿ PDF. BE cáº§n tráº£ file dáº¡ng `application/pdf` qua viewer endpoint cÃ¹ng domain.
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

    return `Lesson ${match[1]} - ${lessonTitles[match[1]] ?? `Period ${match[2]}`}`;
  }

  return text.replaceAll("_", " ");
}

function getLectureDeckLabel(resource: HocLieuResource) {
  if (resource.subjectId === "giao-duc-stem") return resource.gradeId ? `STEM ${resource.gradeId}` : "STEM";
  if (resource.subjectId === "ic3") return "IC3 GS6";
  if (resource.subjectId === "mos") return "MOS Office";
  if (resource.subjectId === "tin-hoc") return resource.gradeId ? `Tin há»c ${resource.gradeId}` : "Tin há»c";
  if (resource.subjectId === "tieng-anh") return resource.gradeId ? `Tiáº¿ng Anh ${resource.gradeId}` : "Tiáº¿ng Anh";

  return displayText(resource.subtitle ?? resource.title);
}

function getLectureDeckTheme(resource: HocLieuResource) {
  switch (resource.subjectId) {
    case "giao-duc-stem":
      return {
        background: "from-[#062d2f] via-[#0b6b72] to-[#50c8d8]",
        panel: "from-[#48c5d3] to-[#0d8795]",
        unit: "bg-[#d9f5f7] text-[#147180]",
        active: "bg-[#147f90]",
      };
    case "ic3":
      return {
        background: "from-[#061738] via-[#123c8c] to-[#6aa2ff]",
        panel: "from-[#5b8dff] to-[#153f96]",
        unit: "bg-[#e6edff] text-[#1a3f96]",
        active: "bg-[#153f96]",
      };
    case "mos":
      return {
        background: "from-[#082018] via-[#10643f] to-[#71d6a0]",
        panel: "from-[#4fc482] to-[#127648]",
        unit: "bg-[#dcf8e9] text-[#17774e]",
        active: "bg-[#127648]",
      };
    default:
      return {
        background: "from-[#0d75a8] via-[#29b8da] to-[#85ddf0]",
        panel: "from-[#58c9e9] to-[#20b2db]",
        unit: "bg-[#d8f1fb] text-[#08749b]",
        active: "bg-[#1284a3]",
      };
  }
}

function LectureUnitCard({
  unit,
  index,
  theme,
  onOpenLesson,
}: {
  unit: HocLieuViewerUnit;
  index: number;
  theme: ReturnType<typeof getLectureDeckTheme>;
  onOpenLesson: (title: string) => void;
}) {
  const unitTitle = displayText(unit.title);
  const hasChildren = Boolean(unit.children?.length);

  if (!hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onOpenLesson(unitTitle)}
        className={`flex min-h-14 w-full items-center rounded-lg px-7 text-left text-2xl font-black leading-tight ${theme.unit}`}
      >
        {unitTitle}
      </button>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg bg-white shadow-lg shadow-slate-950/10 ring-1 ring-slate-900/10">
      <button
        type="button"
        onClick={() => onOpenLesson(unitTitle)}
        className={`flex min-h-16 w-full items-center px-8 text-left text-2xl font-black leading-tight text-white transition hover:brightness-105 ${theme.active}`}
      >
        {unitTitle}
      </button>
      <div className="max-h-[340px] overflow-y-auto">
        {unit.children?.map((child) => (
          <button
            key={child.id}
            type="button"
            onClick={() => onOpenLesson(formatLessonTitle(child.title))}
            className="block w-full border-t border-slate-200 px-10 py-4 text-left text-base font-bold text-[#05739d] transition hover:bg-sky-50 hover:text-[var(--erg-blue)]"
          >
            {formatLessonTitle(child.title)}
          </button>
        ))}
      </div>
      {index === 0 ? <div className="h-3 bg-white" /> : null}
    </article>
  );
}

function LectureBankView({
  resource,
  onClose,
  onOpenLesson,
}: {
  resource: HocLieuResource;
  onClose: () => void;
  onOpenLesson: (title: string) => void;
}) {
  const units = resource.viewer.units ?? [];
  const theme = getLectureDeckTheme(resource);
  const deckLabel = getLectureDeckLabel(resource);
  const title = displayText(resource.viewer.title);

  return (
    <div className={`fixed inset-0 z-[240] overflow-y-auto bg-gradient-to-br ${theme.background}`}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 14%, rgb(255 255 255 / 0.7), transparent 13%), radial-gradient(circle at 82% 24%, rgb(255 255 255 / 0.45), transparent 15%), radial-gradient(circle at 20% 86%, rgb(7 89 133 / 0.55), transparent 18%), linear-gradient(115deg, transparent 0 58%, rgb(255 255 255 / 0.18) 58% 60%, transparent 60%)",
        }}
      />
      <button
        type="button"
        onClick={onClose}
        className="fixed left-0 top-7 z-10 flex h-16 w-24 items-center justify-center rounded-r-full bg-white/95 text-[var(--erg-blue)] shadow-lg shadow-slate-950/15 transition hover:w-28"
        aria-label="Quay láº¡i kho há»c liá»‡u"
      >
        <span className="text-center text-xs font-black leading-4">
          ERG
          <br />
          Hub
        </span>
      </button>
      <main className="relative mx-auto my-8 w-[min(1350px,calc(100vw-120px))] overflow-hidden rounded-xl bg-white shadow-md">
        <header className={`relative min-h-[200px] overflow-hidden bg-gradient-to-r ${theme.panel} px-7 py-7 text-white`}>
          <div className="absolute right-10 top-5 hidden h-36 w-48 rounded-lg border-4 border-white/70 bg-white/25 rotate-3 lg:block" />
          <div className="absolute right-6 top-9 hidden rounded-2xl bg-white px-4 py-2 text-2xl font-black text-orange-500 shadow-xl lg:block">
            Global
            <br />
            Success
          </div>
          <button
            type="button"
            className="absolute bottom-6 right-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--erg-blue)] shadow-sm"
            aria-label="Táº£i bÃ i giáº£ng"
          >
            <Download className="h-5 w-5" />
          </button>
          <div className="relative max-w-3xl">
            <p className="text-5xl font-black uppercase leading-none text-white drop-shadow-sm sm:text-6xl">{deckLabel}</p>
            <h1 className="mt-8 text-3xl font-black uppercase leading-tight text-white sm:text-4xl">{title}</h1>
          </div>
        </header>

        <section className="grid gap-8 p-8 lg:grid-cols-2">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <LectureUnitCard key={unit.id} unit={unit} index={index} theme={theme} onOpenLesson={onOpenLesson} />
            ))
          ) : (
            <button
              type="button"
              onClick={() => onOpenLesson(displayText(resource.viewer.presentationTitle ?? resource.viewer.title))}
              className={`flex min-h-16 w-full items-center rounded-lg px-8 text-left text-2xl font-black text-white ${theme.active}`}
            >
              {displayText(resource.viewer.presentationTitle ?? resource.viewer.title)}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

function SlideDeckPreview({ resource, onClose }: { resource: HocLieuResource; onClose: () => void }) {
  const [activeLessonTitle, setActiveLessonTitle] = useState<string | null>(null);
  const canEmbed = hasEmbeddableViewer(resource);
  const presentationTitle = activeLessonTitle ?? displayText(resource.viewer.presentationTitle ?? resource.viewer.title);

  if (!activeLessonTitle) {
    return <LectureBankView resource={resource} onClose={onClose} onOpenLesson={setActiveLessonTitle} />;
  }

  if (canEmbed) {
    return (
      <div className="fixed inset-0 z-[240] bg-white">
        <div className="flex h-12 items-center gap-3 bg-[#3b3b3b] px-5 text-white shadow-sm">
          <button
            type="button"
            onClick={() => setActiveLessonTitle(null)}
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
            aria-label="Quay láº¡i danh sÃ¡ch bÃ i giáº£ng"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-black tracking-tight">{presentationTitle}</h1>
        </div>
        <div className="h-[calc(100vh-48px)] bg-white px-3 py-5">
          <iframe
            title={presentationTitle}
            src={resource.viewer.embedUrl ?? ""}
            className="h-full w-full border-0 bg-black"
            loading="lazy"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[240] bg-white">
      <div className="flex h-12 items-center gap-3 bg-[#3b3b3b] px-5 text-white shadow-sm">
        <button
          type="button"
          onClick={() => setActiveLessonTitle(null)}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
          aria-label="Quay láº¡i danh sÃ¡ch bÃ i giáº£ng"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-black tracking-tight">{presentationTitle}</h1>
      </div>
      <div className="flex h-[calc(100vh-48px)] items-center justify-center bg-slate-50 p-8">
        <div className="max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xl">
          <Presentation className="mx-auto h-12 w-12 text-[var(--erg-blue)]" />
          <h4 className="mt-5 text-2xl font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            ChÆ°a cÃ³ `embedUrl` cho bÃ i giáº£ng nÃ y. BE cáº§n tráº£ viewer URL hoáº·c token URL Ä‘á»ƒ FE má»Ÿ trÃ¬nh chiáº¿u.
          </p>
        </div>
      </div>
    </div>
  );
}

function MediaPreview({ resource }: { resource: HocLieuResource }) {
  const isAudio = resource.launchMode === "audio_player";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-6">
      <div className={`flex min-h-[360px] items-center justify-center rounded-[20px] bg-gradient-to-br ${thumbnailThemes[resource.thumbnailTheme]}`}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl">
          {isAudio ? <FileAudio className="h-8 w-8" /> : <Play className="h-9 w-9 translate-x-0.5 fill-current" />}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-1 text-sm text-slate-500">{displayText(resource.viewer.description)}</p>
        </div>
        {resource.viewer.duration ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{displayText(resource.viewer.duration)}</span>
        ) : null}
      </div>
    </div>
  );
}

function FallbackPreview({ resource }: { resource: HocLieuResource }) {
  const Icon =
    resource.launchMode === "quiz_runtime"
      ? FileQuestion
      : resource.launchMode === "download_only"
        ? FileArchive
        : Lock;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-5 text-2xl font-black text-slate-950">{displayText(resource.viewer.title)}</h4>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{displayText(resource.viewer.description)}</p>
      <button
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--erg-blue)] px-4 py-2 text-sm font-bold text-white"
        type="button"
      >
        {resource.launchMode === "download_only" ? "Táº£i gÃ³i tÃ i liá»‡u" : "Má»Ÿ khi tÃ­ch há»£p BE"}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResourceViewerModal({ resource, onClose }: { resource: HocLieuResource; onClose: () => void }) {
  if (resource.launchMode === "pdf_reader" || resource.launchMode === "ebook_reader") {
    return <PdfFullScreenPreview resource={resource} onClose={onClose} />;
  }

  if (resource.launchMode === "google_slide_embed" || resource.launchMode === "slide_image_proxy") {
    return <SlideDeckPreview resource={resource} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/55 p-4">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[24px] bg-slate-50 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay láº¡i kho há»c liá»‡u
          </button>
          <div className="flex items-center gap-2">
            <FormatBadge resource={resource} />
            {resource.isDownloadable ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
              >
                <Download className="h-4 w-4" />
                Táº£i xuá»‘ng
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-5">
          {resource.launchMode === "video_player" || resource.launchMode === "audio_player" ? <MediaPreview resource={resource} /> : null}
          {["quiz_runtime", "download_only", "external", "html5_embed"].includes(resource.launchMode) ? (
            <FallbackPreview resource={resource} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LibraryAccessGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const auth = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await auth.actions.login();
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "KhÃ´ng thá»ƒ Ä‘Äƒng nháº­p tÃ i khoáº£n giÃ¡o viÃªn.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleProviderLogin(provider: "google") {
    setIsSubmitting(true);

    try {
      await auth.actions.loginByProvider(provider);
      onAuthenticated();
    } catch (error) {
      auth.setNotice({
        tone: "error",
        message: error instanceof Error ? displayText(error.message) : "KhÃ´ng thá»ƒ Ä‘Äƒng nháº­p tÃ i khoáº£n giÃ¡o viÃªn.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#f4f7fb]">
      <div className="border-b border-[#cdeefa] bg-[#eaf8ff]">
        <div className="mx-auto flex max-w-[92rem] flex-wrap items-center justify-center gap-2 px-4 py-5 sm:px-6 lg:px-8">
          {["Máº§m non", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map((grade) => (
            <span
              key={grade}
              className={`rounded-lg px-3 py-2 text-sm font-black ${
                grade === "7" ? "bg-white text-[#5d79ff] shadow-sm" : "text-slate-500"
              }`}
            >
              {grade}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-[92rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#70c9e5] to-[#3d96ad] px-6 py-8 text-white">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Kho há»c liá»‡u ERG</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
                  ÄÄƒng nháº­p Ä‘á»ƒ má»Ÿ kho há»c liá»‡u.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/88">
                  Trang chá»§ cÃ³ thá»ƒ xem cÃ´ng khai. CÃ¡c tÃ i liá»‡u, bÃ i giáº£ng Ä‘iá»‡n tá»­, file PDF, video, IC3, MOS vÃ  Tin há»c chá»‰ má»Ÿ sau khi xÃ¡c thá»±c tÃ i khoáº£n giÃ¡o viÃªn.
                </p>
              </div>
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white/20 md:flex">
                <Lock className="h-9 w-9" />
              </div>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-3">
            {[
              { label: "SÃ¡ch vÃ  PDF", value: "PDF" },
              { label: "BÃ i giáº£ng Ä‘iá»‡n tá»­", value: "PPTX" },
              { label: "IC3 / MOS / Tin há»c", value: "API tháº­t" },
            ].map((item) => (
              <div key={item.label} className="border-t border-slate-100 p-6 md:border-r md:last:border-r-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-2xl font-black text-slate-950">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#5d79ff]/10 text-[#5d79ff]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-950">ÄÄƒng nháº­p giÃ¡o viÃªn</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Sá»­ dá»¥ng tÃ i khoáº£n Ä‘Æ°á»£c cáº¥p quyá»n Há»c liá»‡u hoáº·c LMS Ä‘á»ƒ tiáº¿p tá»¥c.</p>
            </div>
          </div>

          {auth.notice ? (
            <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {displayText(auth.notice.message)}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5d79ff] focus:ring-4 focus:ring-[#5d79ff]/10"
                type="email"
                value={auth.loginForm.email}
                onChange={(event) => auth.setLoginForm({ ...auth.loginForm, email: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Máº­t kháº©u</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#5d79ff] focus:ring-4 focus:ring-[#5d79ff]/10"
                type="password"
                value={auth.loginForm.password}
                onChange={(event) => auth.setLoginForm({ ...auth.loginForm, password: event.target.value })}
              />
            </label>

            <button
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#00008b] px-4 text-sm font-black text-white transition hover:bg-[#cc0022] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              ÄÄƒng nháº­p vÃ  má»Ÿ kho há»c liá»‡u
            </button>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              className="h-10 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-[#5d79ff] hover:text-[#5d79ff]"
              disabled={isSubmitting}
              type="button"
              onClick={() => void handleProviderLogin("google")}
            >
              Google
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LearningResourceLoginPage() {
  const location = useLocation();
  const [account, setAccount] = useState(() => getCurrentAccount());
  const redirectPath = new URLSearchParams(location.search).get("redirect") || "/kho-hoc-lieu/1";
  const safeRedirectPath = redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/kho-hoc-lieu/1";

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  if (account) {
    return <Navigate to={safeRedirectPath} replace />;
  }

  return <LibraryAccessGate onAuthenticated={() => setAccount(getCurrentAccount())} />;
}

export function LearningResourceLibraryPage() {
  const { gradeId: routeGradeId } = useParams<{ gradeId?: string }>();
  const initialGradeId = HOCLIEU_GRADES.some((grade) => grade.id === routeGradeId)
    ? routeGradeId ?? DEFAULT_HOCLIEU_SELECTION.gradeId
    : DEFAULT_HOCLIEU_SELECTION.gradeId;
  const initialSelection = getDefaultSelectionForGrade(initialGradeId);
  const [account, setAccount] = useState(() => getCurrentAccount());
  const [activeGradeId, setActiveGradeId] = useState(initialSelection.gradeId);
  const [activeSubjectId, setActiveSubjectId] = useState(initialSelection.subjectId);
  const [activeCategoryId, setActiveCategoryId] = useState(initialSelection.categoryId);
  const [keyword, setKeyword] = useState("");
  const [librarySections, setLibrarySections] = useState(HOCLIEU_LIBRARY_SECTIONS);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [viewerLoadingResourceId, setViewerLoadingResourceId] = useState<string | null>(null);
  const [activeResource, setActiveResource] = useState<HocLieuResource | null>(null);

  useEffect(() => {
    function handleAuthChanged() {
      setAccount(getCurrentAccount());
    }

    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, handleAuthChanged);
  }, []);

  useEffect(() => {
    if (!routeGradeId || !HOCLIEU_GRADES.some((grade) => grade.id === routeGradeId)) return;
    const nextSelection = getDefaultSelectionForGrade(routeGradeId);
    setActiveGradeId(nextSelection.gradeId);
    setActiveSubjectId(nextSelection.subjectId);
    setActiveCategoryId(nextSelection.categoryId);
  }, [routeGradeId]);

  useEffect(() => {
    if (!account) return undefined;

    let isCancelled = false;

    async function loadLibrary() {
      try {
        setLibraryError(null);
        const sections = await loadHocLieuLibrarySections();
        if (!isCancelled) setLibrarySections(sections);
      } catch (error) {
        if (!isCancelled) {
          setLibraryError(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ táº£i kho há»c liá»‡u tá»« API.");
        }
      }
    }

    void loadLibrary();

    return () => {
      isCancelled = true;
    };
  }, [account]);

  const visibleSections = useMemo(() => {
    return librarySections.map((section) => ({
      ...section,
      resources: section.resources.filter((resource) =>
        matchesResource(resource, {
          gradeId: activeGradeId,
          subjectId: activeSubjectId,
          categoryId: activeCategoryId,
          keyword,
        }),
      ),
    })).filter((section) => section.resources.length > 0);
  }, [activeCategoryId, activeGradeId, activeSubjectId, keyword, librarySections]);

  const totalVisibleResources = visibleSections.reduce((total, section) => total + section.resources.length, 0);
  const activeCategory = HOCLIEU_CATEGORIES.find((category) => category.id === activeCategoryId);
  const activeSubject = HOCLIEU_SUBJECTS.find((subject) => subject.id === activeSubjectId);

  const handleSubjectChange = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setActiveCategoryId(getPreferredCategoryForSubject(subjectId));
  };

  async function handleOpenResource(resource: HocLieuResource) {
    setActiveResource(resource);
    setLibraryError(null);

    if (!account) return;

    setViewerLoadingResourceId(resource.id);

    try {
      const hydratedResource = await loadHocLieuResourceForViewer(resource);
      setActiveResource((currentResource) => (currentResource?.id === resource.id ? hydratedResource : currentResource));
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ má»Ÿ viewer tá»« API.");
    } finally {
      setViewerLoadingResourceId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc]">
      <GradeSubjectFilter
        activeSubjectId={activeSubjectId}
        onSubjectChange={handleSubjectChange}
      />

      <div className="grid min-h-[calc(100vh-112px)] lg:grid-cols-[250px_minmax(0,1fr)]">
        <CategoryTree activeCategoryId={activeCategoryId} onSelectCategory={setActiveCategoryId} />

        <main className="min-w-0 px-4 py-6 md:px-7">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                {displayText(activeCategory?.label) || "Kho há»c liá»‡u"}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
                <span>{displayText(HOCLIEU_GRADES.find((grade) => grade.id === activeGradeId)?.label) || "-"}</span>
                <span>/</span>
                <span>{displayText(activeSubject?.label) || "Táº¥t cáº£"}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-[var(--erg-blue)] shadow-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {totalVisibleResources}
                </span>
              </div>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:ring-4 focus:ring-[var(--erg-blue)]/10"
                placeholder="TÃ¬m há»c liá»‡u"
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </div>

          {libraryError ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
              {displayText(libraryError)}
            </p>
          ) : null}
          {viewerLoadingResourceId ? (
            <p className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
              Äang má»Ÿ há»c liá»‡u...
            </p>
          ) : null}

          {visibleSections.length > 0 ? (
            <div className="space-y-8">
              {visibleSections.map((section) => (
                <section key={section.id}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-black uppercase text-slate-950">{displayText(section.title)}</h2>
                    {section.subtitle ? <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{displayText(section.subtitle)}</p> : null}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {section.resources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} onOpen={(item) => void handleOpenResource(item)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </main>
      </div>

      {activeResource ? <ResourceViewerModal resource={activeResource} onClose={() => setActiveResource(null)} /> : null}
    </div>
  );
}

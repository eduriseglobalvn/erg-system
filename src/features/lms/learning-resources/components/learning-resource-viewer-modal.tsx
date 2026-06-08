import { lazy, Suspense } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  FileArchive,
  FileAudio,
  FileQuestion,
  Lock,
  Play,
  Presentation,
  X,
} from "lucide-react";

import type {
  LearningResourceFileType,
  LearningResourceResource,
} from "@/features/lms/learning-resources/api/learning-resource-data";
import { displayText } from "@/features/lms/learning-resources/components/learning-resource-library-utils";

function getFormatBadgeClass(fileType: LearningResourceFileType) {
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
      return "bg-[var(--erg-blue)] text-white";
    case "ZIP":
      return "bg-slate-700 text-white";
    case "DOCX":
      return "bg-[var(--erg-blue)] text-white";
    case "XLSX":
      return "bg-emerald-600 text-white";
    case "IMAGE":
      return "bg-cyan-600 text-white";
    case "LINK":
      return "bg-[var(--erg-blue)] text-white";
    default:
      return "bg-slate-500 text-white";
  }
}

function FormatBadge({ resource }: { resource: LearningResourceResource }) {
  return (
    <span className={`rounded-lg px-2.5 py-1 text-[13px] font-bold leading-none shadow-[var(--shadow-xs)] ${getFormatBadgeClass(resource.fileType)}`}>
      {displayText(resource.formatBadge)}
    </span>
  );
}

const PdfFullScreenPreview = lazy(() =>
  import("@/features/lms/learning-resources/components/pdf-resource-viewer").then((module) => ({
    default: module.PdfFullScreenPreview,
  })),
);

function SlideDeckPreview({ resource, onClose }: { resource: LearningResourceResource; onClose: () => void }) {
  const canEmbed = Boolean(resource.viewer.embedUrl && resource.viewer.embedUrl !== "about:blank");
  const presentationTitle = displayText(resource.viewer.presentationTitle ?? resource.viewer.title);

  if (canEmbed) {
    return (
      <div className="fixed inset-0 z-[240] bg-white">
        <div className="flex h-14 items-center gap-3 border-b border-[#cbd7e6] bg-[#f8fbff] px-4 text-slate-900 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900"
            aria-label="Quay l?i kho h?c li?u"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-[15px] font-bold">{presentationTitle}</h1>
        </div>
        <div className="h-[calc(100vh-56px)] bg-[#f8fbff] px-3 py-4">
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
      <div className="flex h-14 items-center gap-3 border-b border-[#cbd7e6] bg-[#f8fbff] px-4 text-slate-900 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900"
          aria-label="Quay l?i kho h?c li?u"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-[15px] font-bold">{presentationTitle}</h1>
      </div>
      <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#f8fbff] p-8">
        <div className="max-w-xl rounded-lg border border-dashed border-[#cbd7e6] bg-white p-6 text-center shadow-[var(--shadow-xs)]">
          <Presentation className="mx-auto h-10 w-10 text-[var(--erg-blue)]" />
          <h4 className="mt-4 text-lg font-semibold text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Chưa có `embedUrl` cho bài giảng này. BE cần trả viewer URL hoặc token URL để FE mở trình chiếu.
          </p>
        </div>
      </div>
    </div>
  );
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

function MediaPreview({ resource }: { resource: LearningResourceResource }) {
  const isAudio = resource.launchMode === "audio_player";

  return (
    <div className="rounded-lg border border-[#cbd7e6] bg-white p-5 shadow-[var(--shadow-xs)]">
      <div className={`flex min-h-[320px] items-center justify-center rounded-lg border ${thumbnailThemes[resource.thumbnailTheme]}`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm">
          {isAudio ? <FileAudio className="h-8 w-8" /> : <Play className="h-9 w-9 translate-x-0.5 fill-current" />}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-semibold text-slate-950">{displayText(resource.viewer.title)}</h4>
          <p className="mt-1 text-sm text-slate-500">{displayText(resource.viewer.description)}</p>
        </div>
        {resource.viewer.duration ? (
          <span className="rounded-lg border border-[#dbe4f0] bg-slate-50 px-3 py-1.5 text-[13px] font-bold text-slate-600">{displayText(resource.viewer.duration)}</span>
        ) : null}
      </div>
    </div>
  );
}

function FallbackPreview({ resource }: { resource: LearningResourceResource }) {
  const Icon =
    resource.launchMode === "quiz_runtime"
      ? FileQuestion
      : resource.launchMode === "download_only"
        ? FileArchive
        : Lock;

  return (
    <div className="rounded-lg border border-[#cbd7e6] bg-white p-6 text-center shadow-[var(--shadow-xs)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#f8fbff] text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-slate-950">{displayText(resource.viewer.title)}</h4>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{displayText(resource.viewer.description)}</p>
      <button
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--erg-blue)] px-4 text-[14px] font-bold text-white hover:bg-[var(--erg-blue-hover)]"
        type="button"
      >
        {resource.launchMode === "download_only" ? "Tải gói tài liệu" : "Mở khi tích hợp BE"}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
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
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/45 p-0 md:p-4">
      <div className="min-h-[100dvh] overflow-hidden border-[#cbd7e6] bg-[#f8fbff] shadow-md shadow-slate-900/10 md:mx-auto md:min-h-0 md:max-w-6xl md:rounded-lg md:border">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dbe4f0] bg-white px-3 py-3 md:px-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-w-0 items-center gap-2 rounded-lg px-2.5 text-[14px] font-bold text-slate-700 hover:bg-[#f8fbff] hover:text-[var(--erg-blue)] md:h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho học liệu
          </button>
          <div className="flex items-center gap-2">
            <FormatBadge resource={resource} />
            {resource.isDownloadable ? (
              <button
                type="button"
                className="hidden h-9 items-center gap-2 rounded-lg border border-[#cbd7e6] bg-white px-3 text-[14px] font-bold text-slate-700 hover:border-[var(--erg-blue)] hover:bg-[#eef6ff] hover:text-[var(--erg-blue)] sm:inline-flex"
              >
                <Download className="h-4 w-4" />
                Tải xuống
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-[#f8fbff] hover:text-slate-800">
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

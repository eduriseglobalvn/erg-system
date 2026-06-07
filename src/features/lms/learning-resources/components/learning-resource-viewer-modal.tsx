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
    <span className={`rounded-md px-2 py-1 text-[11px] font-semibold leading-none ${getFormatBadgeClass(resource.fileType)}`}>
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
        <div className="flex h-12 items-center gap-3 border-b border-[#d1d1d1] bg-[#f7f8fa] px-4 text-slate-900 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900"
            aria-label="Quay l?i kho h?c li?u"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-semibold">{presentationTitle}</h1>
        </div>
        <div className="h-[calc(100vh-48px)] bg-[#f7f8fa] px-3 py-4">
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
      <div className="flex h-12 items-center gap-3 border-b border-[#d1d1d1] bg-[#f7f8fa] px-4 text-slate-900 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900"
          aria-label="Quay l?i kho h?c li?u"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="truncate text-sm font-semibold">{presentationTitle}</h1>
      </div>
      <div className="flex h-[calc(100vh-48px)] items-center justify-center bg-[#f7f8fa] p-8">
        <div className="max-w-xl rounded-lg border border-dashed border-[#d1d1d1] bg-white p-6 text-center shadow-sm">
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
    <div className="rounded-lg border border-[#d1d1d1] bg-white p-5">
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
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{displayText(resource.viewer.duration)}</span>
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
    <div className="rounded-lg border border-[#d1d1d1] bg-white p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#f7f8fa] text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="mt-4 text-lg font-semibold text-slate-950">{displayText(resource.viewer.title)}</h4>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{displayText(resource.viewer.description)}</p>
      <button
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-[var(--erg-blue)] px-3 text-sm font-medium text-white hover:bg-[var(--erg-blue-hover)]"
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
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/45 p-4">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-[#d1d1d1] bg-[#f7f8fa] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-600 hover:bg-[#f7f8fa]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại kho học liệu
          </button>
          <div className="flex items-center gap-2">
            <FormatBadge resource={resource} />
            {resource.isDownloadable ? (
              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-md border border-[#d1d1d1] bg-white px-3 text-sm font-medium text-slate-600 hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]"
              >
                <Download className="h-4 w-4" />
                Tải xuống
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-[#f7f8fa] hover:text-slate-700">
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

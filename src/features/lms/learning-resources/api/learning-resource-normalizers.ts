import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type {
  LearningResourceAccessState,
  LearningResourceFileType,
  LearningResourceLaunchMode,
  LearningResourcePriceType,
  LearningResourceResource,
  LearningResourceViewerSlide,
} from "@/features/lms/learning-resources/api/learning-resource-domain-types";
import { LEARNING_RESOURCE_CATEGORIES } from "@/features/lms/learning-resources/api/learning-resource-mock-data";
import type { LearningResourceLaunchSlideDTO } from "@/features/lms/learning-resources/api/learning-resource-types";
import { getApiBase } from "@/lib/platform";

export function categoryLabel(categoryId: string) {
  return LEARNING_RESOURCE_CATEGORIES.find((category) => category.id === categoryId)?.label ?? "Học liệu";
}

export function normalizeFileType(fileType: string): LearningResourceFileType {
  const normalized = fileType.toUpperCase();
  if (["PDF", "PPTX", "VIDEO", "AUDIO", "HTML5", "LINK", "QUIZ", "ZIP", "DOCX", "XLSX", "IMAGE"].includes(normalized)) {
    return normalized as LearningResourceFileType;
  }
  return "PDF";
}

export function normalizeLaunchMode(mode: string, fileType: LearningResourceFileType): LearningResourceLaunchMode {
  if (
    [
      "pdf_reader",
      "ebook_reader",
      "custom_slide_viewer",
      "google_slide_embed",
      "slide_image_proxy",
      "video_player",
      "audio_player",
      "html5_embed",
      "quiz_runtime",
      "download_only",
      "external",
    ].includes(mode)
  ) {
    return mode as LearningResourceLaunchMode;
  }

  if (fileType === "PPTX") return "google_slide_embed";
  if (fileType === "PDF") return "pdf_reader";
  if (fileType === "VIDEO") return "video_player";
  if (fileType === "AUDIO") return "audio_player";
  if (fileType === "QUIZ") return "quiz_runtime";
  return "download_only";
}

export function normalizePriceType(value?: string): LearningResourcePriceType {
  return value === "paid" || value === "licensed" ? value : "free";
}

export function normalizeAccessState(value?: string): LearningResourceAccessState {
  if (value === "login_required" || value === "license_required" || value === "unavailable") return value;
  return "open";
}

export function resourceTypeFor(fileType: LearningResourceFileType, launchMode: LearningResourceLaunchMode): LearningResourceResource["resourceType"] {
  if (launchMode === "custom_slide_viewer" || launchMode === "slide_image_proxy" || launchMode === "google_slide_embed") return "slide";
  if (launchMode === "quiz_runtime" || fileType === "QUIZ") return "quiz";
  if (launchMode === "video_player" || fileType === "VIDEO") return "video";
  if (launchMode === "audio_player" || fileType === "AUDIO") return "audio";
  if (fileType === "PPTX") return "slide";
  if (fileType === "PDF") return "pdf";
  if (fileType === "LINK") return "external_link";
  if (fileType === "HTML5") return "interactive";
  return "download_package";
}

export function themeFor(fileType: LearningResourceFileType): LearningResourceResource["thumbnailTheme"] {
  switch (fileType) {
    case "PPTX":
      return "orange";
    case "VIDEO":
      return "rose";
    case "AUDIO":
      return "green";
    case "QUIZ":
      return "purple";
    case "XLSX":
      return "green";
    case "DOCX":
      return "blue";
    case "IMAGE":
      return "teal";
    case "ZIP":
      return "slate";
    default:
      return "blue";
  }
}

export function toApiUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = getApiBase();
  if (!apiBase || !value.startsWith("/")) return value;
  return `${apiBase}${value}`;
}

export function isApiLaunchUrl(value?: string) {
  if (!value) return false;

  try {
    const url = new URL(value, getApiBase() || window.location.origin);
    const apiBase = getApiBase();
    const isSameApiOrigin = !apiBase || url.origin === new URL(apiBase).origin;
    return isSameApiOrigin && url.pathname.replace(/\/$/, "").endsWith("/launch");
  } catch {
    return value.startsWith(API_ENDPOINTS.routing.versionedBase) && value.split("?")[0]?.replace(/\/$/, "").endsWith("/launch");
  }
}

export function normalizeViewerUrl(value?: string) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/$/, "");

    if (path.endsWith("/launch")) {
      return undefined;
    }

    if (host.includes("docs.google.com") && path.includes("/presentation/")) {
      const match = path.match(/^(.*\/presentation\/d\/[^/]+)/);
      if (!match) return value;
      return `${url.origin}${match[1]}/embed?start=false&loop=false&delayms=3000`;
    }

    if (host.includes("drive.google.com") && path.includes("/file/d/")) {
      const previewPath = path.replace(/\/(view|edit|preview)$/i, "");
      return `${url.origin}${previewPath}/preview`;
    }
  } catch {
    if (value.split("?")[0]?.replace(/\/$/, "").endsWith("/launch")) {
      return undefined;
    }
    return value;
  }

  return value;
}

export function normalizeViewerSlides(slides?: LearningResourceLaunchSlideDTO[]): LearningResourceViewerSlide[] {
  if (!Array.isArray(slides)) return [];

  const normalizedSlides: LearningResourceViewerSlide[] = [];

  slides.forEach((slide, arrayIndex) => {
      const imageUrl = toApiUrl(slide.imageUrl || slide.url);
      if (!imageUrl) return;

      normalizedSlides.push({
        id: slide.id || `slide-${arrayIndex + 1}`,
        index: slide.index ?? arrayIndex + 1,
        title: slide.title,
        imageUrl,
        thumbnailUrl: toApiUrl(slide.thumbnailUrl),
      });
    });

  return normalizedSlides.sort((left, right) => left.index - right.index);
}

export function slugify(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

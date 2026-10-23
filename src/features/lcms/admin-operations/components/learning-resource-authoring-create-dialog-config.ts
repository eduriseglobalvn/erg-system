import type { TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";

export type ResolvedTaxonomyMode = TaxonomyRole | null;

export const RESOURCE_BLUE = "#0F6CBD";
export const RESOURCE_BLUE_SOFT = "#EAF4FF";
export const RESOURCE_BLUE_BORDER = "#B8D6FA";
export const RESOURCE_RED = "#F35C6B";
export const RESOURCE_RED_SOFT = "#FFF1F3";
export const RESOURCE_RED_BORDER = "#FFD0D6";
export const RESOURCE_BORDER = "rgba(145,158,171,0.2)";

export const quickIconIdsByRole: Record<TaxonomyRole, string[]> = {
  subject: ["LocalLibrary", "AutoStories", "School", "DesktopWindows"],
  level: ["Layers", "BookmarkAdded", "Class", "School"],
  topic: ["Folder", "Article", "Slideshow", "Quiz"],
};


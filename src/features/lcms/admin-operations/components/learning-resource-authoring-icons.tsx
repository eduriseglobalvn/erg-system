import { createElement, type ElementType, type ReactNode } from "react";
import * as MuiIcons from "@mui/icons-material";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import { cn } from "@/lib/utils";

export type TaxonomyRole = "subject" | "level" | "topic";

export type TaxonomyIconOption = {
  id: string;
  label: string;
};

type MuiIconComponent = ElementType<SvgIconProps>;

const defaultIconByRole: Record<TaxonomyRole, string> = {
  subject: "LocalLibrary",
  level: "Layers",
  topic: "Folder",
};

const roleTone: Record<TaxonomyRole, { background: string; border: string; foreground: string }> = {
  subject: { background: "#EEF6FF", border: "#B8D6FA", foreground: "#0F6CBD" },
  level: { background: "#EAF4FF", border: "#B8D6FA", foreground: "#0F6CBD" },
  topic: { background: "#FFF1F3", border: "#FFD0D6", foreground: "#F35C6B" },
};

export const taxonomyIconColorOptions = [
  { value: "#0F6CBD", label: "Xanh ERG" },
  { value: "#2563EB", label: "Xanh học thuật" },
  { value: "#F35C6B", label: "Do quiz bank" },
  { value: "#D73D50", label: "Do nhan" },
  { value: "#0891B2", label: "Cyan" },
  { value: "#047857", label: "Xanh lá đậm" },
  { value: "#16A34A", label: "Xanh tiến độ" },
  { value: "#B45309", label: "Vàng nâu" },
  { value: "#C2410C", label: "Cam đất" },
  { value: "#EA580C", label: "Cam nổi bật" },
  { value: "#7C3AED", label: "Tím sáng tạo" },
  { value: "#DB2777", label: "Hồng nghệ thuật" },
  { value: "#475569", label: "Slate" },
  { value: "#111827", label: "Đen mềm" },
] as const;

const legacyIconMap: Record<string, string> = {
  "subject-library": "LocalLibrary",
  "subject-book": "AutoStories",
  "subject-school": "School",
  "subject-stem": "Calculate",
  "subject-digital": "DesktopWindows",
  "level-layers": "Layers",
  "level-cap": "School",
  "level-book": "BookmarkAdded",
  "level-star": "Star",
  "topic-folder": "Folder",
  "topic-doc": "Article",
  "topic-book": "AutoStories",
};

const educationIconIds = [
  "AutoStories", "MenuBook", "School", "LocalLibrary", "LibraryBooks", "Book", "BookOnline", "Bookmark", "BookmarkAdded", "Class",
  "CastForEducation", "CoPresent", "Psychology", "PsychologyAlt", "Science", "Biotech", "Functions", "Calculate", "Percent", "DataObject",
  "Code", "Terminal", "Memory", "DeveloperBoard", "LaptopMac", "Computer", "DesktopWindows", "TabletMac", "Devices", "Language",
  "Translate", "Public", "TravelExplore", "HistoryEdu", "Draw", "EditNote", "BorderColor", "DriveFileRenameOutline", "Create", "Assignment",
  "AssignmentTurnedIn", "FactCheck", "Checklist", "ChecklistRtl", "Quiz", "HelpOutlineOutlined", "QuestionAnswer", "Forum", "RecordVoiceOver", "Campaign",
  "VolumeUp", "Headphones", "Mic", "Videocam", "OndemandVideo", "Slideshow", "PlayCircle", "SmartDisplay", "PictureAsPdf", "Article",
  "Description", "TextSnippet", "NoteAlt", "Folder", "Topic", "Inventory2", "Category", "Layers", "AccountTree", "Hub",
  "Schema", "Timeline", "EventNote", "CalendarMonth", "AccessTime", "Alarm", "Schedule", "Grade", "Stars", "EmojiEvents",
  "WorkspacePremium", "MilitaryTech", "Verified", "CheckCircle", "TaskAlt", "Lightbulb", "TipsAndUpdates", "RocketLaunch", "Explore", "Extension",
  "Palette", "ColorLens", "Brush", "Image", "PhotoLibrary", "MusicNote", "GraphicEq", "Groups", "Person", "Diversity3",
] as const;

const muiIconEntries: Array<[string, MuiIconComponent]> = educationIconIds.flatMap((name) => {
  const icon = (MuiIcons as Record<string, unknown>)[name];
  return isMuiIconComponent(icon) ? [[name, icon]] : [];
});

export const muiTaxonomyIconOptions: TaxonomyIconOption[] = muiIconEntries.map(([id]) => ({
  id,
  label: humanizeIconName(id),
}));

const muiIconMap = new Map<string, MuiIconComponent>(muiIconEntries.map(([name, value]) => [name, value as MuiIconComponent]));

export function getTaxonomyIconOptions() {
  return muiTaxonomyIconOptions;
}

export function getTaxonomyIconId(iconId: string | undefined, role: TaxonomyRole): string {
  const mappedIconId = iconId ? legacyIconMap[iconId] ?? iconId : undefined;
  if (mappedIconId && muiIconMap.has(mappedIconId)) return mappedIconId;
  return defaultIconByRole[role];
}

export function getTaxonomyIconColor(iconColor: string | undefined, role: TaxonomyRole): string {
  const normalizedColor = iconColor?.trim().toUpperCase();
  if (normalizedColor && taxonomyIconColorOptions.some((option) => option.value === normalizedColor)) {
    return normalizedColor;
  }
  return roleTone[role].foreground;
}

export function TaxonomyIcon({
  className,
  iconColor,
  iconId,
  role,
  size = "sm",
}: {
  className?: string;
  iconColor?: string;
  iconId?: string;
  open?: boolean;
  role: TaxonomyRole;
  size?: "sm" | "md" | "lg";
}): ReactNode {
  const resolvedIconId = getTaxonomyIconId(iconId, role);
  const Icon = muiIconMap.get(resolvedIconId) ?? muiIconMap.get(defaultIconByRole[role]);
  if (!Icon) return null;
  const tone = roleTone[role];
  const resolvedColor = getTaxonomyIconColor(iconColor, role);
  const framed = size === "lg";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        framed ? "rounded-xl border" : "rounded-none border-0 bg-transparent",
        size === "lg" ? "h-[72px] w-[72px]" : size === "md" ? "h-7 w-7" : "h-5 w-5",
        className,
      )}
      style={{
        backgroundColor: framed ? withAlpha(resolvedColor, "12", tone.background) : "transparent",
        borderColor: framed ? withAlpha(resolvedColor, "33", tone.border) : "transparent",
        color: resolvedColor,
      }}
      aria-hidden="true"
    >
      {createElement(Icon, { className: size === "lg" ? "h-9 w-9" : size === "md" ? "h-5 w-5" : "h-3.5 w-3.5" })}
    </span>
  );
}

function withAlpha(color: string, alpha: string, fallback: string) {
  return /^#[0-9A-F]{6}$/i.test(color) ? `${color}${alpha}` : fallback;
}

function isMuiIconComponent(value: unknown): value is MuiIconComponent {
  if (typeof value === "function") return true;
  return Boolean(value && typeof value === "object" && "$$typeof" in value);
}

function humanizeIconName(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .trim();
}

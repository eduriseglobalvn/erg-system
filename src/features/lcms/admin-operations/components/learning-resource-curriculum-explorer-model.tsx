import BookOpen from "@mui/icons-material/AutoStories";
import Copy from "@mui/icons-material/ContentCopy";
import FileQuestion from "@mui/icons-material/HelpOutlineOutlined";
import FileText from "@mui/icons-material/Article";
import Folder from "@mui/icons-material/Folder";
import GraduationCap from "@mui/icons-material/School";
import Layers3 from "@mui/icons-material/Layers";
import Pencil from "@mui/icons-material/Edit";
import Plus from "@mui/icons-material/Add";
import Presentation from "@mui/icons-material/Slideshow";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import type { CurriculumContentItem, CurriculumContentKind, CurriculumFolder, CurriculumFolderRole, CurriculumTarget, ResourceCommandId, ResourceCommandSpec } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

export const resourcePalette = {
  blue: "#0F6CBD",
  blueSoft: "#EAF4FF",
  blueBorder: "#B8D6FA",
  red: "#F35C6B",
  redSoft: "#FFF1F3",
  redBorder: "#FFD0D6",
  text: "#1C252E",
  muted: "#637381",
  border: "rgba(145, 158, 171, 0.2)",
};

export function flattenContentGroups(groups: Record<CurriculumContentKind, CurriculumContentItem[]>) {
  return [...groups.lecture, ...groups.resource, ...groups.exercise];
}

export function targetsEqual(left?: CurriculumTarget | null, right?: CurriculumTarget | null) {
  return Boolean(left && right && left.type === right.type && left.id === right.id);
}

export function simpleFolderCount(folder: CurriculumFolder) {
  if (folder.role === "subject") return `${folder.summary.levels} level`;
  if (folder.role === "level") return `${folder.summary.topics} chủ đề`;
  return `${folder.summary.totalContent} học liệu`;
}

export function uniqueCommands(commands: ResourceCommandSpec[]) {
  const seen = new Set<ResourceCommandId>();
  return commands.filter((command) => {
    if (seen.has(command.id)) return false;
    seen.add(command.id);
    return true;
  });
}

export function commandIcon(id: ResourceCommandId) {
  const className = "h-4 w-4";
  switch (id) {
    case "create-subject":
      return <BookOpen className={className} />;
    case "create-level":
      return <Layers3 className={className} />;
    case "create-topic":
      return <Folder className={className} />;
    case "add-lecture":
      return <Presentation className={className} />;
    case "add-resource":
      return <FileText className={className} />;
    case "add-exercise":
      return <FileQuestion className={className} />;
    case "copy-url":
      return <Copy className={className} />;
    case "edit":
      return <Pencil className={className} />;
    case "delete":
      return <Trash2 className={className} />;
    default:
      return <Plus className={className} />;
  }
}

export function roleIcon(role: CurriculumFolderRole | CurriculumContentKind) {
  const className = "h-4 w-4";
  switch (role) {
    case "subject":
      return <BookOpen className={className} />;
    case "level":
      return <Layers3 className={className} />;
    case "topic":
      return <Folder className={className} />;
    case "lecture":
      return <Presentation className={className} />;
    case "exercise":
      return <FileQuestion className={className} />;
    case "resource":
      return <FileText className={className} />;
    default:
      return <GraduationCap className={className} />;
  }
}

export function roleTone(role: CurriculumFolderRole | CurriculumContentKind) {
  if (role === "exercise" || role === "topic") {
    return {
      background: resourcePalette.redSoft,
      border: resourcePalette.redBorder,
      foreground: resourcePalette.red,
    };
  }
  if (role === "resource") {
    return {
      background: "#F4F6F8",
      border: resourcePalette.border,
      foreground: resourcePalette.muted,
    };
  }
  return {
    background: resourcePalette.blueSoft,
    border: resourcePalette.blueBorder,
    foreground: resourcePalette.blue,
  };
}

export function toneColors(tone: "blue" | "red" | "neutral") {
  if (tone === "red") {
    return { background: resourcePalette.redSoft, border: resourcePalette.redBorder, foreground: resourcePalette.red };
  }
  if (tone === "neutral") {
    return { background: "#F4F6F8", border: resourcePalette.border, foreground: resourcePalette.muted };
  }
  return { background: resourcePalette.blueSoft, border: resourcePalette.blueBorder, foreground: resourcePalette.blue };
}

export function folderRoleLabel(role: CurriculumFolderRole) {
  if (role === "subject") return "Môn học";
  if (role === "level") return "Level";
  return "Chủ đề";
}

export function statusLabel(status?: string) {
  if (status === "hidden") return "Đã ẩn";
  if (status === "draft" || status === "reviewing") return "Bản nháp";
  if (status === "active" || status === "published" || status === "ready") return "Đã xuất bản";
  return status || "Chưa rõ";
}


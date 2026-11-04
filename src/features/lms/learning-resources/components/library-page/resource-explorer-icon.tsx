import { FileQuestion, FileText, Folder, MonitorPlay, Presentation, type LucideIcon } from "lucide-react";

import type { LearningResourceFileType, LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";

const fileIcons: Record<LearningResourceFileType, LucideIcon> = {
  PDF: FileText,
  PPTX: Presentation,
  VIDEO: MonitorPlay,
  AUDIO: FileText,
  HTML5: MonitorPlay,
  LINK: FileText,
  QUIZ: FileQuestion,
  ZIP: Folder,
  DOCX: FileText,
  XLSX: FileText,
  IMAGE: FileText,
};

export function ResourceExplorerIcon({ resource }: { resource: LearningResourceResource }) {
  const FileIcon = fileIcons[resource.fileType];
  return <FileIcon className="h-4 w-4 shrink-0 text-[var(--erg-blue)]" />;
}

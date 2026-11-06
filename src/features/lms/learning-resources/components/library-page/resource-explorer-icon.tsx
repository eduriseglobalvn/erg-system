import type SvgIcon from "@mui/material/SvgIcon";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import OndemandVideoOutlinedIcon from "@mui/icons-material/OndemandVideoOutlined";
import SlideshowOutlinedIcon from "@mui/icons-material/SlideshowOutlined";

import type { LearningResourceFileType, LearningResourceResource } from "@/features/lms/learning-resources/api/learning-resource-data";

const fileIcons: Record<LearningResourceFileType, typeof SvgIcon> = {
  PDF: DescriptionOutlinedIcon,
  PPTX: SlideshowOutlinedIcon,
  VIDEO: OndemandVideoOutlinedIcon,
  AUDIO: DescriptionOutlinedIcon,
  HTML5: OndemandVideoOutlinedIcon,
  LINK: DescriptionOutlinedIcon,
  QUIZ: HelpOutlineOutlinedIcon,
  ZIP: FolderOutlinedIcon,
  DOCX: DescriptionOutlinedIcon,
  XLSX: DescriptionOutlinedIcon,
  IMAGE: DescriptionOutlinedIcon,
};

export function ResourceExplorerIcon({ resource }: { resource: LearningResourceResource }) {
  const FileIcon = fileIcons[resource.fileType];
  return <FileIcon fontSize="small" sx={{ color: "primary.main", flexShrink: 0 }} />;
}

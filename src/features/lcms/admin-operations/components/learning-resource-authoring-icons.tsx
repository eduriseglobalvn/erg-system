import { createElement, type ElementType, type ReactNode } from "react";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import BookIcon from "@mui/icons-material/Book";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import ClassIcon from "@mui/icons-material/Class";
import CastForEducationIcon from "@mui/icons-material/CastForEducation";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import PsychologyIcon from "@mui/icons-material/Psychology";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import ScienceIcon from "@mui/icons-material/Science";
import BiotechIcon from "@mui/icons-material/Biotech";
import FunctionsIcon from "@mui/icons-material/Functions";
import CalculateIcon from "@mui/icons-material/Calculate";
import PercentIcon from "@mui/icons-material/Percent";
import DataObjectIcon from "@mui/icons-material/DataObject";
import CodeIcon from "@mui/icons-material/Code";
import TerminalIcon from "@mui/icons-material/Terminal";
import MemoryIcon from "@mui/icons-material/Memory";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import ComputerIcon from "@mui/icons-material/Computer";
import DesktopWindowsIcon from "@mui/icons-material/DesktopWindows";
import TabletMacIcon from "@mui/icons-material/TabletMac";
import DevicesIcon from "@mui/icons-material/Devices";
import LanguageIcon from "@mui/icons-material/Language";
import TranslateIcon from "@mui/icons-material/Translate";
import PublicIcon from "@mui/icons-material/Public";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import DrawIcon from "@mui/icons-material/Draw";
import EditNoteIcon from "@mui/icons-material/EditNote";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import CreateIcon from "@mui/icons-material/Create";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import QuizIcon from "@mui/icons-material/Quiz";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import ForumIcon from "@mui/icons-material/Forum";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CampaignIcon from "@mui/icons-material/Campaign";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import MicIcon from "@mui/icons-material/Mic";
import VideocamIcon from "@mui/icons-material/Videocam";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SmartDisplayIcon from "@mui/icons-material/SmartDisplay";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ArticleIcon from "@mui/icons-material/Article";
import DescriptionIcon from "@mui/icons-material/Description";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import FolderIcon from "@mui/icons-material/Folder";
import TopicIcon from "@mui/icons-material/Topic";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import LayersIcon from "@mui/icons-material/Layers";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import HubIcon from "@mui/icons-material/Hub";
import SchemaIcon from "@mui/icons-material/Schema";
import TimelineIcon from "@mui/icons-material/Timeline";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AlarmIcon from "@mui/icons-material/Alarm";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GradeIcon from "@mui/icons-material/Grade";
import StarsIcon from "@mui/icons-material/Stars";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ExploreIcon from "@mui/icons-material/Explore";
import ExtensionIcon from "@mui/icons-material/Extension";
import PaletteIcon from "@mui/icons-material/Palette";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import BrushIcon from "@mui/icons-material/Brush";
import ImageIcon from "@mui/icons-material/Image";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import Diversity3Icon from "@mui/icons-material/Diversity3";
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

const muiIconEntries: Array<[string, MuiIconComponent]> = [
  ["AutoStories", AutoStoriesIcon],
  ["MenuBook", MenuBookIcon],
  ["School", SchoolIcon],
  ["LocalLibrary", LocalLibraryIcon],
  ["LibraryBooks", LibraryBooksIcon],
  ["Book", BookIcon],
  ["BookOnline", BookOnlineIcon],
  ["Bookmark", BookmarkIcon],
  ["BookmarkAdded", BookmarkAddedIcon],
  ["Class", ClassIcon],
  ["CastForEducation", CastForEducationIcon],
  ["CoPresent", CoPresentIcon],
  ["Psychology", PsychologyIcon],
  ["PsychologyAlt", PsychologyAltIcon],
  ["Science", ScienceIcon],
  ["Biotech", BiotechIcon],
  ["Functions", FunctionsIcon],
  ["Calculate", CalculateIcon],
  ["Percent", PercentIcon],
  ["DataObject", DataObjectIcon],
  ["Code", CodeIcon],
  ["Terminal", TerminalIcon],
  ["Memory", MemoryIcon],
  ["DeveloperBoard", DeveloperBoardIcon],
  ["LaptopMac", LaptopMacIcon],
  ["Computer", ComputerIcon],
  ["DesktopWindows", DesktopWindowsIcon],
  ["TabletMac", TabletMacIcon],
  ["Devices", DevicesIcon],
  ["Language", LanguageIcon],
  ["Translate", TranslateIcon],
  ["Public", PublicIcon],
  ["TravelExplore", TravelExploreIcon],
  ["HistoryEdu", HistoryEduIcon],
  ["Draw", DrawIcon],
  ["EditNote", EditNoteIcon],
  ["BorderColor", BorderColorIcon],
  ["DriveFileRenameOutline", DriveFileRenameOutlineIcon],
  ["Create", CreateIcon],
  ["Assignment", AssignmentIcon],
  ["AssignmentTurnedIn", AssignmentTurnedInIcon],
  ["FactCheck", FactCheckIcon],
  ["Checklist", ChecklistIcon],
  ["ChecklistRtl", ChecklistRtlIcon],
  ["Quiz", QuizIcon],
  ["HelpOutlineOutlined", HelpOutlineOutlinedIcon],
  ["QuestionAnswer", QuestionAnswerIcon],
  ["Forum", ForumIcon],
  ["RecordVoiceOver", RecordVoiceOverIcon],
  ["Campaign", CampaignIcon],
  ["VolumeUp", VolumeUpIcon],
  ["Headphones", HeadphonesIcon],
  ["Mic", MicIcon],
  ["Videocam", VideocamIcon],
  ["OndemandVideo", OndemandVideoIcon],
  ["Slideshow", SlideshowIcon],
  ["PlayCircle", PlayCircleIcon],
  ["SmartDisplay", SmartDisplayIcon],
  ["PictureAsPdf", PictureAsPdfIcon],
  ["Article", ArticleIcon],
  ["Description", DescriptionIcon],
  ["TextSnippet", TextSnippetIcon],
  ["NoteAlt", NoteAltIcon],
  ["Folder", FolderIcon],
  ["Topic", TopicIcon],
  ["Inventory2", Inventory2Icon],
  ["Category", CategoryIcon],
  ["Layers", LayersIcon],
  ["AccountTree", AccountTreeIcon],
  ["Hub", HubIcon],
  ["Schema", SchemaIcon],
  ["Timeline", TimelineIcon],
  ["EventNote", EventNoteIcon],
  ["CalendarMonth", CalendarMonthIcon],
  ["AccessTime", AccessTimeIcon],
  ["Alarm", AlarmIcon],
  ["Schedule", ScheduleIcon],
  ["Grade", GradeIcon],
  ["Stars", StarsIcon],
  ["EmojiEvents", EmojiEventsIcon],
  ["WorkspacePremium", WorkspacePremiumIcon],
  ["MilitaryTech", MilitaryTechIcon],
  ["Verified", VerifiedIcon],
  ["CheckCircle", CheckCircleIcon],
  ["TaskAlt", TaskAltIcon],
  ["Lightbulb", LightbulbIcon],
  ["TipsAndUpdates", TipsAndUpdatesIcon],
  ["RocketLaunch", RocketLaunchIcon],
  ["Explore", ExploreIcon],
  ["Extension", ExtensionIcon],
  ["Palette", PaletteIcon],
  ["ColorLens", ColorLensIcon],
  ["Brush", BrushIcon],
  ["Image", ImageIcon],
  ["PhotoLibrary", PhotoLibraryIcon],
  ["MusicNote", MusicNoteIcon],
  ["GraphicEq", GraphicEqIcon],
  ["Groups", GroupsIcon],
  ["Person", PersonIcon],
  ["Diversity3", Diversity3Icon],
];

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

function humanizeIconName(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/(\d)([A-Z])/g, "$1 $2")
    .trim();
}

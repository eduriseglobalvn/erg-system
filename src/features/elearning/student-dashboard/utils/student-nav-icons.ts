import type { ComponentType } from "react";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import GradeOutlinedIcon from "@mui/icons-material/GradeOutlined";
import GradeRoundedIcon from "@mui/icons-material/GradeRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import type { StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

type Icon = ComponentType<SvgIconProps>;

/** Canvas icon table (spec 8): outlined at rest, filled (Rounded) when the item is selected. */
export const STUDENT_NAV_ICONS: Partial<Record<StudentPageKey, { icon: Icon; activeIcon: Icon }>> = {
  announcements: { icon: InboxOutlinedIcon, activeIcon: InboxRoundedIcon },
  assignments: { icon: AssignmentOutlinedIcon, activeIcon: AssignmentRoundedIcon },
  discussion: { icon: ForumOutlinedIcon, activeIcon: ForumRoundedIcon },
  overview: { icon: HomeOutlinedIcon, activeIcon: HomeRoundedIcon },
  ranking: { icon: EmojiEventsOutlinedIcon, activeIcon: EmojiEventsRoundedIcon },
  scores: { icon: GradeOutlinedIcon, activeIcon: GradeRoundedIcon },
};

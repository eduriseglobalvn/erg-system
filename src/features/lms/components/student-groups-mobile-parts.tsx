import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import { initialsOf } from "@/features/lms/components/assignment-progress-mobile/progress-student-row";
import type { StudentGroup } from "@/features/lms/components/student-groups-parts";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const cardSx = { borderRadius: `${t.radius.card}px`, display: "flex", flexDirection: "column", gap: 1, px: 2, py: 1.75 } as const;
const avatarSx = { bgcolor: t.color.primarySofter, color: "primary.main", typography: "caption", fontWeight: "fontWeightBold" } as const;
const metaSx = { color: "text.secondary", fontVariantNumeric: "tabular-nums" } as const;

/** Class row: class-code avatar, name, grade and homeroom teacher (when the bootstrap has one), student count. */
export function ClassCard({ classroom }: { classroom: ClassroomSnapshot }) {
  const meta = [classroom.gradeLabel, classroom.homeroomTeacher && `GVCN ${classroom.homeroomTeacher}`].filter(Boolean).join(" · ");
  return (
    <Paper component="li" sx={{ ...cardSx, alignItems: "center", flexDirection: "row", gap: 1.5 }} variant="outlined">
      <Avatar sx={{ ...avatarSx, borderRadius: `${t.radius.control}px`, height: 40, width: 40 }} variant="rounded">
        {classroom.className.replace(/^Lớp\s+/i, "").slice(0, 4)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: "fontWeightBold" }} variant="body2">{classroom.className}</Typography>
        {meta ? <Typography component="p" noWrap sx={metaSx} variant="caption">{meta}</Typography> : null}
      </Box>
      <Typography sx={{ ...metaSx, flexShrink: 0 }} variant="caption">{`${classroom.studentCount} HS`}</Typography>
    </Paper>
  );
}

/** Canvas group card: tinted icon, name, note, member avatar stack and count (no auto-group rule/badge: groups are manual only). */
export function GroupCard({ group, memberNames }: { group: StudentGroup; memberNames: string[] }) {
  return (
    <Paper component="li" sx={cardSx} variant="outlined">
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5 }}>
        <Box
          aria-hidden
          sx={{ alignItems: "center", bgcolor: group.color, borderRadius: `${t.radius.control}px`, color: "common.white", display: "flex", flexShrink: 0, height: 32, justifyContent: "center", width: 32 }}
        >
          <GroupsOutlinedIcon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: "fontWeightBold" }} variant="body2">{group.name}</Typography>
          {group.note ? <Typography component="p" sx={{ ...metaSx, display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }} variant="caption">{group.note}</Typography> : null}
        </Box>
      </Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, pl: 5.5 }}>
        {memberNames.length ? (
          <AvatarGroup sx={{ "& .MuiAvatar-root": { ...avatarSx, borderColor: "background.paper", height: 28, width: 28 } }}>
            {memberNames.slice(0, 3).map((name, index) => <Avatar key={`${name}-${index}`}>{initialsOf(name)}</Avatar>)}
          </AvatarGroup>
        ) : null}
        <Typography sx={metaSx} variant="caption">{`${group.studentIds.length} HS`}</Typography>
      </Box>
    </Paper>
  );
}

/** Dashed placeholder (canvas empty slot) for a tab with no items. */
export function DashedEmpty({ children }: { children: string }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: `${t.radius.card}px`, borderStyle: "dashed", color: "text.secondary", px: 2, py: 3, textAlign: "center", typography: "body2" }}>
      {children}
    </Box>
  );
}

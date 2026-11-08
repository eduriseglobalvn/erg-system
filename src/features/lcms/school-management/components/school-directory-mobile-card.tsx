import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { schoolInitials } from "@/features/lcms/admin-home/admin-home-schools";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { schoolTypeMeta } from "@/features/lcms/school-management/types/school-type-config";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

// Same labels as the desktop table and the admin home rows.
const STATUS = {
  active: { label: "Đang vận hành", tone: "success" },
  onboarding: { label: "Đang triển khai", tone: "warning" },
  paused: { label: "Tạm dừng", tone: "neutral" },
} as const;

/** Canvas N6 school card: initials avatar, name, type · district, class/learner counts, status badge. Tapping opens the school. */
export function SchoolDirectoryMobileCard({ onOpen, school }: { onOpen: (id: string) => void; school: PartnerSchool }) {
  const status = STATUS[school.status] ?? STATUS.paused;
  const meta = [schoolTypeMeta[school.schoolType]?.shortLabel, school.district].filter(Boolean).join(" · ");
  const counts: Array<[number, string]> = [
    [school.classCount ?? school.classes.length, "lớp"],
    [school.studentCount ?? school.students.length, "HS"],
  ];
  return (
    <Box component="li">
      <ButtonBase
        aria-label={`Mở ${school.name}`}
        onClick={() => onOpen(school.id)}
        sx={{
          bgcolor: "background.paper",
          border: `1px solid ${t.color.border}`,
          borderRadius: `${t.radius.card}px`,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          px: 2,
          py: 1.75,
          textAlign: "left",
          width: "100%",
          "&:focus-visible": { boxShadow: t.shadow.focus, outline: "none" },
        }}
      >
        <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, width: "100%" }}>
          <Avatar
            aria-hidden
            sx={{ typography: "caption", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: "primary.main", fontWeight: "fontWeightBold", height: 40, width: 40 }}
            variant="rounded"
          >
            {schoolInitials(school.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: "fontWeightBold" }} variant="body2">{school.name}</Typography>
            {meta ? <Typography color="text.secondary" component="p" noWrap variant="caption">{meta}</Typography> : null}
          </Box>
        </Box>
        <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ color: "text.secondary", display: "flex", fontVariantNumeric: "tabular-nums", gap: 2, typography: "caption" }}>
            {counts.map(([value, unit]) => (
              <span key={unit}><Box component="b" sx={{ color: "text.primary", fontWeight: "fontWeightBold" }}>{value}</Box> {unit}</span>
            ))}
          </Box>
          <ErgStatusChip label={status.label} tone={status.tone} />
        </Box>
      </ButtonBase>
    </Box>
  );
}

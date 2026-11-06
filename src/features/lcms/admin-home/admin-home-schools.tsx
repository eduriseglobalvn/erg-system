import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import type { AdminHomeSchoolRow } from "./admin-home-model";

export const panelSx = {
  bgcolor: "background.paper",
  border: `1px solid ${t.color.border}`,
  borderRadius: `${t.radius.card}px`,
} as const;

const STATUS = {
  active: { label: "Đang vận hành", tint: t.statusTint.success },
  onboarding: { label: "Đang triển khai", tint: t.statusTint.warning },
  paused: { label: "Tạm dừng", tint: t.statusTint.neutral },
} as const;

// Name | status | learners | classes | placed share, one grid so header and rows line up.
const columns = { xs: "minmax(0,1fr) auto", md: "minmax(0,1.6fr) 140px 88px 64px minmax(120px,1fr) 20px" };
const desktopOnly = { display: { xs: "none", md: "block" } } as const;

export function AdminHomeSchools({ loading, rows, onOpen, onOpenAll }: {
  loading: boolean;
  rows: AdminHomeSchoolRow[];
  onOpen: (schoolId: string) => void;
  onOpenAll: () => void;
}) {
  return (
    <Box component="section" aria-labelledby="admin-home-schools" sx={{ ...panelSx, minWidth: 0, overflow: "hidden" }}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", px: 2.5, py: 1.75 }}>
        <Typography component="h2" id="admin-home-schools" variant="h5">Trường liên kết</Typography>
        <Button onClick={onOpenAll} size="small" variant="text">Xem tất cả</Button>
      </Box>
      <Box sx={{ bgcolor: t.color.surfaceMuted, borderBlock: `1px solid ${t.color.divider}`, color: "text.secondary", display: { xs: "none", md: "grid" }, gap: 2, gridTemplateColumns: columns, px: 2.5, py: 1, typography: "caption" }}>
        <span>Trường</span><span>Trạng thái</span><Box component="span" sx={{ textAlign: "right" }}>Người học</Box><Box component="span" sx={{ textAlign: "right" }}>Lớp</Box><span>Đã xếp môn</span><span />
      </Box>
      {loading
        ? Array.from({ length: 2 }).map((_, index) => <Skeleton height={44} key={index} sx={{ mx: 2.5, my: 1.25 }} variant="rounded" />)
        : rows.length === 0
          ? <Typography color="text.secondary" sx={{ px: 2.5, py: 4 }}>Chưa có trường nào. Thêm trường trong Quản lý trường học.</Typography>
          : rows.map((row, index) => <SchoolRow divider={index > 0} key={row.id} onOpen={onOpen} row={row} />)}
    </Box>
  );
}

function SchoolRow({ divider, row, onOpen }: { divider: boolean; row: AdminHomeSchoolRow; onOpen: (schoolId: string) => void }) {
  const status = STATUS[row.status] ?? STATUS.paused;
  const percent = row.placedRate === null ? null : Math.round(row.placedRate * 100);
  return (
    <ButtonBase
      onClick={() => onOpen(row.id)}
      sx={{
        alignItems: "center",
        borderTop: divider ? `1px solid ${t.color.divider}` : "none",
        display: "grid",
        gap: 2,
        gridTemplateColumns: columns,
        minHeight: 60,
        px: 2.5,
        py: 1.25,
        textAlign: "left",
        transition: `background-color ${t.motion.duration.fast}ms ${t.motion.easing.standard}`,
        width: "100%",
        "&:hover": { bgcolor: t.color.surfaceMuted },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap variant="subtitle2">{row.name}</Typography>
        <Typography color="text.secondary" component="p" sx={{ display: { md: "none" } }} variant="caption">
          {row.studentCount} người học · {row.classCount} lớp
        </Typography>
      </Box>
      <Box component="span" sx={{ alignItems: "center", bgcolor: status.tint.bg, borderRadius: `${t.radius.chip}px`, color: status.tint.color, display: "inline-flex", gap: 0.75, justifySelf: "start", px: 1.25, py: 0.25, typography: "caption", whiteSpace: "nowrap" }}>
        <Box component="span" sx={{ bgcolor: status.tint.dot, borderRadius: "50%", height: 6, width: 6 }} />
        {status.label}
      </Box>
      <Typography sx={{ ...desktopOnly, fontVariantNumeric: "tabular-nums", textAlign: "right" }} variant="body2">{row.studentCount}</Typography>
      <Typography sx={{ ...desktopOnly, fontVariantNumeric: "tabular-nums", textAlign: "right" }} variant="body2">{row.classCount}</Typography>
      <Box sx={{ ...desktopOnly, alignItems: "center", gap: 1.25 }}>
        {percent === null ? (
          <Typography color="text.disabled" variant="body2">—</Typography>
        ) : (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
            <LinearProgress aria-label={`Đã xếp môn ${percent}%`} value={percent} variant="determinate" sx={{ bgcolor: t.color.divider, borderRadius: 99, flex: 1, height: 6, "& .MuiLinearProgress-bar": { borderRadius: 99 } }} />
            <Typography sx={{ fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "right" }} variant="caption">{percent}%</Typography>
          </Box>
        )}
      </Box>
      <ChevronRightRoundedIcon sx={{ ...desktopOnly, color: "text.disabled" }} />
    </ButtonBase>
  );
}

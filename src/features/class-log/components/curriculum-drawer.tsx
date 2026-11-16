import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState, ErgSkeleton } from "@/components/erg-mui/erg-feedback";
import { ErgDrawer } from "@/components/erg-mui/erg-overlays";
import { ErgTable } from "@/components/erg-mui/erg-table";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

import { classLogText, groupCurriculum, periodRangeText } from "../domain/class-log-copy";
import { shortDateVi, weekdayVi } from "../domain/class-log-week";
import { useCurriculum } from "../hooks/use-class-log-queries";

export type CurriculumTarget = {
  classId: string;
  className: string;
  subjectId: string | null;
  subjectName: string;
  /** The period the teacher is looking at; its actual period is highlighted. */
  focus?: { date: string; periodNo: number; ppct: number; actual: number };
};

const cell = { border: `1px solid ${t.color.border}`, fontSize: t.type.small.fontSize, px: 1.5, py: 1 } as const;
const head = { ...cell, bgcolor: t.color.surfaceMuted, ...t.type.label } as const;

/** Right drawer without a scrim (the log stays usable behind it); read only, no action buttons. */
export function CurriculumDrawer({ target, onClose }: { target: CurriculumTarget | null; onClose: () => void }) {
  const query = useCurriculum(target?.classId ?? "", target?.subjectId ?? "", Boolean(target));
  const groups = groupCurriculum(query.data ?? []);
  const total = groups.at(-1)?.to ?? 0;
  const pick = target?.focus?.actual;
  const taught = pick ? pick - 1 : 0;
  const focus = target?.focus;

  return (
    <ErgDrawer
      description={target ? `${target.subjectName} · ${target.className}${total ? ` · đã dạy ${taught} / ${total} tiết` : ""}` : undefined}
      onClose={onClose}
      open={Boolean(target)}
      slotProps={{ paper: { sx: { top: 0, width: { xs: "100%", sm: 640 } } } }}
      title={classLogText.curriculumButton}
      variant="persistent"
    >
      {focus ? (
        <Box sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.control}px`, color: t.statusTint.info.color, display: "flex", fontSize: t.type.small.fontSize, gap: 1, mb: 1.5, px: 1.75, py: 1.25 }}>
          <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{`Sổ đầu bài · ${weekdayVi(focus.date)} ${shortDateVi(focus.date)} · Tiết ${focus.periodNo} · PPCT ${focus.ppct}`}</Box>
          <Box component="span" sx={{ color: t.color.textSecondary, ml: "auto" }}>{classLogText.curriculumView}</Box>
        </Box>
      ) : null}
      {query.isPending && query.fetchStatus !== "idle" ? <ErgSkeleton height={240} /> : null}
      {query.isError ? <ErgErrorState description={classLogText.loadError} title={classLogText.curriculumButton} /> : null}
      {!query.isPending && !query.isError && groups.length === 0 ? <Typography sx={{ color: "text.secondary", fontSize: t.type.small.fontSize }}>{classLogText.noCurriculum}</Typography> : null}
      {!target?.subjectId ? <Typography sx={{ color: "text.secondary", fontSize: t.type.small.fontSize }}>{classLogText.noCurriculum}</Typography> : null}
      {groups.length > 0 ? (
        <ErgTable aria-label="Khung chương trình">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...head, width: "27%" }}>Chủ đề</TableCell>
              <TableCell sx={{ ...head, textAlign: "center", width: 64 }}>Tiết</TableCell>
              <TableCell sx={head}>Tên bài học</TableCell>
              <TableCell sx={{ ...head, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g) => {
              const sel = pick !== undefined && pick >= g.from && pick <= g.to;
              const done = !sel && g.to <= taught;
              return (
                <TableRow aria-current={sel ? "true" : undefined} key={`${g.from}-${g.title}`} sx={sel ? { bgcolor: t.color.primarySofter } : undefined}>
                  <TableCell sx={{ ...cell, fontWeight: t.type.label.fontWeight }}>{g.topic}</TableCell>
                  <TableCell sx={{ ...cell, bgcolor: sel ? t.color.primary : undefined, color: sel ? "common.white" : done ? t.color.textMuted : undefined, fontWeight: sel ? 700 : 400, textAlign: "center" }}>{periodRangeText(g)}</TableCell>
                  <TableCell sx={{ ...cell, color: sel ? t.statusTint.info.color : done ? t.color.textMuted : undefined, fontWeight: sel ? 600 : 400 }}>{g.title}</TableCell>
                  <TableCell sx={{ ...cell, color: sel ? t.color.primary : t.color.success, fontWeight: "fontWeightBold", textAlign: "center" }}>{sel || done ? "✓" : ""}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </ErgTable>
      ) : null}
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, mt: 2 }}>
        <Typography sx={{ color: t.color.textMuted, flex: 1, fontSize: t.type.small.fontSize }}>{classLogText.curriculumFooter}</Typography>
        <ErgButton onClick={onClose} variant="outlined">Đóng</ErgButton>
      </Box>
    </ErgDrawer>
  );
}

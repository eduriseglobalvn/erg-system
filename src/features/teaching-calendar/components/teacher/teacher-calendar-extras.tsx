import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Link from "@mui/material/Link";

import { teacherPath } from "@/platform/workspaces/workspace-paths";
import { noticeBannerText, noticeLinkText, type ScheduleNotice } from "../../domain/schedule-notice";
import type { roleCounts, TeacherRoleFilter } from "../../domain/teacher-events";
import { SEMIBOLD, SIZE, t } from "./teacher-board-styles";

const leadOf = (text: string) => /^\d+ tiết (?:trợ giảng )?mới/.exec(text)?.[0] ?? "";

type NoticeProps = { compact?: boolean; notice?: ScheduleNotice; onSeen: () => void; others: number };

const linkSx = { color: t.color.primary, fontWeight: SEMIBOLD, textDecoration: "none", "&:hover": { color: t.color.primaryHover } } as const;

/** Banner thong bao lich moi (6.10 / 6.17): chi cai moi nhat, «Đã xem» = da doc, nhieu thi «và <n> thay đổi khác». Mobile: the 1 dong «N tiết mới từ … ›». */
export function ScheduleNoticeBanner({ compact = false, notice, onSeen, others }: NoticeProps) {
  if (!notice) return null;
  if (compact) {
    const link = noticeLinkText(notice).replace(/ ›$/, "");
    return (
      <Box component="a" href={teacherPath("/notifications")} onClick={onSeen} role="status" sx={{ bgcolor: t.color.primarySofter, border: 0, textDecoration: "none", borderRadius: `${t.radius.card}px`, color: t.schedule.published.text, cursor: "pointer", display: "flex", font: "inherit", fontSize: SIZE.panel, justifyContent: "space-between", mx: 2, my: "6px", px: 1.5, py: "10px", textAlign: "left" }}>
        <span><strong style={{ fontWeight: SEMIBOLD }}>{leadOf(link)}</strong>{link.slice(leadOf(link).length)}</span>
        <span>›</span>
      </Box>
    );
  }
  const text = noticeBannerText(notice);
  const lead = /^\d+ tiết (?:trợ giảng )?mới/.exec(text)?.[0] ?? "";
  return (
    <Box role="status" sx={{ alignItems: "center", bgcolor: t.color.primarySofter, borderRadius: `${t.radius.card}px`, color: t.schedule.published.text, display: "flex", justifyContent: "space-between", px: 2, py: "10px", typography: "body2" }}>
      <span>
        <strong style={{ fontWeight: SEMIBOLD }}>{lead}</strong>{text.slice(lead.length)}
        {others > 0 ? <Link href={teacherPath("/notifications")} sx={{ ...linkSx, ml: 1 }} underline="hover">và {others} thay đổi khác</Link> : null}
      </span>
      <Link component="button" onClick={onSeen} sx={linkSx} type="button" underline="none">Đã xem</Link>
    </Box>
  );
}

type RoleProps = { counts: ReturnType<typeof roleCounts>; fullWidth?: boolean; onChange: (role: TeacherRoleFilter) => void; value: TeacherRoleFilter };

/** Segmented control vai tro (6.17, 6.18): chi hien khi co it nhat mot tiet tro giang. Desktop 30 px / 13 px; mobile 3 cot / 12 px. */
export function TeacherRoleToggle({ counts, fullWidth = false, onChange, value }: RoleProps) {
  if (counts.assistant === 0) return null;
  const items: [TeacherRoleFilter, string][] = [["all", `Tất cả · ${counts.all}`], ["main", `Dạy chính · ${counts.main}`], ["assistant", `Trợ giảng · ${counts.assistant}`]];
  return (
    <Box aria-label="Vai trò" role="tablist" sx={{ bgcolor: t.color.divider, borderRadius: `${t.radius.control}px`, display: fullWidth ? "grid" : "flex", gridTemplateColumns: "repeat(3, 1fr)", ml: fullWidth ? 0 : 1, p: "2px" }}>
      {items.map(([key, label]) => (
        <ButtonBase
          aria-selected={value === key} key={key} onClick={() => onChange(key)} role="tab"
          sx={{ bgcolor: value === key ? t.color.surface : "transparent", borderRadius: "8px", boxShadow: value === key ? t.shadow.xs : "none", color: value === key ? t.color.text : t.color.textSecondary, fontSize: fullWidth ? SIZE.title : SIZE.panel, fontWeight: value === key ? SEMIBOLD : "inherit", height: 30, px: 1.5 }}
        >{label}</ButtonBase>
      ))}
    </Box>
  );
}

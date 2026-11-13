import { Fragment, useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ergChipTabsSx } from "@/components/erg-mui/erg-tabs";
import { ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { todayInput } from "@/domain/formatters/format-date";
import { leaderboardWeekLabel } from "@/features/elearning/class-leaderboard/leaderboard-period";
import { TIER_BANDS, TIER_KEYS, TIER_NAMES, formatViNumber, tierLabel, type TierKey } from "@/domain/student-tier/tiers";
import type { TierTableRow } from "@/features/elearning/student-tier/api/student-tier-api";
import { TierError, TierHeader, TierLoading, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useMyTier, useTierTable } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier, previousWeekStart, weekEndsAt } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

const STEPS = [
  ["Cộng XP cả khóa", "Mỗi bài nộp lần đầu đều cộng XP. XP chỉ tăng, không bị trừ."],
  ["Xếp hạng trong khối", "Xếp các bạn trong khối theo tổng XP."],
  ["Tra bảng ra bậc, cấp", "Cấp 5 thấp nhất, cấp 1 cao nhất."],
] as const;

const XP_SOURCES = [
  ["Hoàn thành bài (lần nộp đầu)", "+10 – 40"],
  ["Nộp trước hạn", "+10"],
  ["Chuỗi từ 7 ngày liên tiếp", "×1,2"],
  ["Làm lại, điểm số", "không tính"],
] as const;
const GREYED_SOURCE = "Làm lại, điểm số";

const rangeLabel = (from: number, to: number) => `hạng #${from}–${to}`;

function Cell({ division, minXp, from, to, mine }: { division: number | null; minXp: number; from: number; to: number; mine: boolean }) {
  return (
    <Box
      aria-current={mine ? "true" : undefined}
      data-design={mine ? "H18.myCell" : undefined}
      sx={{ bgcolor: mine ? t.color.primarySofter : t.color.surfaceMuted, border: 1, borderColor: mine ? "primary.main" : t.color.border, borderRadius: `${t.radius.control}px`, boxShadow: mine ? `0 0 0 2px ${t.color.primarySoft}` : "none", px: { xs: 0.5, md: 1.25 }, py: 1 }}
    >
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Typography variant="caption" sx={{ alignItems: "center", display: "flex", gap: 0.75, fontWeight: "fontWeightBold" }}>
          {division == null ? "Cao thủ" : `Cấp ${division}`}
          {mine ? <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 0.75 }}>Bạn</Box> : null}
        </Typography>
        <Typography variant="subtitle2">{`≥ ${formatViNumber(minXp)} XP`}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>{rangeLabel(from, to)}</Typography>
      </Box>
      {/* Phone (H18m): level on the first line, minimum XP on the second. */}
      <Box data-design="H18m.cell" sx={{ display: { xs: "grid", md: "none" }, justifyItems: "center", textAlign: "center" }}>
        <Typography component="span" variant="subtitle2">{division ?? "—"}</Typography>
        <Typography component="span" variant="subtitle2" sx={{ fontVariantNumeric: "tabular-nums" }}>{formatViNumber(minXp)}</Typography>
      </Box>
    </Box>
  );
}

function TierRow({ row, mineDivision, isMine, phone }: { row: TierTableRow; mineDivision: number | null; isMine: boolean; phone: boolean }) {
  const key = asTier(row.tierKey) as TierKey;
  const [open, setOpen] = useState(isMine);
  const divisions = [...row.divisions].sort((a, b) => (b.division ?? 0) - (a.division ?? 0));
  const lo = Math.min(...row.divisions.map((d) => d.rankFrom));
  const hi = Math.max(...row.divisions.map((d) => d.rankTo));
  const top = divisions[divisions.length - 1];
  return (
    <Box component="li" sx={{ bgcolor: isMine ? t.tierTint[key].from : "transparent", borderTop: 1, borderColor: t.color.divider, display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, listStyle: "none", px: { xs: 2, md: 2.5 }, py: { xs: 1.5, md: 1.25 } }}>
      <Box
        aria-expanded={open}
        component="button"
        onClick={() => setOpen((v) => !v)}
        sx={{ alignItems: "center", background: "none", border: 0, color: "inherit", cursor: { xs: "pointer", md: "default" }, display: "flex", font: "inherit", gap: 1.5, p: 0, textAlign: "left" }}
      >
        <ErgTierEmblem tier={key} size={34} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" component="span" sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            {TIER_NAMES[key]}
            {isMine ? <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 1, typography: "caption", display: { md: "none" } }}>{`Bạn · cấp ${mineDivision}`}</Box> : null}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${TIER_BANDS[key]}${phone ? ` · ${rangeLabel(lo, hi)}` : ` · ${row.seats} bạn`}`}</Typography>
        </Box>
        {top ? <Typography variant="subtitle2" sx={{ display: { md: "none" } }}>{`≥ ${formatViNumber(top.minXp)}`}</Typography> : null}
        <ExpandMoreRoundedIcon sx={{ display: { md: "none" }, transform: open ? "rotate(180deg)" : "none" }} />
      </Box>
      <Box sx={{ display: { xs: open ? "grid" : "none", md: "grid" }, gap: 1, gridTemplateColumns: { xs: "repeat(5, minmax(0, 1fr))", md: key === "ct" ? "1fr" : "repeat(5, minmax(0, 1fr))" } }}>
        {key === "ct" ? (
          <Box sx={{ bgcolor: t.color.surfaceMuted, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.control}px`, px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: "fontWeightBold" }}>Không chia cấp · các bạn Cao thủ xếp theo XP</Typography>
            {top ? <Typography variant="subtitle2">{`≥ ${formatViNumber(top.minXp)} XP`}</Typography> : null}
            <Typography variant="caption" sx={{ color: "text.secondary" }}>{rangeLabel(lo, hi)}</Typography>
          </Box>
        ) : divisions.map((d) => (
          <Cell key={d.division} division={d.division} minXp={d.minXp} from={d.rankFrom} to={d.rankTo} mine={isMine && d.division === mineDivision} />
        ))}
      </Box>
      {phone && open && key !== "ct" ? <Typography variant="caption" sx={{ color: "text.secondary" }}>Số to là cấp (5 thấp → 1 cao), số dưới là XP tối thiểu tuần này.</Typography> : null}
    </Box>
  );
}

/** "Bảng bậc & cấp" (design H18 web, H18m phone): how tier and level are computed, plus this week's XP thresholds from `tierTable`. */
export function TierTablePage({ accountId, gradeLabel = "khối", onBack }: { accountId: string; gradeLabel?: string; onBack?: () => void }) {
  const [week, setWeek] = useState<"this" | "last">("this");
  const weekStart = week === "last" ? previousWeekStart(todayInput()) : null;
  const weekName = leaderboardWeekLabel(weekEndsAt(week === "last", todayInput())).split(" · ")[0] || "tuần này";
  const table = useTierTable(accountId, weekStart);
  const mine = useMyTier(accountId);
  const mineTier = asTier(mine.data?.tierKey);
  const rows = TIER_KEYS.map((k) => table.data?.find((r) => r.tierKey === k)).filter((r): r is TierTableRow => Boolean(r)).reverse();
  const rank = mine.data?.gradeRank;
  const phone = useMediaQuery(useTheme().breakpoints.down("md"));
  const gradeName = gradeLabel.charAt(0).toUpperCase() + gradeLabel.slice(1);
  const yourDivision = rows.find((r) => r.tierKey === mineTier)?.divisions.find((d) => d.division === mine.data?.division);

  return (
    <Box sx={{ display: "grid", gap: 2.5, px: { xs: 2, md: 0 }, py: { xs: 2, md: 0 } }}>
      <TierHeader
        title="Bảng bậc & cấp"
        subtitle={`${gradeName}${mine.data?.gradeSize ? ` · ${mine.data.gradeSize} bạn` : ""} · mốc XP của ${weekName.toLowerCase()}, tính lại 0 giờ thứ Hai`}
        backLabel="Bậc của bạn"
        onBack={onBack}
        actions={(
          <Tabs aria-label="Tuần" value={week} sx={{ ...ergChipTabsSx, display: { xs: "none", md: "flex" } }} onChange={(_, v: "this" | "last") => setWeek(v)}>
            <Tab value="this" label={gradeName} />
            <Tab value="last" label="Tuần trước" />
          </Tabs>
        )}
      />
      <Box sx={{ display: "grid", gap: 2.5, alignItems: "start", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
        <Box sx={{ ...cardSx, p: { xs: 2, md: 2.5 } }}>
          {phone ? null : <Typography variant="h6" sx={{ mb: 2 }}>Bậc và cấp được tính thế nào?</Typography>}
          <Box component="ol" sx={{ display: { xs: "grid", md: "flex" }, gap: 2, listStyle: "none", m: 0, p: 0 }}>
            {STEPS.map(([title, body], i) => (
              <Fragment key={title}>
              {i > 0 ? <ArrowForwardRoundedIcon aria-hidden sx={{ alignSelf: "center", color: "text.secondary", display: { xs: "none", md: "block" }, flexShrink: 0 }} /> : null}
              <Box component="li" sx={{ display: "flex", flex: 1, gap: 1.5, minWidth: 0 }}>
                <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "primary.contrastText", display: "grid", flexShrink: 0, height: 28, placeItems: "center", typography: "caption", width: 28 }}>{i + 1}</Box>
                <Box>
                  <Typography variant="subtitle2">{phone && i === 1 ? `Xếp hạng trong ${gradeLabel.toLowerCase()}` : phone && i === 2 && yourDivision && mineTier ? `Tra bảng: hạng #${yourDivision.rankFrom}–${yourDivision.rankTo} = ${tierLabel(mineTier, mine.data?.division)}` : title}</Typography>
                  <Typography sx={{ ...t.type.small, color: "text.secondary" }}>
                    {i === 1 && rank && mine.data?.gradeSize ? phone ? `Bạn #${rank} / ${mine.data.gradeSize} với ${formatViNumber(mine.data.courseXp)} XP` : <>{`Xếp ${mine.data.gradeSize} bạn theo tổng XP. Bạn đang `}<b>{`#${rank}`}</b>{` với ${formatViNumber(mine.data.courseXp)} XP.`}</> : i === 2 && yourDivision && mineTier ? phone ? "Mỗi bậc 5 cấp: 5 thấp nhất → 1 cao nhất" : <>{`Hạng #${yourDivision.rankFrom}–${yourDivision.rankTo} là `}<b>{tierLabel(mineTier, mine.data?.division)}</b>{". Cấp 5 thấp nhất, cấp 1 cao nhất."}</> : phone && i === 0 ? "Bài nộp lần đầu +10–40, trước hạn +10, chuỗi 7 ngày ×1,2" : body}
                  </Typography>
                </Box>
              </Box>
              </Fragment>
            ))}
          </Box>
        </Box>
        <Box sx={{ ...cardSx, display: { xs: "none", md: "block" }, p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>XP đến từ đâu</Typography>
          {XP_SOURCES.map(([label, value]) => (
            <Box key={label} sx={{ borderTop: 1, borderColor: t.color.divider, display: "flex", justifyContent: "space-between", py: 1.5 }}>
              <Typography variant="body2" sx={label === GREYED_SOURCE ? { color: t.color.textMuted } : undefined}>{label}</Typography>
              <Typography variant={label === GREYED_SOURCE ? "body2" : "subtitle2"} sx={label === GREYED_SOURCE ? { color: t.color.textMuted } : undefined}>{value}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {table.isPending ? <TierLoading /> : table.isError ? <TierError onRetry={() => void table.refetch()} /> : (
        <Box sx={{ ...cardSx, overflow: "hidden", p: 0 }}>
          <Box aria-hidden sx={{ color: "text.secondary", display: { xs: "none", md: "grid" }, gridTemplateColumns: "220px repeat(5, minmax(0, 1fr))", gap: 1, px: 2.5, py: 1.25, typography: "caption", fontWeight: "fontWeightMedium" }}>
            <span>Bậc</span><span>Cấp 5 · mới vào</span><span>Cấp 4</span><span>Cấp 3</span><span>Cấp 2</span><span>Cấp 1 · sắp lên bậc</span>
          </Box>
          <Box component="ul" sx={{ m: 0, p: 0 }}>
            {rows.map((row) => <TierRow key={`${row.tierKey}-${row.tierKey === mineTier}`} row={row} isMine={row.tierKey === mineTier} phone={phone} mineDivision={mine.data?.division ?? null} />)}
          </Box>
        </Box>
      )}
      <Typography variant="caption" sx={{ alignItems: "center", color: "text.secondary", display: "flex", gap: 1 }}>
        <InfoOutlinedIcon sx={{ fontSize: t.size.iconSm }} />“≥ XP” là mốc tối thiểu tuần này để vào cấp đó; mốc đổi theo cả khối mỗi tuần. Chỉ xét bạn đã nộp ít nhất 3 bài. Tụt cấp/bậc chỉ khi ở dưới mốc 2 tuần liên tiếp.
      </Typography>
    </Box>
  );
}

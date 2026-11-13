import type { ReactNode } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import StairsRoundedIcon from "@mui/icons-material/StairsRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import visuallyHidden from "@mui/utils/visuallyHidden";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ergSegmentedTabsSx } from "@/components/erg-mui/erg-tabs";
import { ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { TIER_BANDS, TIER_KEYS, TIER_NAMES, formatViNumber, tierLabel, type TierKey } from "@/domain/student-tier/tiers";
import type { MyTier, TierTableRow } from "@/features/elearning/student-tier/api/student-tier-api";
import { TierAvatar, TierError, TierHeader, TierIneligible, TierLoading, TierProgress, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useMyFrames, useMyTier, useTierTable } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier, currentFrameYear, cutoffProgress, submitMoreLabel, topPercent } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

type Next = NonNullable<MyTier["nextDivision"]>;

export type MyTierPageProps = {
  accountId: string;
  studentName: string;
  /** "khối 7" */
  gradeLabel?: string;
  /** "Mùa 1 · khóa 2026–2027" */
  seasonLabel?: string;
  /** Open assignments summary for the call-to-action line. */
  openAssignments?: { count: number; xp: number } | null;
  onBack?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenTable?: () => void;
  onOpenFrames?: () => void;
  onDoAssignments?: () => void;
};

function NextGoal({ label, note, next, from, xp, tier, height = 12 }: { label: ReactNode; note: string; next: Next; /** XP cutoff the student started from (current division or tier floor). */ from: number | null | undefined; xp: number; tier: TierKey; height?: number }) {
  return (
    <Box>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{`${note} ${formatViNumber(next.minXp)} XP`}</Typography>
      </Box>
      <TierProgress tier={tier} value={cutoffProgress(xp, from, next.minXp)} height={height} />
    </Box>
  );
}

type HeroProps = { phone: boolean; studentName: string; tier: TierKey; me: MyTier; gradeLabel: string; row?: TierTableRow } & Pick<MyTierPageProps, "openAssignments" | "onDoAssignments">;

function Hero({ phone, studentName, tier, me, gradeLabel, row, openAssignments, onDoAssignments }: HeroProps) {
  const { nextDivision, nextTier } = me;
  const nextTierKey = asTier(nextTier?.tierKey);
  const nextDivisionKey = asTier(nextDivision?.tierKey) ?? tier;
  const filled = me.division ? 6 - me.division : 0;
  const cutoffs = row?.divisions.map((d) => d.minXp) ?? [];
  const divisionFrom = row?.divisions.find((d) => d.division === me.division)?.minXp;
  const tierFrom = cutoffs.length ? Math.min(...cutoffs) : null;
  const tint = t.tierTint[tier];
  return (
    <Box data-design="H15.hero" sx={{ ...cardSx, background: `linear-gradient(120deg, ${tint.from} 0, ${t.color.surface} 55%)`, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "auto minmax(0,520px)" }, justifyContent: "space-between", overflow: "hidden", position: "relative", "&::before": { background: `radial-gradient(circle, ${tint.glow}, transparent 70%)`, borderRadius: "50%", content: '""', height: 320, pointerEvents: "none", position: "absolute", right: -80, top: -80, width: 320 } }}>
      <Box sx={{ position: "relative", alignItems: "center", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, textAlign: { xs: "center", md: "left" } }}>
        <ErgTierEmblem tier={tier} size={phone ? 94 : 110} />
        <Box>
          {phone ? null : <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 1 }}>BẬC HIỆN TẠI</Typography>}
          <Typography component="p" data-design="H15.tierName" sx={{ ...t.type.display, color: t.tierTitle[tier] }}>{tierLabel(tier, me.division)}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            <Box component="strong" sx={{ color: "text.primary" }}>{`${formatViNumber(me.courseXp)} XP`}</Box>
            {` cả khóa · #${me.gradeRank} / ${me.gradeSize} ${gradeLabel}${phone ? "" : ` · top ${topPercent(me.gradeRank ?? 0, me.gradeSize ?? 0)}%`}`}
          </Typography>
          {filled ? (
            <>
              <Box aria-hidden data-design="H15.segments" sx={{ display: "flex", gap: 0.75, justifyContent: { xs: "center", md: "flex-start" }, my: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Box key={i} sx={{ background: i <= filled ? t.tierLine[tier] : t.color.divider, borderRadius: `${t.radius.chip}px`, height: 6, width: 30 }} />
                ))}
              </Box>
              {phone ? null : <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${TIER_NAMES[tier]} 5 → 4 → 3 → ${me.division} → 1`}</Typography>}
            </>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ alignContent: "center", display: "grid", gap: 2, position: "relative" }}>
        {nextDivision ? <NextGoal label={`Vượt ${nextDivision.studentsToPass} bạn trong khối lên ${tierLabel(nextDivisionKey, nextDivision.division)}`} note="mốc tuần này" next={nextDivision} from={divisionFrom} xp={me.courseXp} tier={tier} /> : null}
        {nextTier && nextTierKey ? <NextGoal label={phone ? <>Vượt {nextTier.studentsToPass} bạn lên <b>{TIER_NAMES[nextTierKey]}</b></> : <Box component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 1 }}><TierAvatar name={studentName} tier={nextTierKey} size={26} />{`Vượt ${nextTier.studentsToPass} bạn lên ${TIER_NAMES[nextTierKey]}, mở khung viền ${TIER_NAMES[nextTierKey]}`}</Box>} note={phone ? "mốc" : "mốc tuần này"} height={phone ? 8 : 12} next={nextTier} from={tierFrom} xp={me.courseXp} tier={nextTierKey} /> : null}
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <ErgButton data-design="H15.cta" variant="contained" trailingIcon={<ArrowForwardRoundedIcon />} onClick={onDoAssignments} sx={{ width: { xs: "100%", md: "auto" } }}>Làm bài lấy XP</ErgButton>
          {openAssignments && !phone ? <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${openAssignments.count} bài đang mở · tới +${formatViNumber(openAssignments.xp)} XP`}</Typography> : null}
        </Box>
      </Box>
    </Box>
  );
}

function Ladder({ current, seats, studentName, wide }: { current: TierKey; seats: Map<string, number>; studentName: string; wide: boolean }) {
  const at = TIER_KEYS.indexOf(current);
  return (
    <Box component="section" aria-label="8 bậc trong mùa" sx={wide ? cardSx : undefined}>
      {wide ? (
        <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">8 bậc trong mùa</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>Tỉ lệ cố định, mốc XP đổi theo cả khối · mỗi bậc mở một khung viền</Typography>
        </Box>
      ) : <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>8 bậc trong mùa</Typography>}
      <Box component="ol" sx={{ ...(wide ? {} : { ...cardSx, overflow: "hidden", p: 0, "& > li:not(:first-of-type)": { borderBottom: 1, borderColor: t.color.divider } }), display: "flex", flexDirection: { xs: "column-reverse", md: "row" }, listStyle: "none", m: 0, p: 0, position: "relative" }}>
        <Box aria-hidden data-design="H15.connector" sx={{ background: `linear-gradient(90deg, ${t.tierLine[current]} 0 ${((at + 0.5) / TIER_KEYS.length) * 100}%, ${t.color.divider} 0)`, borderRadius: `${t.radius.chip}px`, display: { xs: "none", md: "block" }, height: 4, left: "6%", position: "absolute", right: "6%", top: 34 }} />
        {TIER_KEYS.map((key, i) => {
          const past = i < at;
          const here = i === at;
          const seat = seats.get(key);
          return (
            <Box
              component="li"
              key={key}
              sx={{ alignItems: "center", position: "relative", bgcolor: { xs: here ? t.tierTint[key].from : "transparent", md: "transparent" }, display: "flex", flex: 1, flexDirection: { xs: "row", md: "column" }, gap: { xs: 1.5, md: 0.5 }, minHeight: { xs: 60, md: 0 }, minWidth: 0, px: { xs: 2, md: 0 }, py: { xs: 1, md: 0 }, textAlign: { xs: "left", md: "center" } }}
            >
              <Box sx={{ filter: i > at ? "grayscale(.85)" : undefined, opacity: i > at ? 0.5 : 1 }}><ErgTierEmblem tier={key} size={wide ? 64 : 38} /></Box>
              <Box sx={{ flex: { xs: 1, md: "none" }, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ color: here ? t.tierTitle[key] : "text.primary" }}>{TIER_NAMES[key]}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${TIER_BANDS[key]}${seat != null ? ` · ${seat} bạn` : ""}`}</Typography>
              </Box>
              <Box sx={{ alignItems: "center", display: "flex", flexDirection: { xs: "row", md: "column" }, gap: 0.75 }}>
                <TierAvatar name={studentName} tier={key} size={26} muted={i > at} />
                {here ? (
                  <Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 1, typography: "caption" }}>Bạn ở đây</Box>
                ) : (
                  <Typography variant="caption" sx={{ alignItems: "center", color: past ? "success.main" : "text.secondary", display: "inline-flex", gap: 0.5 }}>
                    {past ? <CheckCircleRoundedIcon sx={{ fontSize: t.size.iconSm }} /> : <LockOutlinedIcon sx={{ fontSize: t.size.iconSm }} />}
                    <Box component="span" sx={{ ...(wide ? {} : visuallyHidden) }}>{past ? "Đã qua" : key === "ct" ? "Top khóa" : "Chưa mở"}</Box>
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

const RULES = [
  [GroupsRoundedIcon, t.statusTint.info, "Bậc theo vị trí của bạn trong khối", "Xếp bạn trong khối theo tổng XP cả khóa rồi chia theo tỉ lệ: top 3% Cao thủ, 3–12% Kim cương, 12–25% Bạch kim, 25–45% Vàng… Cập nhật 0 giờ thứ Hai hằng tuần."],
  [StairsRoundedIcon, t.statusTint.warning, "Mỗi bậc có 5 cấp: 5 → 4 → 3 → 2 → 1", "Chia đều theo vị trí trong bậc. Mốc XP để lên bậc thay đổi theo cả khối, nên luôn hiện “mốc tuần này” để bạn biết cần bao nhiêu XP."],
  [VerifiedUserRoundedIcon, t.statusTint.success, "Có thể tụt bậc, nhưng có 1 tuần bảo vệ", "Chỉ tụt khi ở dưới mốc 2 lần cập nhật liên tiếp. Khung viền đã mở giữ mãi. Chỉ xét bạn đã nộp ít nhất 3 bài trong khóa."],
] as const;

function FramesCard({ accountId, studentName, tier, onOpenFrames }: { accountId: string; studentName: string; tier: TierKey; onOpenFrames?: () => void }) {
  const frames = useMyFrames(accountId);
  const year = currentFrameYear(frames.data?.frames ?? [], tier);
  return (
    <Box sx={cardSx}>
      <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5">Khung viền của bạn</Typography>
        <Button endIcon={<ChevronRightRoundedIcon />} onClick={onOpenFrames} size="small" sx={{ mr: -1 }} variant="text">Đổi khung</Button>
      </Box>
      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        {TIER_KEYS.map((key) => {
          const unlocked = Boolean(frames.data?.frames.find((f) => f.tierKey === key)?.unlocked);
          const using = frames.data?.selected === key;
          const earlier = frames.data?.frames.find((f) => f.tierKey === key)?.schoolYear;
          return (
            <Box key={key} sx={{ alignItems: "center", border: 1, borderColor: using ? "primary.main" : t.color.border, borderRadius: `${t.radius.card}px`, display: "grid", justifyItems: "center", p: 1 }}>
              <TierAvatar name={studentName} tier={key} size={34} muted={!unlocked} />
              <Typography variant="caption" sx={{ fontWeight: "fontWeightMedium" }}>{TIER_NAMES[key]}</Typography>
              <Typography variant="caption" sx={{ color: using ? "primary.main" : "text.secondary" }}>{using ? "Đang dùng" : unlocked ? (earlier && year && earlier !== year ? `Khóa ${earlier}` : "Đã mở") : `Bậc ${TIER_NAMES[key]}`}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/** "Bậc của bạn" (design H15 web, H15m phone): current tier, next goals, the 8-tier ladder, the rules and the frames. */
export function MyTierPage({ accountId, studentName, gradeLabel = "khối", seasonLabel = "Mùa 1", openAssignments, onBack, onOpenLeaderboard, onOpenTable, onOpenFrames, onDoAssignments }: MyTierPageProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("md"));
  const mine = useMyTier(accountId);
  const table = useTierTable(accountId, null);
  const me = mine.data;
  const tier = asTier(me?.tierKey);
  const seats = new Map((table.data ?? []).map((row) => [row.tierKey, row.seats]));

  return (
    <Box sx={{ display: "grid", gap: 2.5, maxWidth: 1100, mx: "auto", px: { xs: 2, md: 0 }, py: { xs: 2, md: 3 } }}>
      <TierHeader
        title="Bậc của bạn"
        subtitle={phone ? `${seasonLabel} · khóa 2026–2027` : me?.gradeSize ? `${seasonLabel} · xếp theo tỉ lệ trong ${gradeLabel} (${me.gradeSize} bạn) · cập nhật 0 giờ thứ Hai` : seasonLabel}
        onBack={onBack}
        actions={(
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <Tabs aria-label="Chế độ xem" value="tier" sx={{ ...ergSegmentedTabsSx, display: { xs: "none", md: "flex" } }} onChange={(_, v: string) => { if (v === "week") onOpenLeaderboard?.(); }}>
              <Tab value="week" label="Thi đua tuần" />
              <Tab value="tier" label="Bậc cả khóa" />
            </Tabs>
            <ErgIconButton label="Bảng bậc & cấp" onClick={onOpenTable} sx={{ display: { md: "none" } }}><HelpOutlineRoundedIcon /></ErgIconButton>
          </Box>
        )}
      />
      {mine.isPending ? <TierLoading /> : mine.isError || !me ? <TierError onRetry={() => void mine.refetch()} /> : !me.eligible || !tier ? (
        <TierIneligible message={submitMoreLabel(me.submittedCount)} />
      ) : (
        <>
          <Hero phone={phone} studentName={studentName} tier={tier} me={me} gradeLabel={gradeLabel} row={table.data?.find((r) => r.tierKey === tier)} openAssignments={openAssignments} onDoAssignments={onDoAssignments} />
          <Ladder current={tier} seats={seats} studentName={studentName} wide={!phone} />
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Box sx={cardSx}>
              <Typography variant="h5" sx={{ mb: 2 }}>Luật lên bậc</Typography>
              <Box sx={{ display: "grid", gap: 2 }}>
                {RULES.map(([Icon, tint, title, body]) => (
                  <Box key={title} sx={{ display: "flex", gap: 1.5 }}>
                    <Box aria-hidden sx={{ alignItems: "center", bgcolor: tint.bg, borderRadius: `${t.radius.sm}px`, color: tint.dot, display: "grid", flexShrink: 0, height: 32, placeItems: "center", width: 32 }}><Icon sx={{ fontSize: t.size.iconMd }} /></Box>
                    <Box><Typography variant="subtitle2">{title}</Typography><Typography variant="body2" sx={{ color: "text.secondary" }}>{body}</Typography></Box>
                  </Box>
                ))}
              </Box>
            </Box>
            <FramesCard accountId={accountId} studentName={studentName} tier={tier} onOpenFrames={onOpenFrames} />
          </Box>
        </>
      )}
    </Box>
  );
}

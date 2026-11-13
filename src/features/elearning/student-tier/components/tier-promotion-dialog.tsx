import { useState } from "react";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StairsRoundedIcon from "@mui/icons-material/StairsRounded";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { alpha, useTheme } from "@mui/material/styles";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgTierEmblem } from "@/components/erg-mui/erg-tier";
import { formatDateVi } from "@/domain/formatters/format-date";
import { TIER_NAMES, tierLabel } from "@/domain/student-tier/tiers";
import type { MyTier } from "@/features/elearning/student-tier/api/student-tier-api";
import { TierAvatar, TierProgress, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useAcknowledgePromotion, useMyTier, useSelectFrame } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

export type Promotion = NonNullable<MyTier["pendingPromotion"]>;

// Fixed confetti, as in the design: colour, left %, top %, rotation.
const CONFETTI = [
  [t.color.primary, 62, 14, 20], [t.color.warning, 38, 18, -30], [t.medal.gold, 74, 36, 45], [t.color.success, 80, 24, 0], [t.tier.vang.chip, 26, 40, -20], [t.tier.kc.chip, 58, 58, 30],
] as const;

const ghostCard = { bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "block" } as const;

/** Design H16 backdrop: the app shell as blurred white blocks under a scrim, so the dialog reads the same on every page. */
function BackdropGhost() {
  return (
    <Box aria-hidden sx={{ inset: 0, position: "absolute" }}>
      <Box sx={{ display: "flex", filter: "blur(2px)", gap: 2, inset: 16, opacity: 0.6, position: "absolute" }}>
        <Box sx={{ bgcolor: t.color.surface, borderRadius: `${t.radius.shell}px`, width: 232 }} />
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2 }}>
          <Box sx={{ ...ghostCard, height: 70 }} />
          <Box sx={{ ...ghostCard, height: 260 }} />
          <Box sx={{ ...ghostCard, flex: 1 }} />
        </Box>
      </Box>
      <Box sx={{ bgcolor: alpha(t.color.text, 0.38), inset: 0, position: "absolute" }} />
    </Box>
  );
}

type Props = {
  promotion: Promotion;
  studentName: string;
  /** "Tiếp: Bạc 4 · vượt 2 bạn" — from myTier.nextDivision. */
  next?: MyTier["nextDivision"];
  gradeLabel?: string;
  open: boolean;
  onClose: () => void;
  onUseFrame: () => void;
  onViewTier: () => void;
};

/** "Lên bậc" (design H16): a dialog on web, full screen on phones. Shown once per promotion; closing only marks it as seen. */
export function TierPromotionDialog({ promotion, studentName, next, gradeLabel = "khối", open, onClose, onUseFrame, onViewTier }: Props) {
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  const to = asTier(promotion.toKey);
  const from = asTier(promotion.fromKey);
  if (!to || !from) return null;
  const nextKey = asTier(next?.tierKey);
  const date = formatDateVi(promotion.weekStart).slice(0, 5);
  return (
    <Dialog
      aria-label={`Lên bậc ${TIER_NAMES[to]}`}
      fullScreen={phone}
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{ backdrop: { children: <BackdropGhost />, sx: { bgcolor: t.color.surfaceMuted } }, paper: { sx: { backgroundImage: `linear-gradient(180deg, ${t.color.surfaceSubtle} 0, ${t.color.surface} 60%)`, borderRadius: phone ? 0 : `${t.radius.shell}px`, maxWidth: 520, overflow: "hidden", position: "relative" } } }}
    >
      <Box aria-hidden data-design="H16.rays" sx={{ background: `repeating-conic-gradient(${alpha(t.medal.silver, 0.16)} 0 7deg, transparent 7deg 20deg)`, height: 760, left: "50%", mask: t.podium.raysMask, pointerEvents: "none", position: "absolute", top: 190, transform: "translate(-50%, -50%)", WebkitMask: t.podium.raysMask, width: 760 }} />
      {CONFETTI.map(([color, left, top, rotate]) => (
        <Box aria-hidden key={`${left}-${top}`} sx={{ background: color, borderRadius: "2px", height: 18, left: `${left}%`, position: "absolute", top: `${top}%`, transform: `rotate(${rotate}deg)`, width: 10 }} />
      ))}
      {!phone ? <ErgIconButton label="Đóng" onClick={onClose} sx={{ left: 12, position: "absolute", top: 12, zIndex: 1 }}><CloseRoundedIcon /></ErgIconButton> : null}
      <Box sx={{ display: "grid", gap: 2, justifyItems: "center", px: phone ? 3 : 5, pb: 3.5, pt: phone ? 6 : 3.5, position: "relative", textAlign: "center" }}>
        <Box sx={{ bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.chip}px`, px: 2, py: 0.75, typography: "caption" }}>{`🎉 Cập nhật bậc · thứ Hai ${date}`}</Box>
        <ErgTierEmblem tier={to} size={128} />
        <Typography component="h2" variant="h1" data-design="H16.title" sx={{ ...t.type.display, letterSpacing: "-0.01em", lineHeight: 1.15 }}>{`Lên bậc ${TIER_NAMES[to]}!`}</Typography>
        <Typography sx={{ ...t.type.pageLead, color: "text.secondary", mb: 1 }}>
          {"Tuần qua bạn vượt "}<Box component="strong" sx={{ color: "text.primary" }}>{`${promotion.studentsPassed} bạn`}</Box>{` trong ${gradeLabel} · giờ ở top ${promotion.gradePercentile}%`}
        </Typography>
        <Box sx={{ ...cardSx, alignItems: "center", borderRadius: "16px", display: "flex", gap: 1.75, justifyContent: "center", px: 2, py: 1.75, width: "100%" }}>
          <Box sx={{ opacity: 0.8 }}><ErgTierEmblem tier={from} size={40} /><Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{tierLabel(from, promotion.fromDivision)}</Typography></Box>
          <ArrowForwardRoundedIcon sx={{ color: "text.secondary" }} />
          <Box><ErgTierEmblem tier={to} size={48} /><Typography variant="caption" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{tierLabel(to, promotion.toDivision)}</Typography></Box>
        </Box>
        <Box sx={{ ...cardSx, alignItems: "center", borderRadius: "16px", display: "flex", gap: 1.75, px: 2, py: 1.75, textAlign: "left", width: "100%" }}>
          <TierAvatar name={studentName} tier={to} size={56} />
          <Box>
            <Typography variant="subtitle2">{`Khung viền ${TIER_NAMES[to]} đã mở`}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Hiện quanh ảnh của bạn trên bảng xếp hạng và trong menu</Typography>
          </Box>
        </Box>
        {next && nextKey ? (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, width: "100%" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{`Tiếp: ${tierLabel(nextKey, next.division)}`}</Typography>
            <Box sx={{ flex: 1 }}><TierProgress height={8} tier={to} value={0.12} /></Box>
            <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{`vượt ${next.studentsToPass} bạn`}</Typography>
          </Box>
        ) : null}
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: { xs: "column-reverse", sm: "row" }, flexWrap: "wrap", gap: 1, justifyContent: "flex-end", mt: 1.5, width: "100%" }}>
          <Typography variant="caption" sx={{ color: "text.secondary", flex: { sm: "1 0 100%" }, textAlign: { sm: "left" } }}>{phone ? "Đổi khung bất cứ lúc nào ở Hồ sơ › Khung viền" : "Đổi khung sau ở menu tài khoản › Khung viền"}</Typography>
          <ErgButton variant="text" onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>Để sau</ErgButton>
          <ErgButton variant="outlined" startIcon={<StairsRoundedIcon />} onClick={onViewTier} sx={{ display: { xs: "none", sm: "inline-flex" }, whiteSpace: "nowrap" }}>Xem bậc của tôi</ErgButton>
          <ErgButton autoFocus variant="contained" onClick={onUseFrame} sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "auto" } }}>{`Dùng khung ${TIER_NAMES[to]}`}</ErgButton>
        </Box>
      </Box>
    </Dialog>
  );
}

/**
 * Shows the dialog once while `myTier.pendingPromotion` exists. "Dùng khung" selects the new frame, "Để sau" / close only acknowledge it.
 * Mount it once in the student shell.
 */
export function TierPromotionGate({ accountId, studentName, gradeLabel, onViewTier }: { accountId: string; studentName: string; gradeLabel?: string; onViewTier: () => void }) {
  const mine = useMyTier(accountId);
  const ack = useAcknowledgePromotion(accountId);
  const frame = useSelectFrame(accountId);
  const [seen, setSeen] = useState<string | null>(null);
  const promotion = mine.data?.pendingPromotion;
  if (!promotion) return null;
  const done = () => { setSeen(promotion.weekStart); ack.mutate(promotion.weekStart); };
  return (
    <TierPromotionDialog
      gradeLabel={gradeLabel}
      next={mine.data?.nextDivision}
      onClose={done}
      onUseFrame={() => frame.mutate(promotion.toKey, { onSettled: done })}
      onViewTier={() => { done(); onViewTier(); }}
      open={seen !== promotion.weekStart}
      promotion={promotion}
      studentName={studentName}
    />
  );
}

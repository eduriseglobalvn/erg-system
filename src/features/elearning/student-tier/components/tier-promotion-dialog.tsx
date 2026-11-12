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
      slotProps={{ backdrop: { sx: { bgcolor: alpha(t.color.text, 0.38) } }, paper: { sx: { backgroundImage: `linear-gradient(180deg, ${t.color.surfaceSubtle} 0, ${t.color.surface} 60%)`, borderRadius: phone ? 0 : `${t.radius.shell}px`, maxWidth: 520, overflow: "hidden", position: "relative" } } }}
    >
      <Box aria-hidden sx={{ background: `repeating-conic-gradient(from 0deg at 50% 28%, ${alpha(t.color.borderStrong, 0.35)} 0 10deg, transparent 10deg 20deg)`, inset: 0, position: "absolute" }} />
      {CONFETTI.map(([color, left, top, rotate]) => (
        <Box aria-hidden key={`${left}-${top}`} sx={{ background: color, borderRadius: "2px", height: 18, left: `${left}%`, position: "absolute", top: `${top}%`, transform: `rotate(${rotate}deg)`, width: 10 }} />
      ))}
      {!phone ? <ErgIconButton label="Đóng" onClick={onClose} sx={{ left: 12, position: "absolute", top: 12, zIndex: 1 }}><CloseRoundedIcon /></ErgIconButton> : null}
      <Box sx={{ display: "grid", gap: 2, justifyItems: "center", p: 3, pt: 6, position: "relative", textAlign: "center" }}>
        <Box sx={{ bgcolor: t.color.surface, border: 1, borderColor: t.color.border, borderRadius: `${t.radius.chip}px`, px: 2, py: 0.75, typography: "caption" }}>{`🎉 Cập nhật bậc · thứ Hai ${date}`}</Box>
        <ErgTierEmblem tier={to} size={128} />
        <Typography component="h2" variant="h1" data-design="H16.title">{`Lên bậc ${TIER_NAMES[to]}!`}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {"Tuần qua bạn vượt "}<Box component="strong" sx={{ color: "text.primary" }}>{`${promotion.studentsPassed} bạn`}</Box>{` trong ${gradeLabel} · giờ ở top ${promotion.gradePercentile}%`}
        </Typography>
        <Box sx={{ ...cardSx, alignItems: "center", display: "flex", gap: 2, justifyContent: "center", width: "100%" }}>
          <Box sx={{ opacity: 0.8 }}><ErgTierEmblem tier={from} size={40} /><Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{tierLabel(from, promotion.fromDivision)}</Typography></Box>
          <ArrowForwardRoundedIcon sx={{ color: "text.secondary" }} />
          <Box><ErgTierEmblem tier={to} size={48} /><Typography variant="caption" sx={{ display: "block", fontWeight: "fontWeightBold" }}>{tierLabel(to, promotion.toDivision)}</Typography></Box>
        </Box>
        <Box sx={{ ...cardSx, alignItems: "center", display: "flex", gap: 2, textAlign: "left", width: "100%" }}>
          <TierAvatar name={studentName} tier={to} size={56} />
          <Box>
            <Typography variant="subtitle2">{`Khung viền ${TIER_NAMES[to]} đã mở`}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Hiện quanh ảnh của bạn trên bảng xếp hạng và trong menu</Typography>
          </Box>
        </Box>
        {next && nextKey ? (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, width: "100%" }}>
            <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{`Tiếp: ${tierLabel(nextKey, next.division)}`}</Typography>
            <Box sx={{ flex: 1 }}><TierProgress tier={to} value={0.12} /></Box>
            <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{`vượt ${next.studentsToPass} bạn`}</Typography>
          </Box>
        ) : null}
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: { xs: "column", sm: "row-reverse" }, gap: 1, justifyContent: { sm: "flex-start" }, width: "100%" }}>
          <ErgButton autoFocus variant="contained" onClick={onUseFrame} sx={{ width: { xs: "100%", sm: "auto" } }}>{`Dùng khung ${TIER_NAMES[to]}`}</ErgButton>
          <ErgButton variant="outlined" startIcon={<StairsRoundedIcon />} onClick={onViewTier} sx={{ display: { xs: "none", sm: "inline-flex" } }}>Xem bậc của tôi</ErgButton>
          <ErgButton variant="text" onClick={onClose}>Để sau</ErgButton>
          <Typography variant="caption" sx={{ color: "text.secondary", flex: { sm: 1 }, order: 3, textAlign: { sm: "left" } }}>{phone ? "Đổi khung bất cứ lúc nào ở Hồ sơ › Khung viền" : "Đổi khung sau ở menu tài khoản › Khung viền"}</Typography>
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

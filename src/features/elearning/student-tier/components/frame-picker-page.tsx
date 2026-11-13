import { useState, type ReactNode } from "react";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { toast } from "sonner";

import { ergMobileDockAnchor } from "@/components/portal/erg-mobile-dock";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTierChip } from "@/components/erg-mui/erg-tier";
import { TIER_KEYS, TIER_NAMES, formatViNumber, tierLabel, type TierKey } from "@/domain/student-tier/tiers";
import { TierAvatar, TierError, TierHeader, TierLoading, cardSx } from "@/features/elearning/student-tier/components/tier-parts";
import { useMyFrames, useMyTier, useSelectFrame } from "@/features/elearning/student-tier/components/use-student-tier";
import { asTier, currentFrameYear } from "@/features/elearning/student-tier/tier-format";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const t = ergEnterpriseTokens;

type Frame = { tierKey: string; unlocked: boolean; schoolYear: string | null; studentsToPass: number | null };

export type FramePickerPageProps = {
  accountId: string;
  studentName: string;
  className?: string;
  /** Viewer's place on the class board, for the preview row. */
  rank?: number | null;
  xp?: number | null;
  /** Frames unlocked in another school year read "Đã đạt ở khóa …". */
  currentSchoolYear?: string;
  onBack?: () => void;
  onDone?: () => void;
};

function tileNote(key: TierKey, frame: Frame | undefined, currentSchoolYear?: string) {
  if (!frame?.unlocked) {
    return `Lên ${TIER_NAMES[key]} để mở${frame?.studentsToPass ? ` · còn vượt ${frame.studentsToPass} bạn` : ""}`;
  }
  return frame.schoolYear && currentSchoolYear && frame.schoolYear !== currentSchoolYear ? `Đã đạt ở khóa ${frame.schoolYear}` : "Đã mở";
}

function Tile({ selected, disabled, onPick, name, avatar, caption, note, lock }: { selected: boolean; disabled?: boolean; onPick: () => void; name: string; avatar: ReactNode; caption?: string; note: string; lock?: boolean }) {
  return (
    <Box
      aria-checked={selected}
      aria-disabled={disabled}
      component="button"
      onClick={disabled ? undefined : onPick}
      role="radio"
      sx={{ alignContent: "start", bgcolor: disabled ? t.color.surfaceMuted : t.color.surface, border: 1, borderColor: selected ? "primary.main" : t.color.border, borderRadius: `${t.radius.card}px`, boxShadow: selected ? `0 0 0 3px ${t.color.primarySoft}` : "none", color: "text.primary", cursor: disabled ? "not-allowed" : "pointer", display: "grid", font: "inherit", gap: 0.5, justifyItems: "center", minHeight: 150, p: 1.5, position: "relative" }}
    >
      {selected ? <CheckCircleRoundedIcon color="primary" sx={{ position: "absolute", right: 8, top: 8 }} /> : null}
      {avatar}
      <Typography variant="subtitle2" component="span" sx={{ alignItems: "center", display: "inline-flex", gap: 0.5 }}>
        {name}{lock ? <LockOutlinedIcon aria-label="Chưa mở" sx={{ fontSize: t.size.iconSm }} /> : null}
      </Typography>
      <Typography variant="caption" component="span" sx={{ color: selected ? "primary.main" : "text.secondary" }}>{caption ?? note}</Typography>
    </Box>
  );
}

/** "Khung viền ảnh đại diện" (design H17 web, H17m phone): pick one unlocked frame or none, preview it, save. */
export function FramePickerPage({ accountId, studentName, className = "", rank, xp, currentSchoolYear, onBack, onDone }: FramePickerPageProps) {
  const phone = useMediaQuery(useTheme().breakpoints.down("md"));
  const frames = useMyFrames(accountId);
  const mine = useMyTier(accountId);
  const save = useSelectFrame(accountId);
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const saved = frames.data?.selected ?? null;
  const current = picked === undefined ? saved : picked;
  const currentTier = asTier(current);
  const realTier = asTier(mine.data?.tierKey);
  const unlockedCount = frames.data?.frames.filter((f) => f.unlocked).length ?? 0;
  const frameYear = currentFrameYear(frames.data?.frames ?? [], realTier, currentSchoolYear);
  const classLabel = /^lớps/i.test(className) ? className : `Lớp ${className}`;
  const firstName = studentName.split(" ").slice(-2).join(" ");

  const onSave = () => save.mutate(current, {
    onSuccess: () => { toast.success("Đã đổi khung viền"); setPicked(undefined); onDone?.(); },
  });

  const saveButton = (
    <ErgButton data-design="H17.save" variant="contained" disabled={current === saved || frames.isPending} loading={save.isPending} onClick={onSave} size={phone ? "large" : "medium"} sx={phone ? { bottom: ergMobileDockAnchor(8), left: 16, position: "fixed", right: 16, zIndex: (theme) => theme.zIndex.appBar } : undefined}>
      {currentTier ? `Lưu khung ${TIER_NAMES[currentTier]}` : "Lưu khung"}
    </ErgButton>
  );

  return (
    <Box sx={{ display: "grid", gap: phone ? 1.5 : 2.5, pb: { xs: 22, md: 0 } }}>
      <TierHeader
        title={phone ? "Khung viền" : "Khung viền ảnh đại diện"}
        subtitle={phone ? `Hồ sơ › Khung viền · ${unlockedCount} / 8 đã mở` : "Mở từ menu tài khoản › Khung viền, hoặc từ trang Bậc của bạn. Đổi bất cứ lúc nào."}
        onBack={onBack}
        actions={phone ? undefined : (
          <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
            <ErgButton variant="text" onClick={onBack}>Hủy</ErgButton>
            {saveButton}
          </Box>
        )}
      />
      {frames.isPending ? <TierLoading /> : frames.isError || !frames.data ? <TierError onRetry={() => void frames.refetch()} /> : (
        <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, alignItems: "start" }}>
          <Box sx={{ ...cardSx, display: "grid", gap: 1.5, justifyItems: "center", textAlign: "center" }}>
            {phone ? null : <Typography variant="caption" sx={{ color: "text.secondary", justifySelf: "start" }}>XEM TRƯỚC</Typography>}
            <TierAvatar name={studentName} tier={currentTier} size={phone ? 84 : 112} />
            <Typography variant="h5">{studentName}</Typography>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              {realTier ? <ErgTierChip tier={realTier}>{tierLabel(realTier, mine.data?.division)}</ErgTierChip> : null}
              {className ? <Typography variant="caption" sx={{ color: "text.secondary" }}>{classLabel}</Typography> : null}
            </Box>
            {rank != null ? (
              <Box sx={{ alignItems: "center", border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "flex", gap: 1.5, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
                <Typography variant="subtitle2">{rank}</Typography>
                <TierAvatar name={studentName} tier={currentTier} size={32} />
                <Box sx={{ flex: 1 }}><Typography variant="subtitle2" sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>{firstName}<Box component="span" sx={{ bgcolor: "primary.main", borderRadius: `${t.radius.chip}px`, color: "primary.contrastText", px: 0.75, typography: "caption" }}>Bạn</Box></Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>Bảng xếp hạng</Typography></Box>
                {xp != null ? <Typography variant="subtitle2">{formatViNumber(xp)}</Typography> : null}
              </Box>
            ) : null}
            <Box sx={{ alignItems: "center", border: 1, borderColor: t.color.border, borderRadius: `${t.radius.card}px`, display: "flex", gap: 1.5, px: 1.5, py: 1, textAlign: "left", width: "100%" }}>
              <TierAvatar name={studentName} tier={currentTier} size={32} />
              <Box><Typography variant="subtitle2">{firstName}</Typography><Typography variant="caption" sx={{ color: "text.secondary" }}>Bài viết trong Thảo luận</Typography></Box>
            </Box>
          </Box>
          <Box sx={phone ? undefined : cardSx}>
            {phone ? <Typography variant="overline" sx={{ color: "text.secondary", display: "block", mb: 1 }}>Chọn khung</Typography> : (
              <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h5">Khung của bạn</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>{`${unlockedCount} / 8 đã mở · khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới`}</Typography>
              </Box>
            )}
            <Box role="radiogroup" aria-label="Chọn khung" sx={{ display: "grid", gap: phone ? 1 : 1.5, gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(5, 1fr)" } }}>
              <Tile
                avatar={<Box sx={{ alignItems: "center", border: `2px dashed ${t.color.borderStrong}`, borderRadius: "50%", color: "text.secondary", display: "grid", height: phone ? 44 : 56, placeItems: "center", width: phone ? 44 : 56 }}><BlockRoundedIcon /></Box>}
                name="Không dùng"
                note="Ảnh không có khung"
                onPick={() => setPicked(null)}
                selected={current === null}
              />
              {TIER_KEYS.map((key) => {
                const frame = frames.data.frames.find((f) => f.tierKey === key);
                const unlocked = Boolean(frame?.unlocked);
                return (
                  <Tile
                    avatar={<TierAvatar name={studentName} tier={key} size={phone ? 44 : 56} muted={!unlocked} />}
                    caption={current === key ? "Đang dùng" : undefined}
                    disabled={!unlocked}
                    key={key}
                    lock={!unlocked}
                    name={TIER_NAMES[key]}
                    note={tileNote(key, frame, frameYear)}
                    onPick={() => setPicked(key)}
                    selected={current === key}
                  />
                );
              })}
            </Box>
            <Typography variant="caption" sx={{ alignItems: "center", color: "text.secondary", display: "flex", gap: 0.75, mt: 2 }}>
              {phone ? "Khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới." : <><InfoOutlinedIcon sx={{ fontSize: t.size.iconSm }} />Khung chỉ là trang trí, không đổi bậc hay XP. Bậc thật luôn hiện ở nhãn cạnh tên.</>}
            </Typography>
          </Box>
        </Box>
      )}
      {phone ? saveButton : null}
    </Box>
  );
}

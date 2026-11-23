import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import type { GameSource } from "@/features/games/game-types";
import { hk } from "@/features/games/hack/hack-tokens";
import { GAME_CATALOG, HACK_FACTS } from "@/features/games/teacher/game-catalog";
import { describeFiltered } from "@/features/games/teacher/room-settings";

const c = hk.color;
// Dark stage of the board: the hack backdrop with white text; the side panel keeps the same dark tone.
export const stageSx = { minHeight: "100dvh", bgcolor: c.bg, color: c.white, boxSizing: "border-box" } as const;
export const darkOutlineSx = { color: c.white, bgcolor: "transparent", borderColor: c.border, "&:hover": { borderColor: c.dim, bgcolor: c.panel } } as const;

type PickerStepProps = {
  quizTitle: string | undefined;
  source: GameSource | undefined;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
};

function Tile({ name, playable, chosen }: { name: string; playable: boolean; chosen: boolean }) {
  return (
    <ButtonBase
      disabled={!playable}
      aria-pressed={playable ? chosen : undefined}
      sx={{
        position: "relative", height: 156, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
        bgcolor: playable ? c.panel : c.disabled, color: playable ? c.green : c.dim, fontSize: playable ? hk.fs[34] : hk.fs[22], fontWeight: hk.font.weightBold,
        outline: chosen ? `3px solid ${c.white}` : "none", outlineOffset: 3, opacity: playable ? 1 : 0.75,
        transition: "transform 160ms", "&:hover": playable ? { transform: "scale(1.02)" } : undefined,
      }}
    >
      {playable ? `> ${name}` : name}
      <Box component="span" sx={{ position: "absolute", left: 12, bottom: 12, px: 1, borderRadius: 999, bgcolor: playable ? c.green : c.strike, color: c.bg, fontSize: hk.fs[12], fontWeight: hk.font.weightBold }}>
        {playable ? "Đang chọn" : "Sắp có"}
      </Box>
    </ButtonBase>
  );
}

/** LMS 2 · Chọn trò chơi (LmsPicker): only the first game is playable. */
export function PickerStep({ quizTitle, source, loading, onBack, onNext }: PickerStepProps) {
  const filtered = source ? describeFiltered(source.filteredByKind) : "";
  const facts = [...HACK_FACTS.cells.map(([label, value]) => ({ label, value, note: "" })), { label: "Bài đang chọn", value: source ? `${source.playableCount} / ${source.questionCount} câu chơi được` : loading ? "Đang tải..." : "Chưa chọn bài", note: filtered ? `bị lọc: ${filtered}` : "" }];
  return (
    <Box sx={{ ...stageSx, display: "flex", flexDirection: { xs: "column", md: "row" } }}>
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <ErgButton variant="outlined" size="small" leadingIcon={<ArrowBackIcon />} onClick={onBack} sx={darkOutlineSx}>Kho bài tập</ErgButton>
          <Typography component="h1" variant="h4" sx={{ fontWeight: "fontWeightBold" }}>Chọn trò chơi</Typography>
          <Typography variant="body2" sx={{ ml: "auto", color: c.dim }}>{quizTitle ?? source?.title ?? ""}{source ? ` · ${source.questionCount} câu` : ""}</Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          {GAME_CATALOG.map((game) => <Tile key={game.id} name={game.name} playable={game.playable} chosen={game.playable} />)}
        </Box>
        <Typography variant="caption" component="p" sx={{ mt: 2, color: c.dim }}>
          Mỗi trò là một ô có biểu tượng và màu riêng. Ô &quot;Sắp có&quot; chưa bấm được. Tên các ô sắp có chỉ là chỗ giữ chỗ, chưa phải đã chốt.
        </Typography>
      </Box>
      <Box component="aside" sx={{ width: { xs: "auto", md: 360 }, flexShrink: 0, p: 2.5, bgcolor: c.panel, borderLeft: { md: `1px solid ${c.border}` }, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" sx={{ color: c.mint }}>{HACK_FACTS.blurb}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          {facts.map((fact, index) => (
            <Box key={fact.label} sx={{ gridColumn: index === facts.length - 1 ? "1 / -1" : undefined, border: `1px solid ${c.border}`, borderRadius: 1.5, p: 1.25 }}>
              <Typography variant="caption" sx={{ color: c.dim }}>{fact.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: "fontWeightBold" }}>{fact.value}</Typography>
              {fact.note ? <Typography variant="caption" sx={{ color: c.yellow }}>{fact.note}</Typography> : null}
            </Box>
          ))}
        </Box>
        <Box sx={{ mt: "auto" }}>
          <ErgButton variant="contained" fullWidth size="large" disabled={!source} onClick={onNext}>Chơi trò này</ErgButton>
          <Typography variant="caption" component="p" sx={{ mt: 1, textAlign: "center", color: c.dim }}>{HACK_FACTS.note}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

import IconButton from "@mui/material/IconButton";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

export const choiceTileSx = (ok: boolean, isOver = false) => ({
  border: "1.5px solid", borderRadius: `${tokens.radius.card}px`, bgcolor: ok ? tokens.statusTint.success.bg : "background.paper",
  borderColor: ok ? "success.main" : isOver ? "primary.main" : tokens.color.border,
});

/** The letter button that marks a choice as correct. */
export function ChoiceMarker({ letter, ok, onClick }: { letter: string; ok: boolean; onClick: () => void }) {
  return (
    <IconButton
      aria-label={`${ok ? "Bỏ đánh dấu" : "Đánh dấu"} ${letter} là đáp án đúng`}
      onClick={onClick}
      sx={{
        width: 28, height: 28, borderRadius: 0.75, border: "1.5px solid", typography: "body2", fontWeight: "fontWeightMedium",
        borderColor: ok ? "success.main" : tokens.color.borderStrong, bgcolor: ok ? "success.main" : "transparent",
        color: ok ? "common.white" : "text.secondary", "&:hover": { bgcolor: ok ? "success.main" : "action.hover" },
      }}
    >
      {letter}
    </IconButton>
  );
}

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { type ContrastPair, formatRatio } from "@/features/lcms/quiz/quiz-theme/quiz-theme-contrast";
import type { QuizThemeCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

/** One line per measured pair: label, truncated ratio, and a pass/fail mark with text for screen readers. */
export function QuizThemeContrastRow({ copy, pairs }: { copy: QuizThemeCopy; pairs: ContrastPair[] }) {
  return (
    <Stack component="ul" aria-label={copy.contrast.title} sx={{ gap: 0.5, listStyle: "none", m: 0, p: 0 }}>
      {pairs.map((pair) => {
        const tint = t.statusTint[pair.pass ? "success" : "warning"];
        const Icon = pair.pass ? CheckRoundedIcon : WarningAmberRoundedIcon;
        return (
          <Stack component="li" key={pair.id} direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {copy.contrast.pairs[pair.id]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRatio(pair.ratio)}
            </Typography>
            <Stack direction="row" sx={{ alignItems: "center", color: tint.color, gap: 0.25, minWidth: 72 }}>
              <Icon aria-hidden fontSize="inherit" />
              <Typography variant="caption">{pair.pass ? copy.contrast.pass : copy.contrast.fail}</Typography>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

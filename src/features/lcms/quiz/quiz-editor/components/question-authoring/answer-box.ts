import type { Theme } from "@mui/material/styles";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** The green box around a correct answer the teacher types (short answer, numeric). */
export const answerBoxSx = {
  border: 1.5,
  borderStyle: "solid",
  borderColor: (t: Theme) => t.palette.success.main,
  bgcolor: tokens.statusTint.success.bg,
  borderRadius: `${tokens.radius.control}px`,
};

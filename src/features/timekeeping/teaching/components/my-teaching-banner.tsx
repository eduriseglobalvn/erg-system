import AccessTimeIcon from "@mui/icons-material/AccessTime";
import Box from "@mui/material/Box";

import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { MyBanner } from "../domain/teaching-copy";

const TONES = {
  notice: t.classLog.late,
  info: t.statusTint.info,
  ok: t.classLog.present,
} as const;

/** Banner under the tabs (6.3 desktop 12/16 with a clock, 6.4 phone 10/12 and shorter). The strong line and the hint stay two lines on desktop, one block on phone. */
export function MyTeachingBanner({ banner, mobile }: { banner: MyBanner; mobile: boolean }) {
  const tone = TONES[banner.tone];
  const inline = mobile && banner.tone === "ok" && banner.hint !== "";
  return (
    <Box sx={{ alignItems: "center", bgcolor: tone.bg, borderRadius: `${t.radius.card}px`, color: tone.color, display: "flex", gap: 1.5, px: mobile ? 1.5 : 2, py: mobile ? "10px" : 1.5 }}>
      {banner.tone === "notice" && !mobile ? <AccessTimeIcon aria-hidden sx={{ fontSize: t.size.iconMd }} /> : null}
      <Box sx={{ ...(mobile ? t.type.small : null), display: "flex", flex: 1, flexDirection: "column", gap: "2px" }}>
        {inline ? (
          <Box component="div"><Box component="span" sx={{ fontWeight: t.type.label.fontWeight }}>{banner.title}</Box> · {banner.hint}</Box>
        ) : (
          <>
            <Box component="strong" sx={{ fontWeight: t.type.label.fontWeight }}>{banner.title}</Box>
            {banner.hint ? <Box component="span" sx={t.type.small}>{banner.hint}</Box> : null}
          </>
        )}
      </Box>
    </Box>
  );
}

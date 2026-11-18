import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { HelpChapter } from "@/features/help/help-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const { color, radius, type } = ergEnterpriseTokens;

export const helpSectionSx = {
  bgcolor: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: `${radius.card}px`,
  p: { xs: 2, md: 3 },
  scrollMarginTop: 88,
} as const;

export function helpChapterAnchor(id: string) {
  return `help-${id}`;
}

export function HelpChapterSection({ chapter }: { chapter: HelpChapter }) {
  return (
    <Box component="section" id={helpChapterAnchor(chapter.id)} sx={helpSectionSx}>
      <Typography component="h2" variant="h6">{chapter.title}</Typography>
      {chapter.intro ? <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{chapter.intro}</Typography> : null}
      <Box component="ol" sx={{ display: "grid", gap: 1.5, listStyle: "none", m: 0, mt: 2, p: 0 }}>
        {chapter.steps.map((step, index) => (
          <Box component="li" key={step.text} sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "28px minmax(0, 1fr)" }}>
            <Box
              aria-hidden
              sx={{
                ...type.smallStrong,
                alignItems: "center",
                bgcolor: color.primarySofter,
                borderRadius: "50%",
                color: color.primary,
                display: "flex",
                height: 28,
                justifyContent: "center",
                width: 28,
              }}
            >
              {index + 1}
            </Box>
            <Box sx={{ display: "grid", gap: 1, minWidth: 0, pt: 0.25 }}>
              <Typography variant="body2">{step.text}</Typography>
              {step.note ? <Alert severity="info">{step.note}</Alert> : null}
              {step.warning ? <Alert severity="warning">{step.warning}</Alert> : null}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

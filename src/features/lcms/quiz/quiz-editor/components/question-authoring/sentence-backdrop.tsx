import Box from "@mui/material/Box";
import { Fragment } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { blankWord, sentenceParts, type BlankSentence } from "./blank-sentence";

const RING = `0 0 0 1.5px ${tokens.color.primary}`;
const SOFT = `0 0 0 3px ${tokens.color.primarySofter}`;
const CHIP_RING = `${SOFT}, 0 0 0 4.5px ${tokens.color.primary}`;

// Blank spans must never change layout, so no horizontal padding, margin or border: padding is faked with a shadow.
const blankSx = (style: "chip" | "underline", open: boolean) => ({
  position: "relative",
  ...(style === "chip"
    ? { bgcolor: tokens.color.primarySofter, borderRadius: `${tokens.radius.xs}px`, boxShadow: open ? CHIP_RING : SOFT }
    : { borderBottom: "2px solid", borderColor: "primary.main", boxShadow: open ? RING : "none" }),
  "&[data-badge]::after": {
    content: "attr(data-badge)",
    position: "absolute",
    top: 0,
    right: 0,
    transform: "translate(60%, -70%)",
    typography: "caption",
    lineHeight: 1,
    color: "primary.main",
    fontFamily: tokens.font.mono,
  },
});

/** Draws the textarea's text again behind it, with each blank highlighted in place. */
export function SentenceBackdrop({ sentence, blankStyle, badge, openId }: {
  sentence: BlankSentence;
  blankStyle: "chip" | "underline";
  badge?: (blankId: string) => string | undefined;
  openId: string | null;
}) {
  const parts = sentenceParts(sentence);
  return (
    <Box
      aria-hidden
      sx={{ position: "absolute", inset: 0, pointerEvents: "none", color: "transparent", whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
    >
      {sentence.blanks.map((b, i) => (
        <Fragment key={b.id}>
          {parts[i]}
          <Box component="span" data-badge={badge?.(b.id)} data-blank-id={b.id} sx={blankSx(blankStyle, b.id === openId)}>
            {blankWord(sentence, b)}
          </Box>
        </Fragment>
      ))}
      {parts[parts.length - 1]}
      {"​"}
    </Box>
  );
}

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { QuestionBankCategory } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";

/**
 * Topic column of A1. The API only reports the total of the current filter,
 * so the count shows on the active topic alone.
 * shortcut: no per-topic counts; add `questionCount` to the category DTO when the backend exposes it.
 */
export function QuestionBankTopicList({
  activeCount,
  activeTopicId,
  copy,
  levelLabel,
  onPick,
  topics,
}: {
  activeCount: number;
  activeTopicId: string;
  copy: QuestionBankCopy;
  levelLabel: string;
  onPick: (topicId: string) => void;
  topics: QuestionBankCategory[];
}) {
  const items = [{ id: "all", label: copy.allTopics }, ...topics];

  return (
    <Box component="nav" aria-label={copy.topicsHeading} sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        component="h2"
        sx={{ color: t.color.textMuted, display: { xs: "none", md: "block" }, letterSpacing: "0.04em", mb: 0.5, px: 1.25, py: 0.75, textTransform: "uppercase" }}
      >
        {copy.topicsHeading} · {levelLabel}
      </Typography>
      <Box
        component="ul"
        sx={{
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          gap: 0.5,
          listStyle: "none",
          m: 0,
          overflowX: { xs: "auto", md: "visible" },
          p: 0,
        }}
      >
        {items.map((topic) => {
          const active = topic.id === activeTopicId;
          return (
            <Box component="li" key={topic.id} sx={{ flex: "none" }}>
              <ButtonBase
                aria-current={active ? "true" : undefined}
                onClick={() => onPick(topic.id)}
                sx={{
                  alignItems: "center",
                  bgcolor: active ? t.color.primarySofter : "transparent",
                  borderRadius: `${t.radius.control}px`,
                  color: active ? t.color.primary : t.color.textSecondary,
                  display: "flex",
                  gap: 1,
                  justifyContent: "space-between",
                  minHeight: t.size.controlSm,
                  px: 1.25,
                  textAlign: "left",
                  transition: `background-color ${t.motion.duration.fast}ms ${t.motion.easing.standard}`,
                  width: { xs: "auto", md: "100%" },
                  "&:hover": { bgcolor: active ? t.color.primarySofter : t.color.surfaceMuted },
                  "&.Mui-focusVisible": { boxShadow: t.shadow.focus },
                }}
              >
                <Typography variant={active ? "subtitle2" : "body2"} component="span" noWrap>
                  {topic.label}
                </Typography>
                {active ? (
                  <Typography variant="caption" component="span" sx={{ color: t.color.primary }}>
                    {activeCount}
                  </Typography>
                ) : null}
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
      <Typography
        variant="caption"
        component="p"
        sx={{ borderTop: `1px solid ${t.color.divider}`, color: t.color.textMuted, display: { xs: "none", md: "block" }, mt: 1.5, p: 1.25 }}
      >
        {copy.topicsSourceNote}
      </Typography>
    </Box>
  );
}

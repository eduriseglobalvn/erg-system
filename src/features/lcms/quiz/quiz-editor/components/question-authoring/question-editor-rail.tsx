import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { useI18n } from "@/platform/i18n";
import { lifecycleLabel, slidePublishState } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { QuizEditorGroup, QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { questionTitleText, readinessLabel } from "./question-readiness";
import { readSlideReadiness } from "./slide-question";

export type RailEntry = { groupId: string; slide: QuizEditorSlide };

const DOT = { missing: "error.main", changed: "warning.main", ready: "success.main" } as const;

type Props = {
  groups: QuizEditorGroup[];
  entries: RailEntry[];
  selectedSlideId: string;
  onSelect: (groupId: string, slideId: string) => void;
  onAdd: () => void;
  quizProject: Pick<QuizProjectSettings, "publishedFingerprints">;
};

export function QuestionEditorRail({ groups, entries, selectedSlideId, onSelect, onAdd, quizProject }: Props) {
  const { t } = useI18n();
  const numbered = entries.map((entry, index) => ({ ...entry, number: index + 1 }));
  const statusOf = (slide: QuizEditorSlide): { key: keyof typeof DOT; label: string } => {
    const readiness = readSlideReadiness(slide, t);
    if (!readiness.ready) return { key: "missing", label: readinessLabel(readiness) };
    if (slidePublishState(slide, quizProject) === "changed") return { key: "changed", label: lifecycleLabel.changed };
    return { key: "ready", label: readinessLabel(readiness) };
  };

  return (
    <Box
      aria-label="Danh sách câu hỏi"
      component="nav"
      sx={{ bgcolor: "background.paper", borderColor: "divider", borderRight: 1, display: "flex", flexDirection: "column", flexShrink: 0, gap: 1.5, overflowY: "auto", p: 1.5, width: 240 }}
    >
      {groups.map((group) => {
        const rows = numbered.filter((entry) => entry.groupId === group.id);
        if (!rows.length) return null;
        return (
          <Box key={group.id}>
            <Typography color="text.secondary" component="h3" sx={{ letterSpacing: ".04em", px: 1, textTransform: "uppercase" }} variant="caption">
              {`${group.title} · ${rows.length} câu`}
            </Typography>
            {rows.map(({ slide, number }) => {
              const selected = slide.id === selectedSlideId;
              const status = statusOf(slide);
              return (
                <ButtonBase
                  aria-current={selected ? "true" : undefined}
                  key={slide.id}
                  onClick={() => onSelect(group.id, slide.id)}
                  sx={{
                    alignItems: "center", borderRadius: `${tokens.radius.control}px`, display: "grid", gap: 1, gridTemplateColumns: "22px 1fr 8px",
                    justifyItems: "start", px: 1, py: 0.75, textAlign: "left", width: "100%",
                    ...(selected ? { bgcolor: tokens.color.primarySofter, color: "primary.main", fontWeight: "fontWeightMedium" } : { "&:hover": { bgcolor: "action.hover" } }),
                  }}
                >
                  <Typography color={selected ? "inherit" : "text.secondary"} component="span" sx={{ fontVariantNumeric: "tabular-nums" }} variant="caption">
                    {String(number).padStart(2, "0")}
                  </Typography>
                  <Typography component="span" noWrap sx={{ fontWeight: "inherit", maxWidth: "100%" }} variant="body2">
                    {questionTitleText(slide.title)}
                  </Typography>
                  <Box aria-label={status.label} component="span" data-status={status.key} role="img" sx={{ bgcolor: DOT[status.key], borderRadius: "50%", height: 8, width: 8 }} />
                </ButtonBase>
              );
            })}
          </Box>
        );
      })}
      <ErgButton onClick={onAdd} startIcon={<AddIcon />} sx={{ mt: "auto" }}>
        Thêm câu
      </ErgButton>
    </Box>
  );
}

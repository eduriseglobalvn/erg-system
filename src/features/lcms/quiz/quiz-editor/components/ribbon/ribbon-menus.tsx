import { Box, ButtonBase, Paper, Typography } from "@mui/material";
import type { MessageKey } from "@/platform/i18n";
import { useI18n } from "@/platform/i18n";
import type {
  IntroSlideKind,
  QuestionCreationPreset,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  introSlideLabelKeys,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import {
  ClassicIntroPreview,
} from "@/features/lcms/quiz/quiz-editor/components/classic-editor-art";

const introOptions = Object.entries(introSlideLabelKeys) as Array<[IntroSlideKind, MessageKey]>;

const questionMenuOptions: Array<{
  label: string;
  demo: QuestionMenuDemoKind;
  type: QuestionType;
  preset?: QuestionCreationPreset;
}> = [
  { label: "True/False", demo: "true-false", type: "true-false" },
  { label: "Yes/No", demo: "yes-no", type: "true-false", preset: "yes-no" },
  { label: "Multiple Choice", demo: "multiple-choice", type: "multiple-choice" },
  { label: "Multiple Response", demo: "multiple-response", type: "multiple-response" },
  { label: "Fill in the Blank", demo: "fill-blank", type: "fill-in-the-blanks" },
  { label: "Matching", demo: "matching", type: "matching" },
  { label: "Sequence", demo: "sequence", type: "sequence" },
  { label: "Click Map", demo: "click-map", type: "hotspot" },
];

type QuestionMenuDemoKind =
  | "true-false"
  | "yes-no"
  | "multiple-choice"
  | "multiple-response"
  | "fill-blank"
  | "matching"
  | "sequence"
  | "click-map";

export function QuestionMenu({
  onSelect,
}: {
  onSelect: (type: QuestionType, preset?: QuestionCreationPreset) => void;
}) {
  return (
    <Paper
      elevation={8}
      className="classic-editor__popup classic-editor__popup--questions classic-editor__mui-popup"
      sx={{
        width: 224,
        maxWidth: "calc(100vw - 16px)",
        overflow: "hidden",
        border: "1px solid rgba(145, 158, 171, 0.24)",
        borderRadius: "10px",
        bgcolor: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.14)",
        py: 0.5,
      }}
    >
      {questionMenuOptions.map((option) => (
        <Box key={option.label}>
          <ButtonBase
            type="button"
            onClick={() => {
              onSelect(option.type, option.preset);
            }}
            className="classic-editor__popup-item classic-editor__mui-popup-item"
            sx={questionMenuItemSx}
          >
            <QuestionMenuIcon kind={option.demo} />
            <Typography component="span" sx={questionMenuLabelSx}>
              {option.label}
            </Typography>
          </ButtonBase>
        </Box>
      ))}
    </Paper>
  );
}

export function IntroductionMenu({ onSelect }: { onSelect: (type: IntroSlideKind) => void }) {
  const { t } = useI18n();

  return (
    <Paper
      elevation={8}
      className="classic-editor__popup classic-editor__popup--intro classic-editor__mui-popup"
      sx={{
        width: 372,
        overflow: "hidden",
        border: "1px solid rgba(145, 158, 171, 0.24)",
        borderRadius: "14px",
        bgcolor: "rgba(255, 255, 255, 0.98)",
        boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
      }}
    >
      <Typography
        component="div"
        sx={{
          borderBottom: "1px solid rgba(145, 158, 171, 0.18)",
          color: "#172033",
          fontSize: 13,
          fontWeight: 800,
          px: 2,
          py: 1.25,
        }}
      >
        {t("quiz.popupIntroduction")}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 1,
          p: 1.25,
        }}
      >
        {introOptions.map(([type, labelKey]) => (
          <ButtonBase
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className="classic-editor__popup-item classic-editor__mui-popup-item"
            sx={introPopupItemSx}
          >
            <ClassicIntroPreview type={type} />
            <Typography component="span" sx={popupLabelSx}>
              {t(labelKey)}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Paper>
  );
}

const questionPopupItemSx = {
  display: "flex",
  minHeight: 124,
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "space-between",
  border: "1px solid rgba(145, 158, 171, 0.16)",
  borderRadius: "12px",
  bgcolor: "rgba(255, 255, 255, 0.78)",
  p: 1.1,
  textAlign: "left",
  transition: "background 140ms ease, border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease",
  "&:hover": {
    borderColor: "rgba(15, 108, 189, 0.28)",
    bgcolor: "rgba(246, 250, 255, 0.96)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
    transform: "translateY(-1px)",
  },
  "&:focus-visible": {
    outline: "2px solid rgba(15, 108, 189, 0.34)",
    outlineOffset: 2,
  },
  "& .classic-editor__classic-preview": {
    flex: "1 1 auto",
  },
} as const;

const questionMenuItemSx = {
  display: "flex",
  width: "100%",
  minHeight: 30,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 0.9,
  borderRadius: "7px",
  bgcolor: "transparent",
  px: 1,
  py: 0.45,
  textAlign: "left",
  transition: "background 120ms ease, color 120ms ease",
  "&:hover": {
    bgcolor: "rgba(15, 108, 189, 0.08)",
    color: "var(--erg-blue, #0f6cbd)",
  },
  "&:focus-visible": {
    outline: "2px solid rgba(15, 108, 189, 0.34)",
    outlineOffset: 2,
  },
} as const;

const introPopupItemSx = {
  ...questionPopupItemSx,
  minHeight: 104,
} as const;

const popupLabelSx = {
  display: "block",
  color: "#263445",
  fontSize: 12.5,
  fontWeight: 800,
  lineHeight: 1.2,
} as const;

const questionMenuLabelSx = {
  color: "#172033",
  fontSize: 12.5,
  fontWeight: 650,
  lineHeight: 1.2,
} as const;

function QuestionMenuIcon({ kind }: { kind: QuestionMenuDemoKind }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        width: 24,
        height: 24,
        flex: "0 0 24px",
        placeItems: "center",
        borderRadius: "6px",
        bgcolor: "rgba(248, 251, 255, 0.92)",
        boxShadow: "inset 0 0 0 1px rgba(15, 108, 189, 0.18)",
      }}
    >
      <QuestionMenuGlyph kind={kind} />
    </Box>
  );
}

function QuestionMenuGlyph({ kind }: { kind: QuestionMenuDemoKind }) {
  if (kind === "true-false") {
    return (
      <Box sx={{ display: "flex", gap: 0.35 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#22C55E" }} />
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#FF5630" }} />
      </Box>
    );
  }

  if (kind === "yes-no") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <Box sx={{ width: 8, height: 7, borderRadius: "4px", bgcolor: "#22C55E" }} />
        <Box sx={{ width: 8, height: 7, borderRadius: "4px", bgcolor: "#FFAB00" }} />
      </Box>
    );
  }

  if (kind === "multiple-choice") {
    return (
      <Box sx={{ display: "grid", gap: "2px", width: 14 }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: item === 0 ? "#0f6cbd" : "transparent", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
            <Box sx={{ width: item === 1 ? 7 : 9, height: 1.5, borderRadius: 1, bgcolor: "rgba(15, 108, 189, 0.38)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "multiple-response") {
    return (
      <Box sx={{ display: "grid", gap: "2px", width: 14 }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <Box sx={{ width: 5, height: 5, borderRadius: "1.5px", bgcolor: item !== 1 ? "#0f6cbd" : "transparent", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
            <Box sx={{ width: item === 2 ? 6 : 9, height: 1.5, borderRadius: 1, bgcolor: "rgba(15, 108, 189, 0.38)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "fill-blank") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <Box sx={{ width: 5, height: 1.5, borderRadius: 1, bgcolor: "rgba(15, 108, 189, 0.35)" }} />
        <Box sx={{ width: 9, height: 5, borderRadius: "3px", bgcolor: "#fff", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
      </Box>
    );
  }

  if (kind === "matching") {
    return (
      <Box sx={{ position: "relative", display: "grid", gridTemplateColumns: "6px 8px 6px", gap: "1px", width: 22 }}>
        {[0, 1].map((item) => (
          <Box key={`left-${item}`} sx={{ gridColumn: 1, gridRow: item + 1, height: 4, borderRadius: "1.5px", bgcolor: "#fff", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
        ))}
        <Box component="svg" viewBox="0 0 8 10" sx={{ gridColumn: 2, gridRow: "1 / 3", width: 8, height: 10 }}>
          <path d="M1 2 C4 2 4 8 7 8" fill="none" stroke="#0f6cbd" strokeWidth="1" strokeLinecap="round" />
          <path d="M1 8 C4 8 4 2 7 2" fill="none" stroke="#7fb4e8" strokeWidth="1" strokeLinecap="round" />
        </Box>
        {[0, 1].map((item) => (
          <Box key={`right-${item}`} sx={{ gridColumn: 3, gridRow: item + 1, height: 4, borderRadius: "1.5px", bgcolor: "rgba(15, 108, 189, 0.14)", boxShadow: "inset 0 0 0 1px #7fb4e8" }} />
        ))}
      </Box>
    );
  }

  if (kind === "sequence") {
    return (
      <Box sx={{ display: "grid", gap: "2px", width: 16 }}>
        {[0, 1, 2].map((item) => (
          <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: item === 0 ? "#0f6cbd" : "rgba(15, 108, 189, 0.36)" }} />
            <Box sx={{ width: 10 - item * 1.5, height: 2.5, borderRadius: 1, bgcolor: "rgba(15, 108, 189, 0.22)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "click-map") {
    return (
      <Box sx={{ position: "relative", width: 16, height: 12, borderRadius: "3px", bgcolor: "rgba(15, 108, 189, 0.14)", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", right: 3, top: 3, width: 6, height: 6, borderRadius: "50%", border: "1.5px solid #0f6cbd", bgcolor: "rgba(255,255,255,0.72)" }} />
        <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 2, height: 1.5, bgcolor: "rgba(15, 108, 189, 0.28)" }} />
      </Box>
    );
  }
  return null;
}

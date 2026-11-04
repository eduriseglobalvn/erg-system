import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import type { QuestionCreationPreset, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuestionMenuGlyph } from "@/features/lcms/quiz/quiz-editor/components/ribbon/question-menu-glyphs";
import type { QuestionMenuOption } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus/question-menu-options";

export function QuestionOptionCard({
  option,
  onSelect,
}: {
  option: QuestionMenuOption;
  onSelect: (type: QuestionType, preset?: QuestionCreationPreset) => void;
}) {
  return (
        <ButtonBase
          key={option.id}
          type="button"
          onClick={() => {
            onSelect(option.type, option.preset);
          }}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "left",
            gap: 1.5,
            p: 1.25,
            borderRadius: "12px",
            bgcolor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            transition: "all 140ms cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            "&:hover": {
              bgcolor: "#F8FAFC",
              borderColor: "#0F6CBD",
              boxShadow: "0 8px 24px -4px rgba(15, 108, 189, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)",
              transform: "translateY(-1.5px)",
              "& .question-card__arrow": {
                bgcolor: "#0F6CBD",
                color: "#FFFFFF",
                transform: "scale(1.05)",
              },
              "& .question-card__preview": {
                borderColor: "rgba(15, 108, 189, 0.28)",
                boxShadow: "0 4px 12px rgba(15, 108, 189, 0.08)",
              },
            },
          }}
        >
          {/* Visual Thumbnail */}
          <Box
            className="question-card__preview"
            sx={{
              width: 82,
              height: 60,
              flexShrink: 0,
              borderRadius: "8px",
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              transition: "all 140ms ease",
            }}
          >
            <QuestionMenuGlyph kind={option.demo} />
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.65, mb: 0.35 }}>
              <Typography
                component="span"
                sx={{
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                }}
              >
                {option.label}
              </Typography>
              <Box component="span" sx={{ color: "#CBD5E1", fontSize: "11px" }}>
                •
              </Box>
              <Typography
                component="span"
                sx={{
                  color: "#0F6CBD",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {option.subLabel}
              </Typography>
            </Box>

            <Typography
              sx={{
                color: "#64748B",
                fontSize: "11px",
                lineHeight: 1.35,
                fontWeight: 500,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {option.description}
            </Typography>
          </Box>

          {/* Subtle Add Arrow Indicator */}
          <Box
            className="question-card__arrow"
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#F1F5F9",
              color: "#94A3B8",
              flexShrink: 0,
              transition: "all 140ms ease",
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 15 }} />
          </Box>
        </ButtonBase>
  );
}

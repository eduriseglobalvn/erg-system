import CheckIcon from "@mui/icons-material/Check";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FlagIcon from "@mui/icons-material/Flag";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type { CSSProperties } from "react";

import { questionLabel } from "@/components/quiz/player-shell-utils";
import type { Question } from "@/lib/types";

type QuestionNavigatorProps = {
  answeredQuestionIds: string[];
  className?: string;
  currentIndex: number;
  flaggedQuestionIds: string[];
  introSubtitle?: string;
  onIntroClick?: () => void;
  onJumpToQuestion: (index: number) => void;
  onQueryChange?: (query: string) => void;
  query?: string;
  questions: Question[];
  showIntro?: boolean;
  started: boolean;
  style?: CSSProperties;
};

const navigatorItemSx = {
  alignItems: "center",
  border: "1px solid",
  borderRadius: 1,
  display: "flex",
  gap: 1,
  justifyContent: "flex-start",
  minHeight: 60,
  px: 1,
  py: 1,
  position: "relative",
  textAlign: "left",
  transition: "box-shadow 160ms ease, border-color 160ms ease, background-color 160ms ease",
  width: "100%",
  "&:hover": { boxShadow: "0 4px 10px rgba(28,37,46,0.08)" },
  "&:focus-visible": { outline: "2px solid #000088", outlineOffset: 1 },
} as const;

export function QuestionNavigator({
  answeredQuestionIds,
  className = "",
  currentIndex,
  flaggedQuestionIds,
  introSubtitle,
  onIntroClick,
  onJumpToQuestion,
  onQueryChange,
  query = "",
  questions,
  showIntro = false,
  started,
  style,
}: QuestionNavigatorProps) {
  const answeredSet = new Set(answeredQuestionIds);
  const flaggedSet = new Set(flaggedQuestionIds);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredQuestions = normalizedQuery
    ? questions.filter((question, index) => `${index + 1}. ${question.title}`.toLowerCase().includes(normalizedQuery))
    : questions;

  return (
    <Box
      component="aside"
      className={className}
      style={style}
      sx={{
        bgcolor: "common.white",
        border: "1px solid rgba(145,158,171,0.16)",
        borderRadius: 1,
        boxShadow: "0 18px 45px rgba(28,37,46,0.08)",
        display: "flex",
        flexDirection: "column",
        minHeight: 380,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Box sx={{ bgcolor: "rgba(255,255,255,0.74)", borderBottom: "1px solid rgba(0,0,136,0.08)", px: 1, pt: 1 }}>
        <Box sx={{ bgcolor: "#000088", borderRadius: "8px 8px 0 0", color: "common.white", fontSize: 12, fontWeight: 700, px: 1.5, py: 0.75, textAlign: "center" }}>
          MỤC LỤC
        </Box>
      </Box>

      {onQueryChange ? (
        <Box sx={{ bgcolor: "rgba(247,248,255,0.76)", borderBottom: "1px solid rgba(0,0,136,0.08)", p: 1 }}>
          <TextField
            fullWidth
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tìm kiếm"
            slotProps={{
              htmlInput: { "aria-label": "Tìm kiếm câu hỏi" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#919EAB", fontSize: 16 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.82)", borderRadius: 1, height: 32, fontSize: 12 },
              "& .MuiOutlinedInput-input": { py: 0.75 },
            }}
          />
        </Box>
      ) : null}

      <Box sx={{ bgcolor: "rgba(247,248,255,0.76)", display: "flex", flex: 1, flexDirection: "column", gap: 0.75, overflow: "auto", p: 1 }}>
        {showIntro ? (
          <ButtonBase
            type="button"
            onClick={onIntroClick}
            sx={{ ...navigatorItemSx, bgcolor: "common.white", borderColor: "rgba(0,0,136,0.10)", minHeight: 56, pl: 1.5 }}
          >
            <Box sx={{ alignItems: "center", bgcolor: "common.white", border: "1px solid rgba(0,0,136,0.10)", borderRadius: 1.5, boxShadow: "0 4px 10px rgba(0,0,136,0.04)", color: "#919EAB", display: "grid", flex: "none", height: 32, placeItems: "center", width: 32 }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
            </Box>
            <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.5, justifyContent: "center", minWidth: 0 }}>
              <Box component="strong" sx={{ color: "#1C252E", display: "-webkit-box", fontSize: 11, fontWeight: 700, lineHeight: "16px", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>Trang giới thiệu</Box>
              {introSubtitle ? <Box component="small" sx={{ color: "#637381", fontSize: 10, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{introSubtitle}</Box> : null}
            </Box>
          </ButtonBase>
        ) : null}

        {filteredQuestions.map((question) => {
          const index = questions.findIndex((item) => item.id === question.id);
          const active = started && currentIndex === index;
          const answered = answeredSet.has(question.id);
          const flagged = flaggedSet.has(question.id);

          return (
            <ButtonBase
              key={question.id}
              type="button"
              onClick={() => onJumpToQuestion(index)}
              sx={{
                ...navigatorItemSx,
                bgcolor: active ? "#000088" : "common.white",
                borderColor: active ? "transparent" : "rgba(0,0,136,0.10)",
                boxShadow: active ? "0 8px 18px rgba(0,0,136,0.22)" : undefined,
                color: active ? "common.white" : "#1C252E",
                pl: 1.5,
              }}
            >
              {flagged ? (
                <Box component="span" aria-label="Đã đánh dấu" title="Đã đánh dấu" sx={{ alignItems: "center", bgcolor: "rgba(255,86,48,0.12)", borderRadius: 0.75, color: "#FF5630", display: "grid", height: 20, placeItems: "center", position: "absolute", right: 8, top: 8, width: 20 }}>
                  <FlagIcon sx={{ fontSize: 12 }} />
                </Box>
              ) : null}

              <Box component="span" sx={{ alignItems: "center", bgcolor: active ? answered ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.14)" : answered ? "rgba(34,197,94,0.12)" : "rgba(0,0,136,0.06)", borderRadius: 1.5, boxShadow: "0 4px 10px rgba(0,0,136,0.04)", color: active ? "common.white" : answered ? "#118D57" : "#000088", display: "inline-flex", flex: "none", fontSize: 12, fontWeight: 700, height: 32, justifyContent: "center", width: 32 }}>
                {answered ? <CheckIcon sx={{ fontSize: 16, strokeWidth: 3 }} /> : index + 1}
              </Box>

              <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: 0.25, justifyContent: "center", minWidth: 0, overflow: "hidden", pr: 2 }}>
                <Box component="strong" sx={{ color: active ? "common.white" : "#1C252E", display: "-webkit-box", fontSize: 11, fontWeight: 700, lineHeight: "16px", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>{question.title}</Box>
                <Box component="small" sx={{ color: active ? "rgba(255,255,255,0.78)" : "#919EAB", fontSize: 10, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{questionLabel(question)}</Box>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

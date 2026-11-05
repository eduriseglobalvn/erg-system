import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { QuestionCreationPreset, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuestionOptionCard } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus/question-option-card";
import { CATEGORY_TABS, QUESTION_MENU_OPTIONS, filterQuestionMenuOptions, type QuestionCategory } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus/question-menu-options";
import { IntroductionMenu } from "@/features/lcms/quiz/quiz-editor/components/ribbon/ribbon-menus/introduction-menu";

export function QuestionMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: QuestionType, preset?: QuestionCreationPreset) => void;
  onClose?: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(
    () => filterQuestionMenuOptions(activeCategory, searchQuery),
    [activeCategory, searchQuery],
  );

  return (
    <Paper
      elevation={12}
      sx={{
        width: 640,
        maxWidth: "calc(100vw - 20px)",
        maxHeight: "min(82vh, 600px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Top Header */}
      <Box
        sx={{
          px: 2.25,
          pt: 2,
          pb: 1.5,
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(180deg, #F8FAFD 0%, #FFFFFF 100%)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 1.5 }}>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "rgba(0, 113, 227, 0.08)",
                color: "#0071E3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HelpOutlineRoundedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "#0F172A",
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  letterSpacing: "-0.015em",
                }}
              >
                Chọn dạng câu hỏi
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontSize: 12,
                  fontWeight: 500,
                  display: "block",
                  mt: 0.25,
                }}
              >
                Mỗi dạng câu hỏi được tối ưu hóa giao diện cho học viên
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
            {/* Quick search input */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                height: 34,
                width: 175,
                px: 1.25,
                borderRadius: "999px",
                bgcolor: "#F1F5F9",
                border: "1px solid #E2E8F0",
                transition: "all 150ms ease",
                "&:focus-within": {
                  width: 205,
                  bgcolor: "#FFFFFF",
                  borderColor: "#0071E3",
                  boxShadow: "0 0 0 3px rgba(0, 113, 227, 0.12)",
                },
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 16, color: "#94A3B8", mr: 0.75, flexShrink: 0 }} />
              <InputBase
                placeholder="Tìm dạng câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  fontSize: 12.5,
                  color: "#0F172A",
                  width: "100%",
                  "& input": { p: 0 },
                }}
              />
              {searchQuery ? (
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  sx={{ p: 0.25, color: "#94A3B8", "&:hover": { color: "#475569" } }}
                >
                  <CloseRoundedIcon sx={{ fontSize: 14 }} />
                </IconButton>
              ) : null}
            </Box>

            {onClose ? (
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  width: 30,
                  height: 30,
                  color: "#64748B",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : null}
          </Box>
        </Box>

        {/* Category Pills */}
        <Box sx={{ display: "flex", flexDirection: "row", gap: 0.75, mt: 0.5 }}>
          {CATEGORY_TABS.map((tab) => {
            const isSelected = activeCategory === tab.key;
            const count =
              tab.key === "all"
                ? QUESTION_MENU_OPTIONS.length
                : QUESTION_MENU_OPTIONS.filter((o) => o.category === tab.key).length;

            return (
              <Chip
                key={tab.key}
                label={`${tab.label} (${count})`}
                size="small"
                onClick={() => setActiveCategory(tab.key)}
                sx={{
                  height: 26,
                  fontSize: 11.5,
                  fontWeight: isSelected ? 700 : 550,
                  bgcolor: isSelected ? "#0071E3" : "#F1F5F9",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  border: "1px solid",
                  borderColor: isSelected ? "#0071E3" : "transparent",
                  cursor: "pointer",
                  transition: "all 140ms ease",
                  "&:hover": {
                    bgcolor: isSelected ? "#0058B0" : "#E2E8F0",
                  },
                }}
              />
            );
          })}
        </Box>
      </Box>

      {/* Grid of question cards */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.75,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(148, 163, 184, 0.35)",
            borderRadius: 3,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            bgcolor: "rgba(148, 163, 184, 0.6)",
          },
        }}
      >
        {filteredOptions.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1.25,
              "@media (max-width: 580px)": {
                gridTemplateColumns: "1fr",
              },
            }}
          >
            {filteredOptions.map((option) => (
              <QuestionOptionCard key={option.id} option={option} onSelect={onSelect} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              py: 5,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 32, color: "#94A3B8" }} />
            <Typography variant="body2" sx={{ color: "#64748B", fontSize: 13, fontWeight: 550 }}>
              Không tìm thấy dạng câu hỏi nào phù hợp với &quot;{searchQuery}&quot;
            </Typography>
            <ButtonBase
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              sx={{
                mt: 0.5,
                px: 1.5,
                py: 0.65,
                borderRadius: "6px",
                bgcolor: "#F1F5F9",
                color: "#0071E3",
                fontSize: 12,
                fontWeight: 600,
                "&:hover": { bgcolor: "#E2E8F0" },
              }}
            >
              Xem tất cả dạng câu hỏi
            </ButtonBase>
          </Box>
        )}
      </Box>

      {/* Footer bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: "1px solid #F1F5F9",
          bgcolor: "#FAFBFD",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.75 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 14, color: "#0071E3" }} />
          <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", fontWeight: 500 }}>
            Nhấp vào dạng câu hỏi để thêm ngay vào vị trí hiện tại
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600 }}>
          {filteredOptions.length} / {QUESTION_MENU_OPTIONS.length} dạng
        </Typography>
      </Box>
    </Paper>
  );
}

export { IntroductionMenu };

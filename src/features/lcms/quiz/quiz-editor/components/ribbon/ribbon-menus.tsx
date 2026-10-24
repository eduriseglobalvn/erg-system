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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
import {
  QuestionMenuGlyph,
  type QuestionMenuDemoKind,
} from "@/features/lcms/quiz/quiz-editor/components/ribbon/question-menu-glyphs";

type QuestionCategory = "all" | "choice" | "interactive" | "media";

interface QuestionMenuOption {
  id: string;
  label: string;
  subLabel: string;
  description: string;
  category: "choice" | "interactive" | "media";
  categoryLabel: string;
  demo: QuestionMenuDemoKind;
  type: QuestionType;
  preset?: QuestionCreationPreset;
  keywords: string[];
}

const QUESTION_MENU_OPTIONS: QuestionMenuOption[] = [
  {
    id: "multiple-choice",
    label: "Trắc nghiệm (1 đáp án)",
    subLabel: "Single Choice",
    description: "Một đáp án đúng trong danh sách lựa chọn.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "multiple-choice",
    type: "multiple-choice",
    keywords: ["trac nghiem", "mot dap an", "single", "choice", "radio", "1"],
  },
  {
    id: "multiple-response",
    label: "Trắc nghiệm (Nhiều đáp án)",
    subLabel: "Multiple Answers",
    description: "Nhiều đáp án đúng, kiểm tra mức độ hiểu sâu kiến thức.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "multiple-response",
    type: "multiple-response",
    keywords: ["nhieu dap an", "checkbox", "multi", "nhieu lua chon"],
  },
  {
    id: "true-false",
    label: "True / False",
    subLabel: "Đúng hoặc Sai",
    description: "Hai lựa chọn đúng hoặc sai, chấm điểm tức thì.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "true-false",
    type: "true-false",
    keywords: ["dung sai", "true", "false", "dung", "sai"],
  },
  {
    id: "yes-no",
    label: "Yes / No",
    subLabel: "Có hoặc Không",
    description: "Biến thể xác nhận nhanh với cặp nhãn thân thiện.",
    category: "choice",
    categoryLabel: "Lựa chọn",
    demo: "yes-no",
    type: "true-false",
    preset: "yes-no",
    keywords: ["co khong", "yes", "no", "xac nhan"],
  },
  {
    id: "fill-blank",
    label: "Fill in the Blank",
    subLabel: "Điền chỗ trống",
    description: "Điền từ hoặc cụm từ còn thiếu trong câu/đoạn văn.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "fill-blank",
    type: "fill-in-the-blanks",
    keywords: ["dien vao cho trong", "dien tu", "khuyet", "blank"],
  },
  {
    id: "matching",
    label: "Matching",
    subLabel: "Ghép nối cặp",
    description: "Ghép các cặp tương ứng bằng đường nối trực quan.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "matching",
    type: "matching",
    keywords: ["ghep doi", "ghep cap", "noi", "match"],
  },
  {
    id: "sequence",
    label: "Sequence",
    subLabel: "Sắp xếp thứ tự",
    description: "Kéo thả sắp xếp các bước hoặc mốc thời gian chính xác.",
    category: "interactive",
    categoryLabel: "Điền & Ghép",
    demo: "sequence",
    type: "sequence",
    keywords: ["thu tu", "sap xep", "quy trinh", "order", "sequence"],
  },
  {
    id: "click-map",
    label: "Click Map",
    subLabel: "Điểm nóng ảnh",
    description: "Bấm chọn vùng mục tiêu đúng trên ảnh hoặc sơ đồ.",
    category: "media",
    categoryLabel: "Hình ảnh",
    demo: "click-map",
    type: "hotspot",
    keywords: ["hotspot", "ban do", "hinh anh", "click", "map", "vung"],
  },
];

const CATEGORY_TABS: Array<{ key: QuestionCategory; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "choice", label: "Trắc nghiệm" },
  { key: "interactive", label: "Điền & Ghép" },
  { key: "media", label: "Hình ảnh" },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function QuestionMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: QuestionType, preset?: QuestionCreationPreset) => void;
  onClose?: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const queryNormalized = normalizeText(searchQuery);

    return QUESTION_MENU_OPTIONS.filter((option) => {
      // Category filter
      if (activeCategory !== "all" && option.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (!queryNormalized) return true;

      const labelNorm = normalizeText(option.label);
      const subLabelNorm = normalizeText(option.subLabel);
      const descNorm = normalizeText(option.description);
      const keywordMatch = option.keywords.some((kw) =>
        normalizeText(kw).includes(queryNormalized),
      );

      return (
        labelNorm.includes(queryNormalized) ||
        subLabelNorm.includes(queryNormalized) ||
        descNorm.includes(queryNormalized) ||
        keywordMatch
      );
    });
  }, [activeCategory, searchQuery]);

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
                bgcolor: "rgba(15, 108, 189, 0.08)",
                color: "#0F6CBD",
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
                  fontWeight: 800,
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
                  borderColor: "#0F6CBD",
                  boxShadow: "0 0 0 3px rgba(15, 108, 189, 0.12)",
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
                  bgcolor: isSelected ? "#0F6CBD" : "#F1F5F9",
                  color: isSelected ? "#FFFFFF" : "#475569",
                  border: "1px solid",
                  borderColor: isSelected ? "#0F6CBD" : "transparent",
                  cursor: "pointer",
                  transition: "all 140ms ease",
                  "&:hover": {
                    bgcolor: isSelected ? "#0B5CAB" : "#E2E8F0",
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
                        fontWeight: 750,
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
                        fontWeight: 650,
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
                color: "#0F6CBD",
                fontSize: 12,
                fontWeight: 650,
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
          <LightbulbOutlinedIcon sx={{ fontSize: 14, color: "#0F6CBD" }} />
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

export function IntroductionMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: IntroSlideKind) => void;
  onClose?: () => void;
}) {
  const { t } = useI18n();

  const introOptions = Object.entries(introSlideLabelKeys) as Array<[IntroSlideKind, MessageKey]>;

  const introDescriptions: Record<IntroSlideKind, string> = {
    "intro-slide": "Tiêu đề, lời chào mừng và mô tả tóm tắt nội dung bài kiểm tra.",
    "user-info": "Thu thập họ tên, email, lớp hoặc mã học viên trước khi làm bài.",
    "instruction-slide": "Quy chế thi, hướng dẫn cách tính điểm và lưu ý quan trọng.",
  };

  return (
    <Paper
      elevation={12}
      sx={{
        width: 380,
        maxWidth: "calc(100vw - 20px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: "16px",
        bgcolor: "#FFFFFF",
        boxShadow: "0 24px 64px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Box
        sx={{
          px: 2,
          pt: 1.75,
          pb: 1.25,
          borderBottom: "1px solid #F1F5F9",
          background: "linear-gradient(180deg, #F8FAFD 0%, #FFFFFF 100%)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#0F172A",
                fontSize: 14.5,
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              {t("quiz.popupIntroduction")}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#64748B",
                fontSize: 11.5,
                fontWeight: 500,
                display: "block",
                mt: 0.25,
              }}
            >
              Màn mở đầu hoặc quy định trước khi bắt đầu câu hỏi
            </Typography>
          </Box>

          {onClose ? (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                width: 28,
                height: 28,
                color: "#64748B",
                borderRadius: "8px",
                "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        {introOptions.map(([type, labelKey]) => (
          <ButtonBase
            key={type}
            type="button"
            onClick={() => onSelect(type)}
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
              transition: "all 140ms ease",
              "&:hover": {
                bgcolor: "#F8FAFC",
                borderColor: "#0F6CBD",
                boxShadow: "0 8px 24px -4px rgba(15, 108, 189, 0.12)",
                transform: "translateY(-1.5px)",
                "& .intro-card__arrow": {
                  bgcolor: "#0F6CBD",
                  color: "#FFFFFF",
                },
              },
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 48,
                flexShrink: 0,
                borderRadius: "8px",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <ClassicIntroPreview type={type} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 750,
                  lineHeight: 1.2,
                }}
              >
                {t(labelKey)}
              </Typography>
              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: "11px",
                  lineHeight: 1.35,
                  mt: 0.35,
                }}
              >
                {introDescriptions[type]}
              </Typography>
            </Box>

            <Box
              className="intro-card__arrow"
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
        ))}
      </Box>
    </Paper>
  );
}

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import { ErgEmptyState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import type { BankQuestion } from "./types";

export function PickQuestionList({
  isQuestionsLoading,
  displayedQuestions,
  selectedQuestionIds,
  toggleQuestion,
}: {
  isQuestionsLoading: boolean;
  displayedQuestions: BankQuestion[];
  selectedQuestionIds: string[];
  toggleQuestion: (id: string) => void;
}) {
  return (
    <Stack spacing={1.25} sx={{ flex: 1, overflowY: "auto", p: { xs: 1.5, sm: 2 }, px: { sm: 3 } }}>
      {isQuestionsLoading && displayedQuestions.length === 0 ? (
        <Stack spacing={1.5} sx={{ py: 1 }}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.paper", p: 2, display: "grid", gap: 1.25 }}>
              <ErgSkeleton height={16} width="60%" />
              <ErgSkeleton height={16} width="40%" />
            </Box>
          ))}
        </Stack>
      ) : displayedQuestions.length === 0 ? (
        <ErgEmptyState icon={<HelpOutlineIcon />} title="Không tìm thấy câu hỏi phù hợp với bộ lọc hiện tại." />
      ) : (
        displayedQuestions.map((q, idx) => {
          const isSelected = selectedQuestionIds.includes(q.id);

          return (
            <Box
              key={q.id}
              onClick={() => toggleQuestion(q.id)}
              sx={{
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                border: 1,
                borderRadius: 1.5,
                p: { xs: 1.5, sm: 1.75 },
                px: { sm: 2 },
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                borderColor: isSelected ? "primary.main" : "divider",
                bgcolor: isSelected ? "action.selected" : "background.paper",
                "&:hover": isSelected ? undefined : { bgcolor: "action.hover" },
              }}
            >
              {/* Checkbox vuông tinh gọn */}
              <Box sx={{ pt: 0.25 }}>
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 20,
                    height: 20,
                    border: 1,
                    borderRadius: 0.75,
                    borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: isSelected ? "primary.main" : "background.paper",
                    color: "primary.contrastText",
                  }}
                >
                  {isSelected ? <CheckIcon fontSize="inherit" /> : null}
                </Box>
              </Box>

              {/* Nội dung câu hỏi gọn gàng */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary", fontWeight: "fontWeightBold" }}>
                    #{idx + 1}
                  </Typography>
                  <Typography variant="subtitle2" component="p">
                    {q.stem}
                  </Typography>
                </Box>

                {/* Dòng tags phân loại */}
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, pt: 0.25 }}>
                  <ErgStatusChip dot={false} label={q.levelLabel} />
                  <ErgStatusChip dot={false} label={q.categoryLabel} />
                  <ErgStatusChip
                    dot={false}
                    label={q.difficulty === "core" ? "Cơ bản" : q.difficulty === "stretch" ? "Nâng cao" : "Thử thách"}
                    tone={q.difficulty === "core" ? "success" : q.difficulty === "stretch" ? "warning" : "error"}
                  />
                  <ErgStatusChip dot={false} label={q.type === "multiple-choice" ? "Trắc nghiệm" : q.type} />
                </Box>
              </Box>
            </Box>
          );
        })
      )}
    </Stack>
  );
}

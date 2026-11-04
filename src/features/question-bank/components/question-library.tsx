import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { QuestionBankApiData } from "@/features/question-bank/api/question-bank-api";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

export function QuestionLibrary({
  copy,
  isLoading,
  onEditQuestion,
  onPageChange,
  onQuestionSelectAll,
  onQuestionToggle,
  onSearchChange,
  page,
  searchValue,
  selectedIds,
  visibleQuestions,
}: {
  copy: QuestionBankCopy;
  contentScope: ContentScope;
  isLoading: boolean;
  onEditQuestion: (question: QuestionBankQuestion) => void;
  onPageChange: (page: number) => void;
  onQuestionSelectAll: () => void;
  onQuestionToggle: (questionId: string) => void;
  onSearchChange: (value: string) => void;
  page: QuestionBankApiData["questionPage"];
  searchValue: string;
  selectedIds: string[];
  visibleQuestions: QuestionBankQuestion[];
}) {
  const visibleQuestionIds = visibleQuestions.map((question) => question.id);
  const allVisibleSelected =
    visibleQuestionIds.length > 0 && visibleQuestionIds.every((questionId) => selectedIds.includes(questionId));
  const someVisibleSelected = visibleQuestionIds.some((questionId) => selectedIds.includes(questionId));

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
      }}
    >
      {/* Table Toolbar */}
      <Box
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          justifyContent: "space-between",
          p: { xs: 2, md: 2.25 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {copy.libraryTitle}
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8125rem", fontWeight: 500, mt: 0.25 }}>
            {copy.libraryDescription(page.totalItems)}
          </Typography>
        </Box>

        {/* Apple Spotlight Search */}
        <TextField
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.searchPlaceholder}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: 19 }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: "rgba(0, 0, 0, 0.03)",
                borderRadius: "11px",
                fontSize: "0.85rem",
                transition: "all 0.15s ease",
                width: { md: 320, xs: "100%" },
                "& fieldset": { borderColor: ergEnterpriseTokens.color.border },
                "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.18)" },
                "&.Mui-focused fieldset": {
                  borderColor: ergEnterpriseTokens.color.primary,
                  boxShadow: `0 0 0 3px ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
                },
              },
            },
          }}
        />
      </Box>

      {/* Table Header Bar */}
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: "rgba(250, 250, 252, 0.95)",
            borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
            color: ergEnterpriseTokens.color.textMuted,
            display: "grid",
            fontSize: "0.72rem",
            fontWeight: 600,
            gap: 0,
            gridTemplateColumns: {
              xs: "44px minmax(0, 1fr) 80px",
              md: "44px minmax(0, 1fr) minmax(140px, 190px) 84px",
            },
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            "& > *": {
              alignItems: "center",
              display: "flex",
              minHeight: 40,
              px: 1.5,
            },
          }}
        >
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={!allVisibleSelected && someVisibleSelected}
            disabled={!visibleQuestionIds.length || isLoading}
            onChange={onQuestionSelectAll}
            slotProps={{ input: { "aria-label": copy.selectAllVisible } }}
            size="small"
            sx={{
              color: "rgba(0, 0, 0, 0.25)",
              justifySelf: "center",
              p: 0.5,
              "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: ergEnterpriseTokens.color.primary },
            }}
          />
          <span>{copy.table.question}</span>
          <Box
            component="span"
            sx={{
              alignItems: "center",
              display: { xs: "none", md: "flex" },
              minHeight: 40,
            }}
          >
            {copy.table.topic}
          </Box>
          <Box
            component="span"
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              minHeight: 40,
            }}
          >
            {copy.table.actions}
          </Box>
        </Box>

        {/* Rows or Empty State */}
        <Stack spacing={0}>
          {isLoading ? (
            <QuestionSheetSkeletonRows rowCount={Math.max(visibleQuestions.length || 0, 5)} />
          ) : visibleQuestions.length === 0 ? (
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                justifyContent: "center",
                py: 8,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                  borderRadius: "50%",
                  color: ergEnterpriseTokens.color.primary,
                  display: "flex",
                  height: 56,
                  justifyContent: "center",
                  width: 56,
                }}
              >
                <QuizOutlinedIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.95rem", fontWeight: 600 }}>
                {copy.noResults}
              </Typography>
              <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", maxWidth: 420, lineHeight: 1.45 }}>
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm. Hãy thử đổi môn học hoặc xóa từ khóa.
              </Typography>
            </Box>
          ) : (
            visibleQuestions.map((question) => {
              const selected = selectedIds.includes(question.id);

              return (
                <Box
                  key={question.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onQuestionToggle(question.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onQuestionToggle(question.id);
                    }
                  }}
                  sx={{
                    alignItems: "center",
                    bgcolor: selected ? alpha(ergEnterpriseTokens.color.primary, 0.04) : "#FFFFFF",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                    cursor: "pointer",
                    display: "grid",
                    gap: 0,
                    gridTemplateColumns: {
                      xs: "44px minmax(0, 1fr) 80px",
                      md: "44px minmax(0, 1fr) minmax(140px, 190px) 84px",
                    },
                    transition: "all 0.12s ease",
                    "& > *": {
                      minHeight: 56,
                      px: 1.5,
                      py: 1.2,
                    },
                    "&:hover": {
                      bgcolor: selected ? alpha(ergEnterpriseTokens.color.primary, 0.07) : alpha(ergEnterpriseTokens.color.primary, 0.025),
                    },
                  }}
                >
                  <Box onClick={(event) => event.stopPropagation()} sx={{ display: "flex", justifyContent: "center" }}>
                    <Checkbox
                      checked={selected}
                      onChange={() => onQuestionToggle(question.id)}
                      slotProps={{ input: { "aria-label": copy.selectQuestionLabel(question.stem) } }}
                      size="small"
                      sx={{
                        color: "rgba(0, 0, 0, 0.25)",
                        p: 0.5,
                        "&.Mui-checked": { color: ergEnterpriseTokens.color.primary },
                      }}
                    />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      title={question.stem}
                      sx={{
                        color: ergEnterpriseTokens.color.text,
                        display: "-webkit-box",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        lineHeight: 1.45,
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                      }}
                    >
                      {question.stem}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.4, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: ergEnterpriseTokens.color.textMuted,
                          flex: "0 1 auto",
                          fontSize: "0.76rem",
                          fontWeight: 500,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {question.objective}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                          borderRadius: "4px",
                          color: ergEnterpriseTokens.color.primary,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          px: 0.75,
                          py: 0.15,
                        }}
                      >
                        {copy.scopeLabel(question.scope)}
                      </Box>
                    </Stack>
                  </Box>

                  <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, minWidth: 0 }}>
                    <Box
                      component="span"
                      sx={{
                        bgcolor: "rgba(0, 0, 0, 0.04)",
                        borderRadius: "6px",
                        color: "#48484A",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        px: 1,
                        py: 0.35,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {question.categoryLabel}
                    </Box>
                  </Box>

                  <Box
                    onClick={(event) => event.stopPropagation()}
                    sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}
                  >
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => onEditQuestion(question)}
                      sx={{
                        borderRadius: "8px",
                        color: ergEnterpriseTokens.color.primary,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        minWidth: 0,
                        px: 1,
                        textTransform: "none",
                        "&:hover": { bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08) },
                      }}
                    >
                      {copy.editQuestion}
                    </Button>
                  </Box>
                </Box>
              );
            })
          )}
        </Stack>

        {/* Pagination Bar */}
        <Box
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            borderTop: `1px solid ${ergEnterpriseTokens.color.border}`,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8rem", fontWeight: 550 }}>
            {copy.pageSummary(page.page + 1, Math.max(page.totalPages, 1), page.totalItems)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasPrevious}
              onClick={() => onPageChange(Math.max(0, page.page - 1))}
              sx={{
                borderColor: "rgba(0, 0, 0, 0.12)",
                borderRadius: "9px",
                color: ergEnterpriseTokens.color.text,
                fontSize: "0.8rem",
                fontWeight: 600,
                px: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                "&.Mui-disabled": { borderColor: ergEnterpriseTokens.color.border },
              }}
            >
              {copy.previousPage}
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasNext}
              onClick={() => onPageChange(page.page + 1)}
              sx={{
                borderColor: "rgba(0, 0, 0, 0.12)",
                borderRadius: "9px",
                color: ergEnterpriseTokens.color.text,
                fontSize: "0.8rem",
                fontWeight: 600,
                px: 1.5,
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                "&.Mui-disabled": { borderColor: ergEnterpriseTokens.color.border },
              }}
            >
              {copy.nextPage}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

function QuestionSheetSkeletonRows({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 4), 6) }).map((_, index) => (
        <Box
          key={`question-skeleton-${index}`}
          sx={{
            alignItems: "center",
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
            display: "grid",
            gap: 0,
            gridTemplateColumns: {
              xs: "44px minmax(0, 1fr) 80px",
              md: "44px minmax(0, 1fr) minmax(140px, 190px) 84px",
            },
            minHeight: 56,
            px: 1.5,
            py: 1.2,
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="rounded" width={18} height={18} sx={{ borderRadius: "4px" }} />
          </Box>
          <Box sx={{ minWidth: 0, pr: 2 }}>
            <Skeleton variant="text" width="68%" height={20} />
            <Skeleton variant="text" width="42%" height={16} sx={{ mt: 0.4 }} />
          </Box>
          <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" } }}>
            <Skeleton variant="rounded" width={84} height={22} sx={{ borderRadius: "6px" }} />
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="text" width={36} height={20} />
          </Box>
        </Box>
      ))}
    </>
  );
}

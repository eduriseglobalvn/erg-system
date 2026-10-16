import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { QuestionBankApiData } from "@/features/lcms/quiz/question-bank/api/question-bank-api";
import type { QuestionBankQuestion } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { ERG_SHEET_COLORS } from "./question-bank-primitives";

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
      variant="outlined"
      sx={{
        bgcolor: "transparent",
        borderColor: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", md: "center" },
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          justifyContent: "space-between",
          px: 2.5,
          py: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#111827", fontSize: 16, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.libraryTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650, mt: 0.35 }}>
            {copy.libraryDescription(page.totalItems)}
          </Typography>
        </Box>
        <TextField
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={copy.searchPlaceholder}
          size="small"
          sx={{
            width: { xs: "100%", md: 360 },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#fff",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "#94a3b8", height: 18, width: 18 }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Box sx={{ bgcolor: ERG_SHEET_COLORS.frame, p: 0 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: ERG_SHEET_COLORS.header,
            color: "#64748b",
            display: "grid",
            fontSize: 11,
            fontWeight: 850,
            gap: 0,
            gridTemplateColumns: {
              xs: "40px minmax(0,1fr) 70px",
              md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
            },
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            "& > *": {
              alignItems: "center",
              borderRight: "2px solid #fff",
              display: "flex",
              minHeight: 40,
              px: 1.5,
            },
            "& > *:last-child": { borderRight: 0 },
          }}
        >
          <Checkbox
            checked={allVisibleSelected}
            indeterminate={!allVisibleSelected && someVisibleSelected}
            disabled={!visibleQuestionIds.length || isLoading}
            onChange={onQuestionSelectAll}
            slotProps={{ input: { "aria-label": copy.selectAllVisible } }}
            size="small"
            sx={{ justifySelf: "center", p: 0.5 }}
          />
          <span>{copy.table.question}</span>
          <Box
            component="span"
            sx={{
              alignItems: "center",
              display: { xs: "none", md: "flex" },
              justifyContent: "center",
              minHeight: 40,
              textAlign: "center",
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
              textAlign: "center",
            }}
          >
            {copy.table.actions}
          </Box>
        </Box>

        <Stack spacing={0}>
          {isLoading ? (
            <QuestionSheetSkeletonRows rowCount={Math.max(visibleQuestions.length || 0, 8)} />
          ) : visibleQuestions.map((question, index) => {
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
                  bgcolor: selected ? ERG_SHEET_COLORS.selected : index % 2 === 0 ? ERG_SHEET_COLORS.rowOdd : ERG_SHEET_COLORS.rowEven,
                  borderBottom: "2px solid #fff",
                  boxShadow: selected ? "inset 3px 0 0 #0f6cbd" : "none",
                  cursor: "pointer",
                  display: "grid",
                  gap: 0,
                  gridTemplateColumns: {
                    xs: "40px minmax(0,1fr) 70px",
                    md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
                  },
                  transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                  "& > *": {
                    borderRight: "2px solid #fff",
                    minHeight: 58,
                    px: 1.5,
                    py: 1.2,
                  },
                  "& > *:last-child": { borderRight: 0 },
                  "&:hover": {
                    bgcolor: selected ? ERG_SHEET_COLORS.selectedHover : ERG_SHEET_COLORS.hover,
                    boxShadow: `inset 3px 0 0 ${ERG_SHEET_COLORS.hoverBorder}`,
                  },
                }}
              >
                <Box onClick={(event) => event.stopPropagation()} sx={{ justifySelf: "center" }}>
                  <Checkbox
                    checked={selected}
                    onChange={() => onQuestionToggle(question.id)}
                    slotProps={{ input: { "aria-label": copy.selectQuestionLabel(question.stem) } }}
                    size="small"
                    sx={{ p: 0.5 }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    title={question.stem}
                    sx={{
                      color: "#111827",
                      display: "-webkit-box",
                      fontSize: 14,
                      fontWeight: 760,
                      lineHeight: 1.45,
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {question.stem}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mt: 0.5, minWidth: 0 }}>
                    <Typography
                      sx={{
                        color: "#64748b",
                        flex: "0 1 auto",
                        fontSize: 12.5,
                        fontWeight: 550,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {question.objective}
                    </Typography>
                    <Chip
                      label={copy.scopeLabel(question.scope)}
                      size="small"
                      sx={{
                        bgcolor: alpha("#0f6cbd", 0.08),
                        color: "#0f5f9f",
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 800,
                        height: 22,
                      }}
                    />
                    <Chip
                      label={question.categoryLabel}
                      size="small"
                      sx={{
                        display: { xs: "inline-flex", md: "none" },
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 750,
                        height: 22,
                      }}
                    />
                  </Stack>
                </Box>

                <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, justifyContent: "center", minWidth: 0 }}>
                  <Chip
                    label={question.categoryLabel}
                    size="small"
                    sx={{
                      bgcolor: "#fff",
                      border: `1px solid ${alpha("#64748b", 0.16)}`,
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 750,
                      maxWidth: "100%",
                    }}
                  />
                </Box>

                <Box onClick={(event) => event.stopPropagation()} sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => onEditQuestion(question)}
                    sx={{ borderRadius: 2, fontSize: 12, fontWeight: 800, minWidth: 0, px: 1 }}
                  >
                    {copy.editQuestion}
                  </Button>
                </Box>
              </Box>
            );
          })}
          {!isLoading && visibleQuestions.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                alignItems: "center",
                borderColor: alpha("#64748b", 0.18),
                borderRadius: 0,
                borderStyle: "dashed",
                color: "#94a3b8",
                display: "flex",
                fontSize: 14,
                fontStyle: "italic",
                fontWeight: 650,
                justifyContent: "center",
                minHeight: 116,
              }}
            >
              {copy.noResults}
            </Paper>
          ) : null}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            bgcolor: "#fff",
            borderTop: "2px solid #fff",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650 }}>
            {copy.pageSummary(page.page + 1, Math.max(page.totalPages, 1), page.totalItems)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasPrevious}
              onClick={() => onPageChange(Math.max(0, page.page - 1))}
              sx={{ borderRadius: 2, fontWeight: 750 }}
            >
              {copy.previousPage}
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={!page.hasNext}
              onClick={() => onPageChange(page.page + 1)}
              sx={{ borderRadius: 2, fontWeight: 750 }}
            >
              {copy.nextPage}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
}

function QuestionSheetSkeletonRows({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 6), 12) }).map((_, index) => (
        <Box
          key={`question-skeleton-${index}`}
          sx={{
            alignItems: "center",
            bgcolor: index % 2 === 0 ? ERG_SHEET_COLORS.rowOdd : ERG_SHEET_COLORS.rowEven,
            borderBottom: "2px solid #fff",
            display: "grid",
            gap: 0,
            gridTemplateColumns: {
              xs: "40px minmax(0,1fr) 70px",
              md: "40px minmax(0,1fr) minmax(140px,190px) 78px",
            },
            "& > *": {
              borderRight: "2px solid #fff",
              minHeight: 58,
              px: 1.5,
              py: 1.2,
            },
            "& > *:last-child": { borderRight: 0 },
          }}
        >
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="rounded" width={18} height={18} sx={{ borderRadius: 1 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Skeleton variant="text" width="62%" height={20} />
            <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }}>
              <Skeleton variant="text" width="38%" height={16} />
              <Skeleton variant="rounded" width={56} height={20} sx={{ borderRadius: 10 }} />
            </Stack>
          </Box>
          <Box sx={{ alignItems: "center", display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            <Skeleton variant="rounded" width={92} height={24} sx={{ borderRadius: 10 }} />
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", justifyContent: "center" }}>
            <Skeleton variant="text" width={36} height={20} />
          </Box>
        </Box>
      ))}
    </>
  );
}

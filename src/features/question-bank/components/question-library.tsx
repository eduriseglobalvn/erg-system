import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { ErgEmptyState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { questionTypeLabelKeys } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankApiData } from "@/features/question-bank/api/question-bank-api";
import type { QuestionBankDifficulty, QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";

const DIFFICULTY_TONE: Record<QuestionBankDifficulty, "neutral" | "info" | "warning"> = {
  core: "neutral",
  stretch: "info",
  challenge: "warning",
};

/** Below lg the topic column eats the width, so only checkbox, question and action stay. Widths exclude the 32px cell padding. */
const wideOnly = { display: { xs: "none", lg: "table-cell" } } as const;

export function QuestionLibrary({
  copy,
  isLoading,
  loadFailed = false,
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
  isLoading: boolean;
  /** The load failed: the sync notice explains it, so no misleading "no matching questions". */
  loadFailed?: boolean;
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
  const { t: translate } = useI18n();
  const selected = new Set(selectedIds);
  const allSelected = visibleQuestions.length > 0 && visibleQuestions.every((question) => selected.has(question.id));
  const someSelected = visibleQuestions.some((question) => selected.has(question.id));
  const firstNumber = page.page * page.size + 1;

  return (
    <ErgDataTableShell
      toolbar={
        <ErgTableToolbar
          title={copy.libraryTitle}
          meta={copy.libraryDescription(page.totalItems)}
          actions={
            <TextField
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={copy.searchPlaceholder}
              size="small"
              slotProps={{
                htmlInput: { "aria-label": copy.searchPlaceholder },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: t.color.textMuted, fontSize: t.size.iconMd }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />
          }
        />
      }
      footer={
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" }, borderTop: `1px solid ${t.color.border}`, justifyContent: "space-between", px: 2, py: 1.5 }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {copy.pageSummary(page.page + 1, Math.max(page.totalPages, 1), page.totalItems)}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={!page.hasPrevious} onClick={() => onPageChange(Math.max(0, page.page - 1))}>
              {copy.previousPage}
            </Button>
            <Button variant="outlined" disabled={!page.hasNext} onClick={() => onPageChange(page.page + 1)}>
              {copy.nextPage}
            </Button>
          </Stack>
        </Stack>
      }
    >
      <ErgTable size="small" aria-label={copy.libraryTitle}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                disabled={!visibleQuestions.length || isLoading}
                onChange={onQuestionSelectAll}
                slotProps={{ input: { "aria-label": copy.selectAllVisible } }}
                size="small"
              />
            </TableCell>
            <TableCell sx={{ ...wideOnly, width: 40 }}>{copy.table.number}</TableCell>
            <TableCell>{copy.table.question}</TableCell>
            <TableCell sx={{ ...wideOnly, width: 120 }}>{copy.table.type}</TableCell>
            <TableCell sx={{ ...wideOnly, width: 96 }}>{copy.table.difficulty}</TableCell>
            <TableCell sx={{ ...wideOnly, width: 80 }}>{copy.table.used}</TableCell>
            <TableCell align="right" sx={{ width: 64 }}>
              <Box component="span" sx={visuallyHidden}>{copy.table.actions}</Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : visibleQuestions.length === 0 ? (
            loadFailed ? null : (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6 }}>
                  <ErgEmptyState title={copy.noResults} description={copy.noResultsHint} />
                </TableCell>
              </TableRow>
            )
          ) : (
            visibleQuestions.map((question, index) => {
              const isSelected = selected.has(question.id);
              return (
                <TableRow
                  key={question.id}
                  hover
                  selected={isSelected}
                  onClick={() => onQuestionToggle(question.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onQuestionToggle(question.id)}
                      slotProps={{ input: { "aria-label": copy.selectQuestionLabel(question.stem) } }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textMuted }}>{firstNumber + index}</TableCell>
                  <TableCell sx={{ minWidth: 0 }}>
                    <Typography variant="body2" title={question.stem} sx={clampTwoLines}>
                      {question.stem}
                    </Typography>
                    {question.objective ? (
                      <Typography variant="caption" noWrap component="p" sx={{ color: t.color.textMuted, mt: 0.25 }}>
                        {question.objective}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>
                    {translate(questionTypeLabelKeys[question.type])}
                  </TableCell>
                  <TableCell sx={wideOnly}>
                    <ErgStatusChip dot={false} label={copy.difficulty[question.difficulty]} tone={DIFFICULTY_TONE[question.difficulty]} />
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{copy.usedCount(question.usageCount)}</TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <Button variant="text" size="small" onClick={() => onEditQuestion(question)}>
                      {copy.editQuestion}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </ErgTable>
    </ErgDataTableShell>
  );
}

const clampTwoLines = {
  display: "-webkit-box",
  overflow: "hidden",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
} as const;

const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  // Pinned inside the sticky header cell; at its right-aligned static spot it widened the scroll area.
  left: 0,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  top: 0,
  whiteSpace: "nowrap",
  width: 1,
} as const;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <TableRow key={index}>
          <TableCell padding="checkbox"><ErgSkeleton variant="rounded" width={18} height={18} sx={{ mx: "auto" }} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={20} /></TableCell>
          <TableCell><ErgSkeleton width="70%" /><ErgSkeleton width="40%" /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={90} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton variant="rounded" width={64} height={22} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={50} /></TableCell>
          <TableCell align="right"><ErgSkeleton width={36} sx={{ ml: "auto" }} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

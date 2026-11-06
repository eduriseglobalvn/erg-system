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
import { questionBankReadiness, type QuestionBankReadiness } from "./question-bank-readiness";
import { RowActionsMenu } from "./question-bank-scope-controls";

export const DIFFICULTY_TONE: Record<QuestionBankDifficulty, "neutral" | "info" | "warning"> = {
  core: "neutral",
  stretch: "info",
  challenge: "warning",
};

const READINESS_TONE: Record<QuestionBankReadiness, "success" | "warning"> = {
  ready: "success",
  missingAnswer: "warning",
  missingCorrect: "warning",
};

/** Below lg the topic column eats the width, so only checkbox, question and action stay. Widths exclude the 32px cell padding. */
const wideOnly = { display: { xs: "none", lg: "table-cell" } } as const;

export function QuestionLibrary({
  copy,
  heading,
  isLoading,
  loadFailed = false,
  onEditQuestion,
  onOpenQuestion,
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
  /** The active topic's name, or "all topics". */
  heading: string;
  isLoading: boolean;
  /** The load failed: the sync notice explains it, so no misleading "no matching questions". */
  loadFailed?: boolean;
  onEditQuestion: (question: QuestionBankQuestion) => void;
  /** Row click / Enter: quick view (A2). Selection stays on the checkbox. */
  onOpenQuestion: (question: QuestionBankQuestion) => void;
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
      // Sits inside the page card next to the topic column, so no border of its own.
      sx={{ border: 0, borderRadius: 0 }}
      toolbar={
        <ErgTableToolbar
          title={
            <>
              {heading}{" "}
              <Box component="span" sx={{ color: t.color.textMuted, typography: "body2" }}>
                · {copy.questionCount(page.totalItems)}
              </Box>
            </>
          }
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
              sx={{ width: { xs: "100%", sm: 240 }, "& .MuiOutlinedInput-root": { bgcolor: t.color.surfaceMuted } }}
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
      <ErgTable size="small" aria-label={copy.libraryTitle} sx={compactCells}>
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
            <TableCell sx={{ ...wideOnly, width: 130 }}>{copy.table.type}</TableCell>
            <TableCell sx={{ ...wideOnly, width: 80 }}>{copy.table.difficulty}</TableCell>
            <TableCell sx={{ ...wideOnly, width: 150, whiteSpace: "nowrap" }}>{copy.table.readiness}</TableCell>
            <TableCell align="right" sx={{ ...wideOnly, width: 64, whiteSpace: "nowrap" }}>{copy.table.used}</TableCell>
            <TableCell align="right" sx={{ width: 36 }}>
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
                <TableCell colSpan={8} sx={{ py: 6 }}>
                  <ErgEmptyState title={copy.noResults} description={copy.noResultsHint} />
                </TableCell>
              </TableRow>
            )
          ) : (
            visibleQuestions.map((question, index) => {
              const isSelected = selected.has(question.id);
              const readiness = questionBankReadiness(question);
              return (
                <TableRow
                  key={question.id}
                  hover
                  selected={isSelected}
                  aria-label={`${copy.questionQuickViewTitle}: ${question.stem}`}
                  onClick={() => onOpenQuestion(question)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.target !== event.currentTarget) return;
                    event.preventDefault();
                    onOpenQuestion(question);
                  }}
                  tabIndex={0}
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
                  <TableCell sx={{ ...wideOnly, color: t.color.textMuted, typography: "caption" }}>
                    {String(firstNumber + index).padStart(2, "0")}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 0 }}>
                    <Typography variant="body2" title={question.stem} noWrap>
                      {question.stem}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>
                    {translate(questionTypeLabelKeys[question.type])}
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{copy.difficulty[question.difficulty]}</TableCell>
                  <TableCell sx={wideOnly}>
                    <ErgStatusChip label={copy.readiness[readiness]} tone={READINESS_TONE[readiness]} />
                  </TableCell>
                  <TableCell align="right" sx={{ ...wideOnly, color: t.color.textSecondary }}>{question.usageCount}</TableCell>
                  <TableCell align="right">
                    <RowActionsMenu
                      label={copy.moreActions(question.stem)}
                      items={[
                        { key: "view", label: copy.questionQuickViewTitle, onClick: () => onOpenQuestion(question) },
                        { key: "edit", label: copy.editQuestion, onClick: () => onEditQuestion(question) },
                      ]}
                    />
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

/** The canvas spaces columns 12px apart; the theme's 16px side padding per cell left the question column too narrow. */
const compactCells = {
  "& .MuiTableCell-root:not(.MuiTableCell-paddingCheckbox)": { px: 1.25 },
  "& .MuiTableBody-root .MuiTableCell-root": { whiteSpace: "nowrap" },
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
          <TableCell><ErgSkeleton width="70%" /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={90} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={56} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton variant="rounded" width={88} height={22} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={24} sx={{ ml: "auto" }} /></TableCell>
          <TableCell align="right"><ErgSkeleton width={24} sx={{ ml: "auto" }} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

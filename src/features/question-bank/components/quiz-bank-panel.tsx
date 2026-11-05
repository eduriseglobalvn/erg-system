import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import type { QuizBankItem, QuizBankStatus } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuestionBankPageHeader } from "./question-bank-page-header";
import type { QuizKindFilter } from "./question-bank-workspace-types";

const STATUS_TONE: Record<QuizBankStatus, "success" | "warning" | "neutral"> = {
  ready: "success",
  reviewing: "warning",
  draft: "neutral",
};

const wideOnly = { display: { xs: "none", md: "table-cell" } } as const;

/** B1: quiz bank list. Rows open the package settings; export and delete sit at the row end. */
export function QuizBankPanel({
  copy,
  deletingQuizId,
  isLoading,
  onCreateQuiz,
  onDeleteQuiz,
  onKindChange,
  onExportPortable,
  onPreviewQuiz,
  onSearchChange,
  quizKind,
  quizzes,
  searchValue,
  title,
}: {
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  deletingQuizId?: string;
  isLoading: boolean;
  onCreateQuiz: () => void;
  onDeleteQuiz: (quiz: QuizBankItem) => void;
  onExportPortable: (quiz: QuizBankItem) => void;
  onKindChange: (value: QuizKindFilter) => void;
  onPreviewQuiz: (quiz: QuizBankItem) => void;
  onSearchChange: (value: string) => void;
  quizKind: QuizKindFilter;
  quizzes: QuizBankItem[];
  searchValue: string;
  title: string;
}) {
  return (
    <Stack spacing={3}>
      <QuestionBankPageHeader
        title={title}
        meta={copy.quizBankMeta(quizzes.length)}
        actions={
          <ErgButton startIcon={<AddRoundedIcon />} onClick={onCreateQuiz}>
            {copy.createQuizFromBank}
          </ErgButton>
        }
      />
      <ErgDataTableShell
        toolbar={
          <ErgTableToolbar
            title={copy.quizBankTitle}
            actions={
              <>
                <TextField
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={copy.searchQuizPlaceholder}
                  size="small"
                  slotProps={{
                    htmlInput: { "aria-label": copy.searchQuizPlaceholder },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon sx={{ color: t.color.textMuted, fontSize: t.size.iconMd }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ width: { xs: "100%", sm: 260 } }}
                />
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={quizKind}
                  aria-label={copy.quizTable.kind}
                  onChange={(_, value) => {
                    if (value) onKindChange(value as QuizKindFilter);
                  }}
                >
                  <ToggleButton value="all">{copy.allQuizKinds}</ToggleButton>
                  <ToggleButton value="train">{copy.quizKind.train}</ToggleButton>
                  <ToggleButton value="test">{copy.quizKind.test}</ToggleButton>
                </ToggleButtonGroup>
              </>
            }
          />
        }
      >
        <ErgTable size="small" aria-label={copy.quizBankTitle}>
          <TableHead>
            <TableRow>
              <TableCell>{copy.quizTable.title}</TableCell>
              <TableCell sx={wideOnly}>{copy.quizTable.kind}</TableCell>
              <TableCell sx={wideOnly} align="right">{copy.quizTable.count}</TableCell>
              <TableCell sx={wideOnly}>{copy.quizTable.duration}</TableCell>
              <TableCell sx={wideOnly}>{copy.quizTable.source}</TableCell>
              <TableCell>{copy.quizTable.status}</TableCell>
              <TableCell sx={wideOnly}>{copy.quizTable.updated}</TableCell>
              <TableCell align="right">{copy.quizTable.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6 }}>
                  <ErgEmptyState title={copy.noQuizzes} description={copy.noQuizzesHint} />
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => (
                <TableRow
                  hover
                  key={quiz.id}
                  aria-label={`${copy.openQuiz}: ${quiz.title}`}
                  onClick={() => onPreviewQuiz(quiz)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onPreviewQuiz(quiz);
                  }}
                  role="button"
                  tabIndex={0}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="subtitle1">{quiz.title}</Typography>
                    <Typography variant="caption" component="p" noWrap sx={{ color: t.color.textMuted }}>
                      {quiz.topicLabels.join(", ") || copy.otherTopic} · {copy.scopeLabel(quiz.scope)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={wideOnly}>{copy.quizKind[quiz.kind]}</TableCell>
                  <TableCell sx={wideOnly} align="right">{quiz.questionCount}</TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{quiz.durationLabel}</TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{copy.sourceMode[quiz.sourceMode]}</TableCell>
                  <TableCell>
                    <ErgStatusChip label={copy.quizStatus[quiz.status]} tone={STATUS_TONE[quiz.status]} />
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary, whiteSpace: "nowrap" }}>
                    {formatDateTimeVi(quiz.updatedAt)}
                  </TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                      {quiz.status === "ready" ? (
                        <ErgIconButton label={copy.exportPortable(quiz.title)} tooltip={copy.exportPortable(quiz.title)} size="small" onClick={() => onExportPortable(quiz)}>
                          <Inventory2RoundedIcon fontSize="small" />
                        </ErgIconButton>
                      ) : null}
                      <ErgIconButton
                        label={`${copy.deleteQuiz}: ${quiz.title}`}
                        tooltip={copy.deleteQuiz}
                        size="small"
                        color="error"
                        disabled={deletingQuizId === quiz.id}
                        onClick={() => onDeleteQuiz(quiz)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </ErgIconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </ErgTable>
      </ErgDataTableShell>
    </Stack>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index}>
          <TableCell><ErgSkeleton width="60%" /><ErgSkeleton width="35%" /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={64} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={24} sx={{ ml: "auto" }} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={56} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={80} /></TableCell>
          <TableCell><ErgSkeleton variant="rounded" width={72} height={22} /></TableCell>
          <TableCell sx={wideOnly}><ErgSkeleton width={110} /></TableCell>
          <TableCell align="right"><ErgSkeleton width={56} sx={{ ml: "auto" }} /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

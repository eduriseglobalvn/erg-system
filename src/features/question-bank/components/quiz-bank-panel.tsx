import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
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

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgEmptyState, ErgSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import type {
  QuestionBankLevel,
  QuestionBankSubject,
  QuizBankItem,
  QuizBankStatus,
} from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuestionBankPageHeader } from "./question-bank-page-header";
import { QuestionBankScopeControls, RowActionsMenu } from "./question-bank-scope-controls";
import type { QuizKindFilter } from "./question-bank-workspace-types";

export const QUIZ_STATUS_TONE: Record<QuizBankStatus, "success" | "warning" | "neutral"> = {
  ready: "success",
  reviewing: "warning",
  draft: "neutral",
};

const wideOnly = { display: { xs: "none", md: "table-cell" } } as const;

/** B1: quiz bank list. Rows open the quick view (B2); export and delete sit at the row end. */
export function QuizBankPanel({
  activeLevel,
  activeSubject,
  copy,
  deletingQuizId,
  isLoading,
  kindCounts,
  onCreateQuiz,
  onDeleteQuiz,
  onKindChange,
  onExportPortable,
  onLevelChange,
  onPreviewQuiz,
  onPublishQuiz,
  onSearchChange,
  publishingQuizId,
  onSubjectChange,
  quizKind,
  quizzes,
  searchValue,
  subjects,
  title,
}: {
  activeLevel: QuestionBankLevel;
  activeSubject: QuestionBankSubject;
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  deletingQuizId?: string;
  isLoading: boolean;
  /** Matches per kind after search, before the kind filter. */
  kindCounts: Record<QuizKindFilter, number>;
  onCreateQuiz: () => void;
  onDeleteQuiz: (quiz: QuizBankItem) => void;
  onExportPortable: (quiz: QuizBankItem) => void;
  onKindChange: (value: QuizKindFilter) => void;
  onLevelChange: (levelId: string) => void;
  onPreviewQuiz: (quiz: QuizBankItem) => void;
  onPublishQuiz: (quiz: QuizBankItem) => void;
  publishingQuizId?: string;
  onSearchChange: (value: string) => void;
  onSubjectChange: (subjectId: string) => void;
  quizKind: QuizKindFilter;
  quizzes: QuizBankItem[];
  searchValue: string;
  subjects: QuestionBankSubject[];
  title: string;
}) {
  return (
    <Stack spacing={2}>
      <QuestionBankPageHeader
        title={title}
        meta={[activeSubject.label, activeLevel.label, copy.quizBankMeta(kindCounts.all)].filter(Boolean).join(" · ")}
        controls={
          <QuestionBankScopeControls
            activeLevel={activeLevel}
            activeSubject={activeSubject}
            copy={copy}
            onLevelChange={onLevelChange}
            onSubjectChange={onSubjectChange}
            subjects={subjects}
          />
        }
        actions={
          <ErgButton startIcon={<AddRoundedIcon />} onClick={onCreateQuiz}>
            {copy.createQuizFromBank}
          </ErgButton>
        }
      />
      <ErgDataTableShell
        sx={{ borderRadius: `${t.radius.card}px` }}
        footer={
          <Typography variant="caption" component="p" sx={{ color: t.color.textMuted, px: 2, py: 1.5 }}>
            {copy.quizBankRowHint}
          </Typography>
        }
        toolbar={
          <ErgTableToolbar
            title={
              <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
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
                  sx={{ width: { xs: "100%", sm: 280 }, "& .MuiOutlinedInput-root": { bgcolor: t.color.surfaceMuted } }}
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
                  <ToggleButton value="all">{copy.allQuizKinds} · {kindCounts.all}</ToggleButton>
                  <ToggleButton value="train">{copy.quizKind.train} · {kindCounts.train}</ToggleButton>
                  <ToggleButton value="test">{copy.quizKind.test} · {kindCounts.test}</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            }
          />
        }
      >
        <ErgTable size="small" aria-label={copy.quizBankTitle} sx={{ "& .MuiTableCell-root": { px: 1.25 } }}>
          <TableHead>
            <TableRow>
              <TableCell>{copy.quizTable.title}</TableCell>
              <TableCell sx={{ ...wideOnly, width: 110 }}>{copy.quizTable.kind}</TableCell>
              <TableCell sx={{ ...wideOnly, width: 72 }} align="right">{copy.quizTable.count}</TableCell>
              <TableCell sx={{ ...wideOnly, width: 96 }}>{copy.quizTable.duration}</TableCell>
              <TableCell sx={{ ...wideOnly, width: 130 }}>{copy.quizTable.source}</TableCell>
              <TableCell sx={{ width: 130 }}>{copy.quizTable.status}</TableCell>
              <TableCell sx={{ ...wideOnly, width: 120 }}>{copy.quizTable.updated}</TableCell>
              <TableCell align="right" sx={{ width: 44 }}>
                <Box component="span" sx={visuallyHidden}>{copy.quizTable.actions}</Box>
              </TableCell>
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
                  <TableCell sx={{ maxWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap title={quiz.title}>{quiz.title}</Typography>
                    <Typography variant="caption" component="p" noWrap sx={{ color: t.color.textMuted }}>
                      {quiz.topicLabels.join(", ") || copy.otherTopic} · {copy.scopeLabel(quiz.scope)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={wideOnly}>
                    <ErgStatusChip dot={false} label={copy.quizKind[quiz.kind]} tone={quiz.kind === "test" ? "warning" : "info"} />
                  </TableCell>
                  <TableCell sx={wideOnly} align="right">{quiz.questionCount}</TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{quiz.durationLabel}</TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary }}>{copy.sourceMode[quiz.sourceMode]}</TableCell>
                  <TableCell>
                    <QuizStatusText label={copy.quizStatus[quiz.status]} status={quiz.status} />
                  </TableCell>
                  <TableCell sx={{ ...wideOnly, color: t.color.textSecondary, whiteSpace: "nowrap" }}>
                    {formatDateTimeVi(quiz.updatedAt) || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <RowActionsMenu
                      label={copy.moreActions(quiz.title)}
                      items={[
                        { key: "open", label: copy.openQuiz, onClick: () => onPreviewQuiz(quiz) },
                        quiz.status === "ready"
                          ? { key: "export", label: copy.exportPortableAction, onClick: () => onExportPortable(quiz) }
                          : { key: "publish", label: copy.publishQuiz, disabled: publishingQuizId === quiz.id, onClick: () => onPublishQuiz(quiz) },
                        { key: "delete", label: copy.deleteQuiz, danger: true, disabled: deletingQuizId === quiz.id, onClick: () => onDeleteQuiz(quiz) },
                      ]}
                    />
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

/** Status as a coloured dot and text (canvas QuizBank), not a filled chip. */
function QuizStatusText({ label, status }: { label: string; status: QuizBankStatus }) {
  const tint = t.statusTint[QUIZ_STATUS_TONE[status]];
  return (
    <Box component="span" sx={{ alignItems: "center", color: tint.dot, display: "inline-flex", gap: 1, typography: "body2", whiteSpace: "nowrap" }}>
      <Box component="span" sx={{ bgcolor: tint.dot, borderRadius: "50%", flex: "none", height: 8, width: 8 }} />
      {label}
    </Box>
  );
}

const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;

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

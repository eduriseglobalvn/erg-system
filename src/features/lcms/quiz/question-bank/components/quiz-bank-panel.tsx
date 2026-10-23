import SearchIcon from "@mui/icons-material/Search";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { Badge, ERG_SHEET_COLORS, getScopeTone } from "./question-bank-primitives";
import type { QuizKindFilter } from "./question-bank-workspace-types";

function QuizSheetSkeletonRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 6), 12) }).map((_, rowIndex) => (
        <tr key={`quiz-skeleton-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <td key={`quiz-skeleton-${rowIndex}-${columnIndex}`}>
              <Skeleton
                variant={columnIndex === 0 ? "text" : "rounded"}
                width={columnIndex === 0 ? "76%" : columnIndex === columnCount - 1 ? 48 : 84}
                height={columnIndex === 0 ? 22 : 24}
                sx={{ borderRadius: columnIndex === 0 ? 1 : 10 }}
              />
              {columnIndex === 0 ? <Skeleton variant="text" width="46%" height={16} /> : null}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function QuizBankPanel({
  contentScope,
  copy,
  deletingQuizId,
  isLoading,
  onDeleteQuiz,
  onKindChange,
  onExportPortable,
  onPreviewQuiz,
  onSearchChange,
  quizKind,
  quizzes,
  searchValue,
}: {
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  deletingQuizId?: string;
  isLoading: boolean;
  onDeleteQuiz: (quiz: QuizBankItem) => void;
  onExportPortable: (quiz: QuizBankItem) => void;
  onKindChange: (value: QuizKindFilter) => void;
  onPreviewQuiz: (quiz: QuizBankItem) => void;
  onSearchChange: (value: string) => void;
  quizKind: QuizKindFilter;
  quizzes: QuizBankItem[];
  searchValue: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: "transparent",
        borderColor: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", lg: "center" },
          bgcolor: "#fff",
          borderBottom: `1px solid ${alpha("#0f172a", 0.06)}`,
          borderRadius: 3,
          justifyContent: "space-between",
          mb: 1.5,
          px: 2.5,
          py: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "#111827", fontSize: 17, fontWeight: 850, lineHeight: 1.2 }}>
            {copy.quizBankTitle}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: 12.5, fontWeight: 650, mt: 0.35 }}>
            {copy.quizBankDescription(quizzes.length)}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.25}
          sx={{ alignItems: { xs: "stretch", md: "center" }, minWidth: { lg: 620 } }}
        >
          <TextField
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchQuizPlaceholder}
            size="small"
            sx={{
              flex: 1,
              minWidth: { md: 320 },
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
          <ToggleButtonGroup
            exclusive
            value={quizKind}
            onChange={(_, value) => {
              if (value) onKindChange(value as QuizKindFilter);
            }}
            size="small"
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              bgcolor: "#f8fafc",
              border: `1px solid ${alpha("#64748b", 0.16)}`,
              borderRadius: 999,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              gap: 0.5,
              p: 0.35,
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: "999px !important",
                color: "#64748b",
                fontSize: 13,
                fontWeight: 800,
                minHeight: 32,
                minWidth: 84,
                px: 1.5,
                textTransform: "none",
                transition: "background-color 140ms ease, color 140ms ease, box-shadow 140ms ease",
                "&:hover": {
                  bgcolor: alpha("#0f6cbd", 0.07),
                  color: "#0f5f9f",
                },
                "&.Mui-selected": {
                  bgcolor: "#fff",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                  color: "#0f6cbd",
                },
                "&.Mui-selected:hover": {
                  bgcolor: "#fff",
                },
              },
            }}
          >
            <ToggleButton value="all">{copy.allQuizKinds}</ToggleButton>
            <ToggleButton value="train">{copy.quizKind.train}</ToggleButton>
            <ToggleButton value="test">{copy.quizKind.test}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Box sx={{ bgcolor: ERG_SHEET_COLORS.frame, overflowX: "auto" }}>
        <Box
          component="table"
          sx={{
            borderCollapse: "separate",
            borderSpacing: 0,
            minWidth: 980,
            tableLayout: "fixed",
            width: "100%",
            "& th": {
              bgcolor: ERG_SHEET_COLORS.header,
              borderBottom: "2px solid #fff",
              borderRight: "2px solid #fff",
              color: "#64748b",
              fontSize: 11,
              fontWeight: 850,
              height: 42,
              letterSpacing: "0.08em",
              px: 1.5,
              textAlign: "left",
              textTransform: "uppercase",
            },
            "& th:last-child, & td:last-child": { borderRight: 0 },
            "& td": {
              borderBottom: "2px solid #fff",
              borderRight: "2px solid #fff",
              color: "#334155",
              fontSize: 13,
              px: 1.5,
              py: 1.2,
              verticalAlign: "middle",
            },
            "& tbody tr": {
              bgcolor: ERG_SHEET_COLORS.rowOdd,
              cursor: "pointer",
              transition: "background-color 140ms ease",
            },
            "& tbody tr:nth-of-type(even)": { bgcolor: ERG_SHEET_COLORS.rowEven },
            "& tbody tr:hover": {
              bgcolor: ERG_SHEET_COLORS.hover,
              boxShadow: `inset 3px 0 0 ${ERG_SHEET_COLORS.hoverBorder}`,
            },
          }}
        >
          <Box component="colgroup">
            <Box component="col" sx={{ width: "38%" }} />
            <Box component="col" sx={{ width: "12%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "11%" }} />
            <Box component="col" sx={{ width: "10%" }} />
            <Box component="col" sx={{ width: "7%" }} />
          </Box>
          <thead>
            <tr>
              <th>{copy.quizTable.title}</th>
              <th>{copy.quizTable.scope}</th>
              <th>{copy.quizTable.kind}</th>
              <th>{copy.quizTable.count}</th>
              <th>{copy.quizTable.duration}</th>
              <th>{copy.quizTable.status}</th>
              <th>{copy.quizTable.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <QuizSheetSkeletonRows columnCount={7} rowCount={Math.max(quizzes.length || 0, 8)} />
            ) : quizzes.map((quiz) => {
              const isReady = quiz.status === "ready";
              const isReviewing = quiz.status === "reviewing";
              return (
                <tr
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
                >
                  <td>
                    <Typography sx={{ color: "#111827", fontSize: 13.5, fontWeight: 800, lineHeight: 1.35 }}>
                      {quiz.title}
                    </Typography>
                    <Typography noWrap sx={{ color: "#64748b", fontSize: 12, fontWeight: 550, mt: 0.4 }}>
                      {quiz.topicLabels.join(", ") || copy.otherTopic}
                    </Typography>
                    <Typography sx={{ color: "#94a3b8", fontSize: 11.5, fontWeight: 600, mt: 0.3 }}>
                      {quiz.subjectLabel} / {quiz.levelLabel}
                    </Typography>
                  </td>
                  <td>
                    <Badge tone={getScopeTone(quiz.scope, contentScope)}>
                      {copy.scopeLabel(quiz.scope)}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={quiz.kind === "test" ? "warning" : "secondary"}>
                      {copy.quizKind[quiz.kind]}
                    </Badge>
                  </td>
                  <td>
                    <Typography sx={{ color: "#111827", fontSize: 13, fontWeight: 800 }}>
                      {copy.questionCount(quiz.questionCount)}
                    </Typography>
                  </td>
                  <td>{quiz.durationLabel}</td>
                  <td>
                    <Badge tone={isReady ? "success" : isReviewing ? "warning" : "outline"}>
                      {copy.quizStatus[quiz.status]}
                    </Badge>
                  </td>
                  <td>
                    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
                      {isReady ? (
                        <Tooltip title="Đóng gói portable">
                          <IconButton
                            aria-label={`Đóng gói portable: ${quiz.title}`}
                            color="primary"
                            onClick={(event) => { event.stopPropagation(); onExportPortable(quiz); }}
                            size="small"
                          >
                            <Inventory2RoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Button
                        color="error"
                        disabled={deletingQuizId === quiz.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteQuiz(quiz);
                        }}
                        size="small"
                        variant="text"
                        sx={{ borderRadius: 2, fontSize: 12, fontWeight: 800, minWidth: 0, px: 1 }}
                      >
                        {deletingQuizId === quiz.id ? copy.deletingQuiz : copy.deleteQuiz}
                      </Button>
                    </Stack>
                  </td>
                </tr>
              );
            })}
            {!isLoading && quizzes.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <Box sx={{ color: "#94a3b8", fontSize: 14, fontStyle: "italic", fontWeight: 650, py: 6, textAlign: "center" }}>
                    {copy.noQuizzes}
                  </Box>
                </td>
              </tr>
            ) : null}
          </tbody>
        </Box>
      </Box>
    </Paper>
  );
}

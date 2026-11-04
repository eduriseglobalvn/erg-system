import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { Badge, getScopeTone } from "./question-bank-primitives";
import type { QuizKindFilter } from "./question-bank-workspace-types";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";
import { alpha } from "@mui/material/styles";

function QuizSheetSkeletonRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 4), 8) }).map((_, rowIndex) => (
        <TableRow key={`quiz-skeleton-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((__, columnIndex) => (
            <TableCell key={`quiz-skeleton-${rowIndex}-${columnIndex}`} sx={{ borderBottom: "1px solid rgba(0,0,0,0.04)", py: 1.5 }}>
              <Skeleton
                variant={columnIndex === 0 ? "text" : "rounded"}
                width={columnIndex === 0 ? "76%" : columnIndex === columnCount - 1 ? 48 : 84}
                height={columnIndex === 0 ? 22 : 24}
                sx={{ borderRadius: columnIndex === 0 ? 1 : "6px" }}
              />
              {columnIndex === 0 ? <Skeleton variant="text" width="46%" height={16} sx={{ mt: 0.5 }} /> : null}
            </TableCell>
          ))}
        </TableRow>
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
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: `1px solid ${ergEnterpriseTokens.color.border}`,
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 24px -4px rgba(0, 0, 0, 0.05)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Apple-styled Toolbar */}
      <Box
        sx={{
          alignItems: { xs: "stretch", lg: "center" },
          borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 2,
          justifyContent: "space-between",
          p: { xs: 2, md: 2.25 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {copy.quizBankTitle}
          </Typography>
          <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.8125rem", fontWeight: 500, mt: 0.25 }}>
            {copy.quizBankDescription(quizzes.length)}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          {/* Apple Spotlight Search */}
          <TextField
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={copy.searchQuizPlaceholder}
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
                  width: { sm: 280, xs: "100%" },
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

          {/* Apple Segmented Control */}
          <ToggleButtonGroup
            exclusive
            value={quizKind}
            onChange={(_, value) => {
              if (value) onKindChange(value as QuizKindFilter);
            }}
            size="small"
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.04)",
              borderRadius: "10px",
              p: "3px",
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: "8px !important",
                color: ergEnterpriseTokens.color.textMuted,
                fontSize: "0.8rem",
                fontWeight: 600,
                minHeight: 32,
                px: 1.5,
                textTransform: "none",
                transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  color: ergEnterpriseTokens.color.text,
                },
                "&.Mui-selected": {
                  bgcolor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  color: ergEnterpriseTokens.color.primary,
                },
              },
            }}
          >
            <ToggleButton value="all">{copy.allQuizKinds}</ToggleButton>
            <ToggleButton value="train">{copy.quizKind.train}</ToggleButton>
            <ToggleButton value="test">{copy.quizKind.test}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {/* Table Container */}
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.title}</TableCell>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.scope}</TableCell>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.kind}</TableCell>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.count}</TableCell>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.duration}</TableCell>
              <TableCell sx={tableHeadCellSx}>{copy.quizTable.status}</TableCell>
              <TableCell align="right" sx={tableHeadCellSx}>
                {copy.quizTable.actions}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <QuizSheetSkeletonRows columnCount={7} rowCount={Math.max(quizzes.length || 0, 4)} />
            ) : quizzes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ borderBottom: 0, py: 8 }}>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.25,
                      justifyContent: "center",
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
                      <Inventory2OutlinedIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.95rem", fontWeight: 600 }}>
                      {copy.noQuizzes}
                    </Typography>
                    <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.825rem", maxWidth: 440, lineHeight: 1.45 }}>
                      Hiện chưa có gói bài tập nào phù hợp với bộ lọc. Hãy tạo gói mới từ Ngân hàng câu hỏi hoặc thay đổi
                      từ khóa tìm kiếm.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              quizzes.map((quiz) => {
                const isReady = quiz.status === "ready";
                const isReviewing = quiz.status === "reviewing";
                return (
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
                    sx={{
                      cursor: "pointer",
                      transition: "background-color 0.12s ease",
                      "&:hover": { bgcolor: `${alpha(ergEnterpriseTokens.color.primary, 0.035)} !important` },
                      "& td": { borderBottom: "1px solid rgba(0, 0, 0, 0.04)", py: 1.4 },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.35 }}>
                        {quiz.title}
                      </Typography>
                      <Typography noWrap sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.78rem", fontWeight: 550, mt: 0.3 }}>
                        {quiz.topicLabels.join(", ") || copy.otherTopic}
                      </Typography>
                      <Typography sx={{ color: ergEnterpriseTokens.color.textMuted, fontSize: "0.72rem", fontWeight: 600, mt: 0.2 }}>
                        {quiz.subjectLabel} / {quiz.levelLabel}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Badge tone={getScopeTone(quiz.scope, contentScope)}>
                        {copy.scopeLabel(quiz.scope)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge tone={quiz.kind === "test" ? "warning" : "secondary"}>
                        {copy.quizKind[quiz.kind]}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem", fontWeight: 600 }}>
                        {copy.questionCount(quiz.questionCount)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: ergEnterpriseTokens.color.text, fontSize: "0.85rem" }}>
                        {quiz.durationLabel}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Badge tone={isReady ? "success" : isReviewing ? "warning" : "outline"}>
                        {copy.quizStatus[quiz.status]}
                      </Badge>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                        {isReady ? (
                          <Tooltip title="Đóng gói portable">
                            <IconButton
                              aria-label={`Đóng gói portable: ${quiz.title}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                onExportPortable(quiz);
                              }}
                              size="small"
                              sx={{
                                bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                                color: ergEnterpriseTokens.color.primary,
                                "&:hover": { bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.16) },
                              }}
                            >
                              <Inventory2RoundedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                        <Tooltip title={copy.deleteQuiz}>
                          <IconButton
                            aria-label={copy.deleteQuiz}
                            disabled={deletingQuizId === quiz.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteQuiz(quiz);
                            }}
                            size="small"
                            sx={{
                              bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.08),
                              color: ergEnterpriseTokens.color.danger,
                              "&:hover": { bgcolor: alpha(ergEnterpriseTokens.color.danger, 0.16) },
                            }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

const tableHeadCellSx = {
  bgcolor: "rgba(250, 250, 252, 0.95)",
  borderBottom: `1px solid ${ergEnterpriseTokens.color.border}`,
  color: ergEnterpriseTokens.color.textMuted,
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  py: 1.25,
  textTransform: "uppercase",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

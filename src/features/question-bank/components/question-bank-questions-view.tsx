import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import type { QuestionBankApiData } from "@/features/question-bank/api/question-bank-api";
import type {
  QuestionBankCategory,
  QuestionBankLevel,
  QuestionBankQuestion,
  QuestionBankSubject,
} from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuestionBankPageHeader } from "./question-bank-page-header";
import { QuestionBankScopeControls } from "./question-bank-scope-controls";
import { QuestionBankTopicList } from "./question-bank-topic-list";
import { QuestionLibrary } from "./question-library";
import { QuestionSelectionBar } from "./question-selection-bar";

/** A1: header, topic column, question table and the floating selection bar. */
export function QuestionBankQuestionsView({
  activeLevel,
  activeSubject,
  copy,
  isLoading,
  levelTopics,
  loadFailed,
  onAddQuestion,
  onClearSelection,
  onCreateQuiz,
  onEditQuestion,
  onLevelChange,
  onOpenAutoPick,
  onOpenQuestion,
  onPageChange,
  onSearchChange,
  onSelectAll,
  onSubjectChange,
  onToggleQuestion,
  onTopicChange,
  page,
  searchValue,
  selectedIds,
  subjects,
  title,
  topicId,
  visibleQuestions,
}: {
  activeLevel: QuestionBankLevel;
  activeSubject: QuestionBankSubject;
  copy: QuestionBankCopy;
  isLoading: boolean;
  levelTopics: QuestionBankCategory[];
  loadFailed: boolean;
  onAddQuestion: () => void;
  onClearSelection: () => void;
  onCreateQuiz: () => void;
  onEditQuestion: (question: QuestionBankQuestion) => void;
  onLevelChange: (levelId: string) => void;
  onOpenAutoPick: () => void;
  onOpenQuestion: (question: QuestionBankQuestion) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (value: string) => void;
  onSelectAll: () => void;
  onSubjectChange: (subjectId: string) => void;
  onToggleQuestion: (questionId: string) => void;
  onTopicChange: (topicId: string) => void;
  page: QuestionBankApiData["questionPage"];
  searchValue: string;
  selectedIds: string[];
  subjects: QuestionBankSubject[];
  title: string;
  topicId: string;
  visibleQuestions: QuestionBankQuestion[];
}) {
  const hasSelection = selectedIds.length > 0;
  const activeTopic = levelTopics.find((topic) => topic.id === topicId);

  return (
    <Stack spacing={2}>
      <QuestionBankPageHeader
        title={title}
        meta={activeSubject.label ? copy.pageMeta(activeSubject.label, activeLevel.label, page.totalItems) : undefined}
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
          <>
            {hasSelection ? null : (
              <Button variant="text" onClick={onOpenAutoPick}>
                {copy.autoPickOpen}
              </Button>
            )}
            {/* The selection bar takes over the page's contained button while questions are selected. */}
            <ErgButton variant={hasSelection ? "outlined" : "contained"} startIcon={<AddRoundedIcon />} onClick={onAddQuestion}>
              {copy.addQuestion(activeTopic?.label)}
            </ErgButton>
          </>
        }
      />
      {/* One card: topic column on the left, the question table on the right (canvas Main). */}
      <Box
        component="section"
        sx={{
          bgcolor: t.color.surface,
          border: `1px solid ${t.color.border}`,
          borderRadius: `${t.radius.card}px`,
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "232px minmax(0, 1fr)" },
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: { xs: `1px solid ${t.color.divider}`, md: 0 }, borderRight: { md: `1px solid ${t.color.border}` }, minWidth: 0, p: 1.5 }}>
          <QuestionBankTopicList
            activeCount={page.totalItems}
            activeTopicId={topicId}
            copy={copy}
            levelLabel={activeLevel.label}
            onPick={onTopicChange}
            topics={levelTopics}
          />
        </Box>
        <QuestionLibrary
          copy={copy}
          heading={activeTopic?.label ?? copy.allTopics}
          isLoading={isLoading}
          loadFailed={loadFailed}
          onEditQuestion={onEditQuestion}
          onOpenQuestion={onOpenQuestion}
          onPageChange={onPageChange}
          onQuestionSelectAll={onSelectAll}
          onQuestionToggle={onToggleQuestion}
          onSearchChange={onSearchChange}
          page={page}
          searchValue={searchValue}
          selectedIds={selectedIds}
          visibleQuestions={visibleQuestions}
        />
      </Box>
      {hasSelection ? (
        <QuestionSelectionBar
          copy={copy}
          count={selectedIds.length}
          onAutoPick={onOpenAutoPick}
          onClear={onClearSelection}
          onCreateQuiz={onCreateQuiz}
        />
      ) : null}
    </Stack>
  );
}

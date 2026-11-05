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
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuestionBankPageHeader } from "./question-bank-page-header";
import { SelectControl } from "./question-bank-primitives";
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
    <Stack spacing={3}>
      <QuestionBankPageHeader
        title={title}
        meta={activeSubject.label ? copy.pageMeta(activeSubject.label, activeLevel.label, page.totalItems) : undefined}
        controls={
          <>
            <Box sx={{ width: { xs: "100%", sm: 200 } }}>
              <SelectControl
                hideDescription
                label={copy.subjectLabel}
                value={activeSubject.id}
                onChange={onSubjectChange}
                options={subjects.map((subject) => ({ value: subject.id, label: subject.label }))}
              />
            </Box>
            <Box sx={{ width: { xs: "100%", sm: 160 } }}>
              <SelectControl
                hideDescription
                label={copy.levelLabel}
                value={activeLevel.id}
                onChange={onLevelChange}
                options={activeSubject.levels.map((level) => ({ value: level.id, label: level.label }))}
              />
            </Box>
          </>
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
      <Box sx={{ alignItems: "start", display: "grid", gap: 3, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "220px minmax(0, 1fr)" } }}>
        <QuestionBankTopicList
          activeCount={page.totalItems}
          activeTopicId={topicId}
          copy={copy}
          onPick={onTopicChange}
          topics={levelTopics}
        />
        <QuestionLibrary
          copy={copy}
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

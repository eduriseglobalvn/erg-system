import Box from "@mui/material/Box";
import type {
  QuestionBankCategory,
  QuestionBankLevel,
  QuestionBankSubject,
  QuestionBankSubjectId,
} from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import { SelectControl } from "./question-bank-primitives";

export function QuestionBankStructurePanel({
  activeLevel,
  activeSubject,
  copy,
  getTopicQuestionCount,
  levelTopics,
  onLevelChange,
  onSubjectChange,
  onTopicChange,
  subjectId,
  subjects,
  topicId,
}: {
  activeLevel: QuestionBankLevel;
  activeSubject: QuestionBankSubject;
  copy: QuestionBankCopy;
  getTopicQuestionCount: (categoryId: string, targetLevelId?: string) => number;
  levelTopics: QuestionBankCategory[];
  onLevelChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTopicChange: (value: string) => void;
  subjectId: QuestionBankSubjectId;
  subjects: QuestionBankSubject[];
  topicId: string;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <SelectControl
        label={copy.subjectLabel}
        value={subjectId}
        onChange={onSubjectChange}
        hideDescription
        options={subjects.map((subject) => ({
          value: subject.id,
          label: subject.label,
          description: subject.description,
        }))}
      />
      <SelectControl
        label={copy.levelLabel}
        value={activeLevel.id}
        onChange={onLevelChange}
        hideDescription
        options={activeSubject.levels.map((level) => ({
          value: level.id,
          label: level.label,
          description: level.description,
        }))}
      />
      <SelectControl
        label={copy.topicLabel}
        value={topicId}
        onChange={onTopicChange}
        hideDescription
        options={[
          { value: "all", label: copy.allTopics, description: copy.allTopicsDescription },
          ...levelTopics.map((topic) => ({
            value: topic.id,
            label: topic.label,
            description: copy.questionCount(getTopicQuestionCount(topic.id, activeLevel.id)),
          })),
        ]}
      />
    </Box>
  );
}

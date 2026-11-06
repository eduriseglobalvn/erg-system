import type { BankQuestion, BankSubject } from "./types";

export interface QuestionFilterState {
  selectedLevel: string;
  selectedTopic: string;
  selectedDifficulty: string;
  questionSearch: string;
}

export function filterBankQuestions(
  allQuestions: BankQuestion[],
  currentSubject: BankSubject | undefined,
  { selectedLevel, selectedTopic, selectedDifficulty, questionSearch }: QuestionFilterState,
): BankQuestion[] {
  if (!currentSubject) return [];
  return allQuestions.filter((q) => {
    const matchSubject =
      q.subjectId === currentSubject.id || q.subjectLabel === currentSubject.label;
    const matchLevel =
      selectedLevel === "all" ||
      q.levelId === selectedLevel ||
      q.levelLabel === selectedLevel;
    const matchTopic =
      selectedTopic === "all" ||
      q.categoryId === selectedTopic ||
      q.categoryLabel === selectedTopic;
    const matchDifficulty =
      selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchSearch =
      !questionSearch.trim() ||
      q.stem.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.categoryLabel.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.levelLabel.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.tags?.some((t) => t.toLowerCase().includes(questionSearch.toLowerCase()));

    return matchSubject && matchLevel && matchTopic && matchDifficulty && matchSearch;
  });
}

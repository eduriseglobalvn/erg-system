import { useMemo, useState } from "react";
import { filterBankQuestions } from "./question-filter";
import type { BankQuestion, BankSubject } from "./types";

export function useQuestionPicker(allQuestions: BankQuestion[], currentSubject: BankSubject | undefined) {
  // BỘ LỌC NGANG: CẤP ĐỘ, CHỦ ĐỀ, ĐỘ KHÓ, TÌM KIẾM
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [questionSearch, setQuestionSearch] = useState("");

  // DANH SÁCH ID CÂU HỎI ĐÃ BỐC
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [customPickCount, setCustomPickCount] = useState("");

  // Danh sách các Topic có sẵn (tự động lọc theo Level đang chọn)
  const availableTopics = useMemo(() => {
    if (!currentSubject) return [];
    if (selectedLevel === "all") return currentSubject.categories;
    return currentSubject.categories.filter((c) => c.levelId === selectedLevel);
  }, [currentSubject, selectedLevel]);

  // Tổng số câu hỏi của môn học hiện tại
  const totalSubjectQuestions = useMemo(() => {
    if (!currentSubject) return 0;
    return allQuestions.filter(
      (q) => q.subjectId === currentSubject.id || q.subjectLabel === currentSubject.label
    ).length;
  }, [allQuestions, currentSubject]);

  // Lọc câu hỏi hiển thị
  const displayedQuestions = useMemo(
    () =>
      filterBankQuestions(allQuestions, currentSubject, {
        selectedLevel,
        selectedTopic,
        selectedDifficulty,
        questionSearch,
      }),
    [allQuestions, currentSubject, questionSearch, selectedDifficulty, selectedLevel, selectedTopic]
  );

  // Danh sách các object câu hỏi đã bốc
  const selectedQuestions = useMemo(() => {
    return allQuestions.filter((q) => selectedQuestionIds.includes(q.id));
  }, [allQuestions, selectedQuestionIds]);

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function pickRandomQuestions(count: number) {
    if (count <= 0 || displayedQuestions.length === 0) return;
    const effectiveCount = Math.min(count, displayedQuestions.length);
    const shuffled = [...displayedQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, effectiveCount).map((q) => q.id);
    setSelectedQuestionIds(picked);
  }

  function handleCustomPick() {
    const count = parseInt(customPickCount, 10);
    if (isNaN(count) || count <= 0) return;
    pickRandomQuestions(count);
    setCustomPickCount("");
  }

  function selectAllCurrentView() {
    const ids = displayedQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...ids])));
  }

  function deselectAllCurrentView() {
    const ids = displayedQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => prev.filter((id) => !ids.includes(id)));
  }

  function handleLevelChange(newLevelId: string) {
    setSelectedLevel(newLevelId);
    setSelectedTopic("all");
  }

  function resetFilters() {
    setSelectedLevel("all");
    setSelectedTopic("all");
    setSelectedDifficulty("all");
    setQuestionSearch("");
  }

  const hasActiveFilters =
    selectedLevel !== "all" ||
    selectedTopic !== "all" ||
    selectedDifficulty !== "all" ||
    questionSearch.trim() !== "";

  return {
    selectedLevel,
    setSelectedLevel,
    selectedTopic,
    setSelectedTopic,
    selectedDifficulty,
    setSelectedDifficulty,
    questionSearch,
    setQuestionSearch,
    selectedQuestionIds,
    setSelectedQuestionIds,
    customPickCount,
    setCustomPickCount,
    availableTopics,
    totalSubjectQuestions,
    displayedQuestions,
    selectedQuestions,
    toggleQuestion,
    handleCustomPick,
    selectAllCurrentView,
    deselectAllCurrentView,
    handleLevelChange,
    resetFilters,
    hasActiveFilters,
  };
}

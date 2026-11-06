import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import type { ParsedCurriculumItem } from "@/features/lcms/admin-operations/utils/curriculum-import-parser";
import type { EditableCurriculumRow, TopicGroup } from "./types";

export function useTeachingPlanRowEditing({
  rows,
  setRows,
  topicGroups,
  uniqueTopics,
  selectedTopic,
  setSelectedTopic,
}: {
  rows: EditableCurriculumRow[];
  setRows: Dispatch<SetStateAction<EditableCurriculumRow[]>>;
  topicGroups: TopicGroup[];
  uniqueTopics: string[];
  selectedTopic: string;
  setSelectedTopic: Dispatch<SetStateAction<string>>;
}) {
  function updateRow(index: number, patch: Partial<EditableCurriculumRow>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function updateTopicGroup(index: number, topic: string) {
    const group = topicGroups.find((candidate) => index >= candidate.start && index < candidate.end);
    if (!group) return updateRow(index, { topic });
    const oldTopic = group.topic;
    if (selectedTopic === oldTopic) {
      setSelectedTopic(topic);
    }
    setRows((current) => current.map((row, rowIndex) => (rowIndex >= group.start && rowIndex < group.end ? { ...row, topic } : row)));
  }

  function addNewTopic(customTopicName?: string, customFirstLesson?: string) {
    const nextIndex = topicGroups.length + 1;
    const topic = customTopicName || `Chủ đề ${nextIndex}: Tên chủ đề mới`;
    const title = customFirstLesson || "Bài 1: Tên bài học";
    setRows((current) => [
      ...current,
      {
        topic,
        period: current.length + 1,
        title,
        sessions: 1,
        isNew: true,
      },
    ]);
    setSelectedTopic(topic);
    toast.success(`Đã thêm "${topic}"`);
  }

  function addRowToTopic(
    topicName: string,
    insertIndex: number,
    type: "lesson" | "review" | "practice",
  ) {
    setRows((current) => {
      const next = [...current];
      let title = "Bài học mới";

      if (type === "review") {
        const allReviews = current.filter((r) => r.title.toLowerCase().includes("ôn tập"));
        title = `Ôn tập ${allReviews.length + 1}`;
      } else if (type === "practice") {
        const allPractice = current.filter((r) => r.title.toLowerCase().includes("luyện thi"));
        title = `Luyện thi ${allPractice.length + 1}`;
      } else {
        const topicLessons = current.filter(
          (r) =>
            r.topic === topicName &&
            !r.title.toLowerCase().includes("ôn tập") &&
            !r.title.toLowerCase().includes("luyện thi"),
        );
        title = `Bài ${topicLessons.length + 1}: Tên bài học`;
      }

      const newRow: EditableCurriculumRow = {
        topic: topicName,
        period: insertIndex + 1,
        title,
        sessions: 1,
        isNew: true,
      };

      next.splice(insertIndex, 0, newRow);
      return next.map((r, idx) => ({ ...r, period: idx + 1 }));
    });

    const typeLabel =
      type === "review"
        ? "tiết ôn tập"
        : type === "practice"
          ? "tiết luyện thi"
          : "bài học";
    toast.success(`Đã thêm ${typeLabel} vào "${topicName}"`);
  }

  function addRowToSelectedTopic(type: "lesson" | "review" | "practice") {
    const targetTopic = selectedTopic || uniqueTopics[uniqueTopics.length - 1];
    if (!targetTopic) {
      addNewTopic();
      return;
    }

    const group = topicGroups.find((g) => g.topic === targetTopic);
    const insertIndex = group ? group.end : rows.length;
    addRowToTopic(targetTopic, insertIndex, type);
  }

  function removeTopicGroup(topicName: string, count: number) {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa toàn bộ chủ đề "${topicName}" (${count} tiết học)?`,
      )
    ) {
      return;
    }
    setRows((current) =>
      current
        .filter((r) => r.topic !== topicName)
        .map((r, i) => ({ ...r, period: i + 1 })),
    );
    toast.success(`Đã xóa chủ đề "${topicName}". Các tiết đã được đánh số lại.`);
  }

  function addRow(defaultTitle = "Bài học mới", defaultTopic?: string) {
    setRows((current) => {
      const lastRow = current[current.length - 1];
      const targetTopic = defaultTopic || lastRow?.topic || "Chủ đề mới";
      return [
        ...current,
        {
          topic: targetTopic,
          period: current.length + 1,
          title: defaultTitle,
          sessions: 1,
          isNew: true,
        },
      ];
    });
  }

  function _addReviewPeriod() {
    const reviewRows = rows.filter((r) => r.title.toLowerCase().includes("ôn tập"));
    const reviewNumber = reviewRows.length + 1;
    const lastRow = rows[rows.length - 1];
    addRow(`Ôn tập ${reviewNumber}`, lastRow?.topic || "Ôn tập");
  }

  function _addPracticePeriod() {
    addNewTopic("Tăng cường / Luyện thi", "Luyện thi 1");
  }
  void _addReviewPeriod;
  void _addPracticePeriod;

  function renumberPeriods() {
    setRows((current) =>
      current.map((row, index) => ({
        ...row,
        period: index + 1,
      })),
    );
    toast.success("Đã tự động đánh số lại các tiết từ 1 đến " + rows.length);
  }

  function moveRow(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === rows.length - 1) return;

    setRows((current) => {
      const next = [...current];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next.map((r, i) => ({ ...r, period: i + 1 }));
    });
  }

  function removeRow(index: number) {
    setRows((current) =>
      current
        .filter((_, rowIndex) => rowIndex !== index)
        .map((row, rowIndex) => ({ ...row, period: rowIndex + 1 })),
    );
  }

  function handleApplyImportedRows(importedRows: ParsedCurriculumItem[]) {
    const converted: EditableCurriculumRow[] = importedRows.map((r, idx) => ({
      topic: r.topic,
      period: r.period || idx + 1,
      title: r.title,
      sessions: r.sessions || 1,
      isNew: true,
    }));
    setRows(converted);
    toast.success(`Đã áp dụng ${converted.length} dòng từ Excel vào khung chương trình.`);
  }

  return {
    updateRow,
    updateTopicGroup,
    addNewTopic,
    addRowToSelectedTopic,
    removeTopicGroup,
    renumberPeriods,
    moveRow,
    removeRow,
    handleApplyImportedRows,
  };
}

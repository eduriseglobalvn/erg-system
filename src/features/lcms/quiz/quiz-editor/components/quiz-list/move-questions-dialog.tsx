import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import type { MoveTarget } from "@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic";
import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";

/** Pick the level and topic the selected questions belong to; the open level+topic itself is not offered. */
export function MoveQuestionsDialog({ subject, currentLevelId, currentTopicId, count, onClose, onConfirm }: {
  subject: QuestionBankSubject;
  currentLevelId: string | null;
  currentTopicId: string;
  count: number;
  onClose: () => void;
  onConfirm: (target: MoveTarget) => Promise<void>;
}) {
  const [levelId, setLevelId] = useState(currentLevelId ?? subject.levels[0]?.id ?? "");
  const [topicId, setTopicId] = useState("");
  const [moving, setMoving] = useState(false);
  const topics = subject.categories.filter((topic) => topic.levelId === levelId && topic.id !== currentTopicId);
  const topic = topics.find((item) => item.id === topicId);

  async function confirm() {
    if (!topic) return;
    setMoving(true);
    try {
      await onConfirm({ subjectId: subject.id, levelId, topicId: topic.id, topicLabel: topic.label });
    } finally {
      setMoving(false);
    }
  }

  return (
    <ErgDialog
      open
      title={`Chuyển ${count} câu hỏi sang`}
      description="Câu hỏi được thêm vào bài của chủ đề đích (ở dạng nháp) rồi xoá khỏi bài đang mở."
      onClose={moving ? undefined : onClose}
      actions={(
        <>
          <Button disabled={moving} onClick={onClose} variant="text">Huỷ</Button>
          <ErgButton disabled={!topic} loading={moving} onClick={() => void confirm()} variant="contained">Chuyển</ErgButton>
        </>
      )}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <ErgTextField label="Cấp độ (Level)" onChange={(event) => { setLevelId(event.target.value); setTopicId(""); }} select value={levelId}>
          {subject.levels.map((level) => <MenuItem key={level.id} value={level.id}>{level.label}</MenuItem>)}
        </ErgTextField>
        <ErgTextField
          disabled={!topics.length}
          helperText={topics.length ? undefined : "Level này chưa có chủ đề khác."}
          label="Chủ đề"
          onChange={(event) => setTopicId(event.target.value)}
          select
          value={topicId}
        >
          {topics.map((item) => <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>)}
        </ErgTextField>
      </Stack>
    </ErgDialog>
  );
}

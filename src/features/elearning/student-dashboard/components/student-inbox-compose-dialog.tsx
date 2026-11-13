import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ErgButton, ErgDialog, ErgSelect, ErgTextField } from "@/components/erg-mui";

import { askTeacherAboutQuestion, type QuestionThread } from "../api/student-question-thread-api";

export type ComposeAssignment = { id: string; title?: string };

type ComposeDialogProps = {
  assignments: ReadonlyArray<ComposeAssignment>;
  open: boolean;
  onClose: () => void;
  onSent: (thread: QuestionThread) => void;
};

/** "Hỏi giáo viên": the BE only opens a thread about one question of one assignment, so the student picks both first. */
export function StudentInboxComposeDialog({ assignments, open, onClose, onSent }: ComposeDialogProps) {
  const queryClient = useQueryClient();
  const [assignmentId, setAssignmentId] = useState("");
  const [questionNo, setQuestionNo] = useState("");
  const [message, setMessage] = useState("");
  const index = Number(questionNo);
  const valid = Boolean(assignmentId) && Number.isInteger(index) && index >= 1 && message.trim().length > 0;
  const send = useMutation({
    mutationFn: () => askTeacherAboutQuestion(assignmentId, index, message.trim()),
    onSuccess: (thread) => {
      void queryClient.invalidateQueries({ queryKey: ["student-question-threads"] });
      setAssignmentId(""); setQuestionNo(""); setMessage("");
      onSent(thread);
    },
  });
  return (
    <ErgDialog
      open={open} onClose={onClose} title="Hỏi giáo viên" description="Chọn bài và câu em muốn hỏi, rồi viết tin nhắn cho cô."
      actions={(
        <>
          <ErgButton variant="text" onClick={onClose}>Hủy</ErgButton>
          <ErgButton variant="contained" disabled={!valid} loading={send.isPending} onClick={() => send.mutate()}>Gửi</ErgButton>
        </>
      )}
    >
      <ErgSelect
        label="Bài tập" value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)} sx={{ mb: 2 }}
        options={assignments.map((assignment) => ({ value: assignment.id, label: assignment.title ?? assignment.id }))}
      />
      <ErgTextField label="Câu số" type="number" value={questionNo} onChange={(event) => setQuestionNo(event.target.value)} slotProps={{ htmlInput: { min: 1 } }} sx={{ mb: 2 }} fullWidth />
      <ErgTextField label="Tin nhắn cho giáo viên" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={3} fullWidth />
    </ErgDialog>
  );
}

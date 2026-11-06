import Alert from "@mui/material/Alert";

import type { QuizDraftSyncStatus } from "../../sync/quiz-draft-sync-engine";

export function QuizEditorOfflineBanner({ status }: { status: QuizDraftSyncStatus }) {
  if (status.kind !== "offline") return null;
  return (
    <Alert severity="warning">
      Mất kết nối. Bạn vẫn soạn bình thường, mọi thay đổi được giữ trên máy này và tự gửi khi có mạng lại.
    </Alert>
  );
}

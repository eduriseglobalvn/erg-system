import Box from "@mui/material/Box";
import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

import type { UseQuizDraftSyncResult } from "../../sync/use-quiz-draft-sync";
import { QuizEditorConflictDialog } from "./quiz-editor-conflict-dialog";
import { QuizEditorOfflineBanner } from "./quiz-editor-offline-banner";
import { QuizEditorRecoveryNotice, type RecoveryDismissed } from "./quiz-editor-recovery-notice";

type DismissedByQuiz = Record<string, RecoveryDismissed>;
const NONE_DISMISSED: RecoveryDismissed = { recovered: false, backups: false };
const DismissContext = createContext<{ dismissed: DismissedByQuiz; dismiss: (quizId: string, which: keyof RecoveryDismissed) => void } | null>(null);

/** The offline strip and the unsent-changes / backup notices; the full-screen question editor shows its own copy. */
export function QuizEditorSyncNotices({ sync }: { sync: UseQuizDraftSyncResult }) {
  const ctx = useContext(DismissContext);
  const quizId = sync.quizId ?? "";
  return (
    <>
      <QuizEditorOfflineBanner status={sync.status} />
      <QuizEditorRecoveryNotice
        backups={sync.backups}
        dismissed={ctx?.dismissed[quizId] ?? NONE_DISMISSED}
        onDismiss={(which) => ctx?.dismiss(quizId, which)}
        onRestore={sync.restoreBackup}
        recovered={sync.recovered}
      />
    </>
  );
}

/** Keeps the editor out until the draft is ready (anything typed before would be lost), then adds the sync notices. */
export function QuizEditorSyncLayer({ children, loadFailed, onRetry, retrying, sync }: {
  sync: UseQuizDraftSyncResult;
  loadFailed: boolean;
  retrying: boolean;
  onRetry: () => void;
  children: ReactNode;
}) {
  const [resolving, setResolving] = useState(false);
  // Both notice mounts (list and full-screen editor) read this, so dismissing one hides the other.
  const [dismissed, setDismissed] = useState<DismissedByQuiz>({});
  const dismiss = (quizId: string, which: keyof RecoveryDismissed) =>
    setDismissed((d) => ({ ...d, [quizId]: { ...(d[quizId] ?? NONE_DISMISSED), [which]: true } }));

  if (!sync.ready) {
    if (!loadFailed) return <ContentPendingSkeleton />;
    return (
      <Box sx={{ p: 2.5 }}>
        <ErgErrorState
          action={<ErgButton loading={retrying} onClick={onRetry} variant="outlined">Thử lại</ErgButton>}
          description={sync.status.kind === "error" ? sync.status.message : "Kiểm tra kết nối mạng rồi thử lại."}
          title="Chưa mở được bản nháp"
        />
      </Box>
    );
  }

  const resolve = (choice: "mine" | "server") => {
    setResolving(true);
    sync
      .resolveConflict(choice)
      .catch(() => toast.error("Chưa tải được bản trên máy chủ. Thử lại sau."))
      .finally(() => setResolving(false));
  };

  return (
    <DismissContext.Provider value={{ dismissed, dismiss }}>
      <QuizEditorSyncNotices sync={sync} />
      {children}
      <QuizEditorConflictDialog
        busy={resolving}
        onKeepMine={() => resolve("mine")}
        onUseServer={() => resolve("server")}
        open={sync.status.kind === "conflict"}
      />
    </DismissContext.Provider>
  );
}

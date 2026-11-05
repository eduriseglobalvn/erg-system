import Box from "@mui/material/Box";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgErrorState } from "@/components/erg-mui/erg-feedback";
import { ContentPendingSkeleton } from "@/routes/route-feedback";

import type { UseQuizDraftSyncResult } from "../../sync/use-quiz-draft-sync";
import { QuizEditorConflictDialog } from "./quiz-editor-conflict-dialog";
import { QuizEditorOfflineBanner } from "./quiz-editor-offline-banner";
import { QuizEditorRecoveryNotice } from "./quiz-editor-recovery-notice";

/** The offline strip and the unsent-changes / backup notices; the full-screen question editor shows its own copy. */
export function QuizEditorSyncNotices({ sync }: { sync: UseQuizDraftSyncResult }) {
  return (
    <>
      <QuizEditorOfflineBanner status={sync.status} />
      <QuizEditorRecoveryNotice backups={sync.backups} onRestore={sync.restoreBackup} recovered={sync.recovered} />
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

  if (!sync.ready) {
    if (!loadFailed) return <ContentPendingSkeleton />;
    return (
      <Box sx={{ p: 2.5 }}>
        <ErgErrorState
          action={<ErgButton loading={retrying} onClick={onRetry} variant="contained">Thử lại</ErgButton>}
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
    <>
      <QuizEditorSyncNotices sync={sync} />
      {children}
      <QuizEditorConflictDialog
        busy={resolving}
        onKeepMine={() => resolve("mine")}
        onUseServer={() => resolve("server")}
        open={sync.status.kind === "conflict"}
      />
    </>
  );
}

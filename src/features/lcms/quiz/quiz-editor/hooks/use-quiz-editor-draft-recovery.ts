import { useEffect, useMemo, useRef } from "react";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  clearLocalQuizDraft,
  loadLocalQuizDraft,
  saveLocalQuizDraft,
} from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft";
import { createBlankDraft } from "@/features/lcms/quiz/quiz-editor/sync/quiz-draft-initial-document";
import { isLegacyMockDraft } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace-utils";
import type { QuizEditorGroup, QuizPlayerTemplate, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { AUTH_SESSION_INVALID_EVENT, AUTH_SESSION_REPLACED_EVENT } from "@/lib/api-client";
import { getDefaultTenantId } from "@/lib/graphql-client";

/** Local draft used to seed the editor state; must run before useQuizEditorState. */
export function useInitialLocalDraft(activeDraftKey: string) {
  return useMemo(() => {
    clearLocalQuizDraft(getDefaultTenantId(), "default-quiz-draft");
    const loaded = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), activeDraftKey)?.payload ?? null;
    if (isLegacyMockDraft(loaded)) {
      clearLocalQuizDraft(getDefaultTenantId(), activeDraftKey);
      return null;
    }
    return loaded;
  }, [activeDraftKey]);
}

/**
 * Draft hydration + local autosave. Owns the race guards:
 * - autosaveKeyRef/draftReadyForRecoveryRef/activeKeyRef pause autosave on every quiz switch until the next draft hydrates;
 * - hydratedDraftSignatureRef (returned) is also written by save/publish so the server draft they just stored is not re-hydrated.
 */
export function useQuizEditorDraftRecovery({
  activeDraftKey,
  effectiveQuizId,
  hydrateDraftDocument,
  serverDraft,
  quizProject,
  playerTemplate,
  groups,
}: {
  activeDraftKey: string;
  effectiveQuizId: string;
  hydrateDraftDocument: (doc: QuizEditorDraftDocument) => void;
  serverDraft: QuizEditorDraftDocument | undefined;
  quizProject: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  groups: QuizEditorGroup[];
}) {
  const hydratedDraftSignatureRef = useRef("");
  const draftReadyForRecoveryRef = useRef(false);
  const activeKeyRef = useRef<string | null>(null);
  const autosaveKeyRef = useRef(effectiveQuizId);

  // Editor state still holds the previous quiz until the next draft hydrates; autosaving then would
  // write quiz A's content under quiz B's key. Pause autosave on every quiz switch.
  useEffect(() => {
    if (autosaveKeyRef.current === effectiveQuizId) return;
    autosaveKeyRef.current = effectiveQuizId;
    draftReadyForRecoveryRef.current = false;
    activeKeyRef.current = null; // let the new-draft effect re-hydrate when switching back to an unsaved quiz
  }, [effectiveQuizId]);

  useEffect(() => {
    if (effectiveQuizId) return;

    if (activeKeyRef.current === activeDraftKey) return;
    activeKeyRef.current = activeDraftKey;

    const localDraft = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), activeDraftKey);
    if (localDraft?.payload && !isLegacyMockDraft(localDraft.payload)) {
      hydrateDraftDocument(localDraft.payload);
    } else {
      hydrateDraftDocument(createBlankDraft(activeDraftKey, `local-${activeDraftKey}`));
    }
    draftReadyForRecoveryRef.current = true;
  }, [activeDraftKey, effectiveQuizId, hydrateDraftDocument]);

  useEffect(() => {
    if (!effectiveQuizId || !serverDraft) return;

    const draftSignature = `${serverDraft.quizId}:${serverDraft.docVersion}`;
    if (draftSignature === hydratedDraftSignatureRef.current) return;

    hydratedDraftSignatureRef.current = draftSignature;
    const localDraft = loadLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), effectiveQuizId);
    const serverUpdatedAt = Date.parse(serverDraft.updatedAt ?? "");
    const localUpdatedAt = Date.parse(localDraft?.savedAt ?? "");
    hydrateDraftDocument(
      localDraft && (!Number.isFinite(serverUpdatedAt) || localUpdatedAt > serverUpdatedAt)
        ? localDraft.payload
        : serverDraft,
    );
    draftReadyForRecoveryRef.current = true;
  }, [effectiveQuizId, hydrateDraftDocument, serverDraft]);

  useEffect(() => {
    if (!draftReadyForRecoveryRef.current) return;
    const currentKey = effectiveQuizId || activeDraftKey;
    const timer = window.setTimeout(() => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), currentKey, {
        quizId: currentKey,
        draftId: serverDraft?.draftId ?? `local-${currentKey}`,
        docVersion: serverDraft?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [activeDraftKey, effectiveQuizId, groups, playerTemplate, serverDraft?.docVersion, serverDraft?.draftId, quizProject]);

  useEffect(() => {
    if (!draftReadyForRecoveryRef.current) return;
    const currentKey = effectiveQuizId || activeDraftKey;
    const persistRecoveryDraft = () => {
      saveLocalQuizDraft<QuizEditorDraftDocument>(getDefaultTenantId(), currentKey, {
        quizId: currentKey,
        draftId: serverDraft?.draftId ?? `local-${currentKey}`,
        docVersion: serverDraft?.docVersion ?? 0,
        settings: quizProject,
        playerTemplate,
        tree: groups,
      });
    };
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
    window.addEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
    window.addEventListener("pagehide", persistRecoveryDraft);
    window.addEventListener("beforeunload", persistRecoveryDraft);
    return () => {
      window.removeEventListener(AUTH_SESSION_INVALID_EVENT, persistRecoveryDraft);
      window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, persistRecoveryDraft);
      window.removeEventListener("pagehide", persistRecoveryDraft);
      window.removeEventListener("beforeunload", persistRecoveryDraft);
    };
  }, [activeDraftKey, effectiveQuizId, groups, playerTemplate, serverDraft?.docVersion, serverDraft?.draftId, quizProject]);

  return { hydratedDraftSignatureRef };
}

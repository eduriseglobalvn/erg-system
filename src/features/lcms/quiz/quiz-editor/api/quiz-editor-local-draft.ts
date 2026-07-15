const LOCAL_DRAFT_PREFIX = "erg:quiz-editor:recovery:v1";
const LOCAL_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type LocalQuizDraft<T = unknown> = {
  savedAt: string;
  payload: T;
};

export function saveLocalQuizDraft<T>(tenantId: string, quizId: string, payload: T) {
  const draft: LocalQuizDraft<T> = { savedAt: new Date().toISOString(), payload };
  localStorage.setItem(localDraftKey(tenantId, quizId), JSON.stringify(draft));
}

export function loadLocalQuizDraft<T>(tenantId: string, quizId: string): LocalQuizDraft<T> | null {
  try {
    const raw = localStorage.getItem(localDraftKey(tenantId, quizId));
    if (!raw) return null;
    const draft = JSON.parse(raw) as LocalQuizDraft<T>;
    const savedAt = Date.parse(draft.savedAt);
    if (!Number.isFinite(savedAt) || Date.now() - savedAt > LOCAL_DRAFT_MAX_AGE_MS) {
      clearLocalQuizDraft(tenantId, quizId);
      return null;
    }
    return draft;
  } catch {
    clearLocalQuizDraft(tenantId, quizId);
    return null;
  }
}

export function clearLocalQuizDraft(tenantId: string, quizId: string) {
  localStorage.removeItem(localDraftKey(tenantId, quizId));
}

function localDraftKey(tenantId: string, quizId: string) {
  return `${LOCAL_DRAFT_PREFIX}:${encodeURIComponent(tenantId)}:${encodeURIComponent(quizId)}`;
}

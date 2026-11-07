import { useRef, useState } from "react";

import { newIdempotencyKey } from "../../api/timekeeping-api";
import { usePunchMutation } from "../../api/timekeeping-query";
import { timekeepingErrorCode, type PunchInput, type PunchResult } from "../../api/timekeeping-types";

const NETWORK_MESSAGE = "Không kết nối được máy chủ. Bấm lại để thử lại, lượt chấm sẽ không bị trùng.";

/** Reuse the key when the outcome is unknown (no response, timeout, 5xx): the server replays the stored punch. */
function outcomeUnknown(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status !== "number" || status === 0 || status === 408 || status >= 500;
}

/**
 * One Idempotency-Key per user attempt: created on the first tap, kept across network-error retries,
 * dropped on success or on any answer the server actually gave (so the next tap is a new attempt).
 */
export function usePunchAttempt(onConsentRequired: () => void) {
  const mutation = usePunchMutation();
  const keyRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (input: PunchInput): Promise<PunchResult | null> => {
    keyRef.current ??= newIdempotencyKey();
    setError(null);
    try {
      const result = await mutation.mutateAsync({ input, idempotencyKey: keyRef.current });
      keyRef.current = null;
      return result;
    } catch (failure) {
      if (!outcomeUnknown(failure)) keyRef.current = null;
      if (timekeepingErrorCode(failure) === "FACE_CONSENT_REQUIRED") onConsentRequired();
      else {
        const status = (failure as { status?: unknown } | null)?.status;
        setError(typeof status !== "number" || status === 0 || !(failure instanceof Error) ? NETWORK_MESSAGE : failure.message);
      }
      return null;
    }
  };

  return { submit, error, pending: mutation.isPending, isRetry: () => keyRef.current !== null };
}

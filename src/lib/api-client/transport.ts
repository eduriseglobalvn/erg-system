import { ApiClientError } from "./errors";
import type { ApiRequestOptions } from "./response";

export const DEFAULT_API_TIMEOUT_MS = 15_000;

export async function fetchApi(url: string, headers: Headers, init?: ApiRequestOptions) {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const timeoutController = timeoutMs > 0 && typeof AbortController !== "undefined" ? new AbortController() : null;
  const sourceSignal = init?.signal;
  if (sourceSignal?.aborted) {
    throw sourceSignal.reason;
  }
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let removeSourceAbortListener: (() => void) | undefined;

  if (timeoutController && sourceSignal) {
    if (sourceSignal.aborted) {
      timeoutController.abort(sourceSignal.reason);
    } else {
      const onSourceAbort = () => timeoutController.abort(sourceSignal.reason);
      sourceSignal.addEventListener("abort", onSourceAbort, { once: true });
      removeSourceAbortListener = () => sourceSignal.removeEventListener("abort", onSourceAbort);
    }
  }

  if (timeoutController) {
    timeoutId = setTimeout(() => timeoutController.abort(new Error("API_REQUEST_TIMEOUT")), timeoutMs);
  }

  const { signal: _signal, timeoutMs: _timeoutMs, responseType: _responseType, ...fetchInit } = init ?? {};

  try {
    return await fetch(url, {
      ...fetchInit,
      headers,
      cache: init?.cache ?? "no-store",
      credentials: init?.credentials ?? "include",
      referrerPolicy: init?.referrerPolicy ?? "no-referrer",
      signal: timeoutController?.signal ?? sourceSignal,
    });
  } catch (error) {
    if (sourceSignal?.aborted) {
      throw sourceSignal.reason;
    }
    if (timeoutController?.signal.aborted && timeoutController.signal.reason instanceof Error && timeoutController.signal.reason.message === "API_REQUEST_TIMEOUT") {
      throw new ApiClientError(`API request timed out after ${timeoutMs}ms.`, "REQUEST_TIMEOUT", 408);
    }

    throw new ApiClientError(
      error instanceof Error && error.message ? error.message : "Cannot connect to API server.",
      "NETWORK_ERROR",
      0,
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    removeSourceAbortListener?.();
  }
}

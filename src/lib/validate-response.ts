/**
 * Runtime validation at the API boundary.
 *
 * We have no schema lib (zod/valibot) installed and don't want to add one for a
 * few guards, so this is a hand-written type-guard runner. It turns a malformed
 * backend payload into a single clear, typed error at the boundary instead of a
 * confusing crash deep in the UI (e.g. reading `.account.email` of undefined).
 */

/**
 * Thrown when a backend response does not match the shape the app relies on.
 * Mirrors the field shape of `ApiClientError` (message/code/status/details) so
 * callers and error boundaries can treat it uniformly.
 */
export class ResponseValidationError extends ApiClientError {
  constructor(context: string, details?: unknown) {
    super(
      `Backend response for "${context}" has an unexpected shape.`,
      "INVALID_RESPONSE_SHAPE",
      502,
      details,
      getApiResponseRequestId(details),
    );
    this.name = "ResponseValidationError";
  }
}

/**
 * Validates `value` against `guard`. Returns the value narrowed to `T` when it
 * passes; throws `ResponseValidationError` (tagged with `context`) when it does
 * not.
 */
export function validateResponse<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  context: string,
): T {
  if (!guard(value)) {
    throw new ResponseValidationError(context, value);
  }
  return value;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
import { ApiClientError, getApiResponseRequestId } from "@/lib/api-client";

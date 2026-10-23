import { expect, test } from "vitest";

import { ResponseValidationError, isNonEmptyString, isObject, validateResponse } from "./validate-response";
import { ApiClientError } from "./api-client";

type Session = { token: string };

function isSession(value: unknown): value is Session {
  return isObject(value) && isNonEmptyString(value.token);
}

test("validateResponse returns the value narrowed to T for a valid payload", () => {
  const payload: unknown = { token: "abc" };
  const session = validateResponse(payload, isSession, "test.session");
  expect(session.token).toBe("abc");
});

test("validateResponse throws a clear typed error for a malformed payload", () => {
  const bad: unknown = { request_id: "req-validation-1", token: "" };
  expect(() => validateResponse(bad, isSession, "test.session")).toThrowError(ResponseValidationError);

  try {
    validateResponse(bad, isSession, "test.session");
  } catch (error) {
    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error).toBeInstanceOf(ApiClientError);
    const validationError = error as ResponseValidationError;
    expect(validationError.code).toBe("INVALID_RESPONSE_SHAPE");
    expect(validationError.status).toBe(502);
    expect(validationError.message).toContain("test.session");
    expect(validationError.details).toBe(bad);
    expect(validationError.requestId).toBe("req-validation-1");
  }
});

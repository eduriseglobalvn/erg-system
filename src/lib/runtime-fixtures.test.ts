import { expect, test } from "vitest";

import { evaluateRuntimeFixtureMode } from "./runtime-fixtures";

test("keeps runtime fixtures disabled in production even when the flag is present", () => {
  expect(evaluateRuntimeFixtureMode({ DEV: false, VITE_ENABLE_RUNTIME_FIXTURES: "true" })).toBe(false);
});

test("requires an explicit fixture flag in local development", () => {
  expect(evaluateRuntimeFixtureMode({ DEV: true })).toBe(false);
  expect(evaluateRuntimeFixtureMode({ DEV: true, VITE_ENABLE_RUNTIME_FIXTURES: "false" })).toBe(false);
  expect(evaluateRuntimeFixtureMode({ DEV: true, VITE_ENABLE_RUNTIME_FIXTURES: "true" })).toBe(true);
});

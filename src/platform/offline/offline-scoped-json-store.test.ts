import { describe, expect, test } from "vitest";

import {
  MemoryScopedJsonStore,
  assertOfflineSafeJson,
} from "@/platform/offline/offline-scoped-json-store";

describe("scoped offline JSON storage", () => {
  test("isolates records by scope and clones values", async () => {
    const store = new MemoryScopedJsonStore();
    const value = { answers: { question: { choiceId: "a" } } } as const;

    await store.set("scope-a", "attempt-1", value);
    const restored = await store.get<typeof value>("scope-a", "attempt-1");
    expect(restored).toEqual(value);
    expect(await store.get("scope-b", "attempt-1")).toBeNull();

    if (restored) restored.answers.question.choiceId = "changed";
    expect(await store.get<typeof value>("scope-a", "attempt-1")).toEqual(value);
  });

  test("rejects token and credential material before persistence", async () => {
    const store = new MemoryScopedJsonStore();

    expect(() => assertOfflineSafeJson({ accessToken: "never" })).toThrow(/cannot be stored offline/i);
    await expect(store.set("scope-a", "attempt-1", { metadata: { refresh_token: "never" } })).rejects.toThrow();
    expect(await store.list("scope-a")).toEqual([]);
  });
});

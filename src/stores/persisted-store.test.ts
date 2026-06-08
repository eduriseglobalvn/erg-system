import { beforeEach, expect, test } from "vitest";

import {
  createPersistedStore,
  getPersistedJsonValue,
  removePersistedJsonValue,
  setPersistedJsonValue,
} from "@/stores/persisted-store";

beforeEach(() => {
  window.localStorage.clear();
});

test("createPersistedStore hydrates from localStorage and persists updates", () => {
  window.localStorage.setItem("test-store", JSON.stringify({ activeLeafId: "ops-overview" }));

  const persistedStore = createPersistedStore("test-store", { activeLeafId: "fallback" });
  expect(persistedStore.get()).toEqual({ activeLeafId: "ops-overview" });

  persistedStore.set({ activeLeafId: "admin-overview" });
  expect(JSON.parse(window.localStorage.getItem("test-store") ?? "{}")).toEqual({ activeLeafId: "admin-overview" });
});

test("createPersistedStore falls back to initial value for invalid JSON", () => {
  window.localStorage.setItem("broken-store", "{");

  const persistedStore = createPersistedStore("broken-store", { count: 1 });
  expect(persistedStore.get()).toEqual({ count: 1 });
});

test("persisted JSON helpers hydrate primitive and legacy raw string values", () => {
  window.localStorage.setItem("locale-store", "vi");

  expect(getPersistedJsonValue("locale-store", "en")).toBe("vi");

  setPersistedJsonValue("locale-store", "en");

  expect(JSON.parse(window.localStorage.getItem("locale-store") ?? "")).toBe("en");
});

test("persisted JSON helpers share TanStack Store state and remove local values", () => {
  setPersistedJsonValue("session-store", { accessToken: "token-1" });

  expect(getPersistedJsonValue("session-store", null)).toEqual({ accessToken: "token-1" });
  expect(JSON.parse(window.localStorage.getItem("session-store") ?? "{}")).toEqual({ accessToken: "token-1" });

  removePersistedJsonValue("session-store");

  expect(getPersistedJsonValue("session-store", null)).toBeNull();
  expect(window.localStorage.getItem("session-store")).toBeNull();
});

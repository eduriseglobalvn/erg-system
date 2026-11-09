import "fake-indexeddb/auto";
import { get, set } from "idb-keyval";
import { expect, it } from "vitest";
import { createErgStore } from "./erg-idb-store";

it("lets many stores share the erg-system database (idb-keyval's createStore only creates the first)", async () => {
  const names = ["offline-outbox", "offline-outbox-keys", "query-cache", "quiz-attempt-sessions-v2"];
  const stores = names.map((name) => createErgStore(name));

  // All opened at once, the way a page load does it.
  await Promise.all(stores.map((store, index) => set("k", `v-${index}`, store)));

  for (const [index, store] of stores.entries()) {
    expect(await get("k", store)).toBe(`v-${index}`);
  }
});

it("keeps data in a store that already existed before a sibling store is added", async () => {
  const first = createErgStore("legacy-first");
  await set("keep", 1, first);

  await set("x", 2, createErgStore("added-later"));

  expect(await get("keep", createErgStore("legacy-first"))).toBe(1);
});

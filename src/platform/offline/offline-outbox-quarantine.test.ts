import { expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
vi.mock("idb-keyval", () => ({
  createStore: (_db: string, name: string) => name,
  get: async (key: string, store: string) => db.get(`${store}|${key}`),
  set: async (key: string, value: unknown, store: string) => void db.set(`${store}|${key}`, value),
  del: async (key: string, store: string) => void db.delete(`${store}|${key}`),
  keys: async (store: string) => [...db.keys()].filter((k) => k.startsWith(`${store}|`)).map((k) => k.slice(store.length + 1)),
}));

import { EncryptedIndexedDbOutboxStore } from "@/platform/offline/offline-outbox-store";

it("quarantines an undecryptable record instead of deleting it", async () => {
  const store = new EncryptedIndexedDbOutboxStore();
  const record = { schemaVersion: 2, algorithm: "AES-GCM", iv: "AAAA", ciphertext: "AAAA" };
  db.set("offline-outbox|erg-offline-outbox:scope", record);
  vi.spyOn(console, "error").mockImplementation(() => {});

  expect(await store.load("scope")).toEqual([]);

  expect(db.has("offline-outbox|erg-offline-outbox:scope")).toBe(false);
  const quarantined = await store.listQuarantined();
  expect(quarantined).toHaveLength(1);
  expect(db.get(`offline-outbox-quarantine|${quarantined[0]}`)).toEqual(record);
});

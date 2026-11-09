import { expect, it, vi } from "vitest";

const db = new Map<string, unknown>();
vi.mock("@/platform/offline/erg-idb-store", () => ({ createErgStore: (name: string) => name }));
vi.mock("idb-keyval", () => ({
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

it("retry keeps still-undecryptable records, restores readable ones, and delete empties quarantine", async () => {
  db.clear();
  const store = new EncryptedIndexedDbOutboxStore();
  db.set("offline-outbox-quarantine|erg-offline-quarantine:scope-a:1", { schemaVersion: 2, algorithm: "AES-GCM", iv: "AAAA", ciphertext: "AAAA" });
  db.set("offline-outbox-quarantine|erg-offline-quarantine:scope:b:2", { schemaVersion: 1, entries: [] });

  expect(await store.retryQuarantined()).toEqual({ restored: 1, failed: 1 });
  expect(await store.listQuarantined()).toEqual(["erg-offline-quarantine:scope-a:1"]);

  expect(await store.deleteQuarantined()).toBe(1);
  expect(await store.listQuarantined()).toEqual([]);
});

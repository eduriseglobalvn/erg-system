import type { UseStore } from "idb-keyval";

const DB_NAME = "erg-system";

// idb-keyval's createStore("erg-system", name) opens the database at version 1 and only creates `name`
// when the database is first made. Every later store sharing the name then fails with "One of the specified
// object stores was not found", so each store must be added through a version upgrade instead.
let upgradeQueue: Promise<unknown> = Promise.resolve();

function openWithStore(storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const probe = indexedDB.open(DB_NAME);
    probe.onerror = () => reject(probe.error);
    probe.onsuccess = () => {
      const current = probe.result;
      if (current.objectStoreNames.contains(storeName)) {
        current.onversionchange = () => current.close();
        resolve(current);
        return;
      }
      const nextVersion = current.version + 1;
      current.close();
      const upgrade = indexedDB.open(DB_NAME, nextVersion);
      upgrade.onupgradeneeded = () => {
        if (!upgrade.result.objectStoreNames.contains(storeName)) upgrade.result.createObjectStore(storeName);
      };
      upgrade.onerror = () => reject(upgrade.error);
      upgrade.onsuccess = () => {
        upgrade.result.onversionchange = () => upgrade.result.close();
        resolve(upgrade.result);
      };
    };
  });
}

/** Same contract as idb-keyval's createStore, but safe to call for many stores in one database. */
export function createErgStore(storeName: string): UseStore {
  let connection: Promise<IDBDatabase> | undefined;
  const connect = () => {
    // Serialized: two stores upgrading at once would block each other's version change.
    connection ??= upgradeQueue.then(() => openWithStore(storeName));
    upgradeQueue = connection.catch(() => undefined);
    return connection;
  };
  return async (txMode, callback) => {
    for (let attempt = 0; ; attempt += 1) {
      const db = await connect();
      try {
        return await callback(db.transaction(storeName, txMode).objectStore(storeName));
      } catch (error) {
        // A sibling store's upgrade closed this connection (versionchange): reopen once.
        const closed = error instanceof DOMException && error.name === "InvalidStateError";
        if (!closed || attempt > 0) throw error;
        connection = undefined;
      }
    }
  };
}

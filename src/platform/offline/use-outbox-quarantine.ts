import { useCallback, useEffect, useState } from "react";

import { EncryptedIndexedDbOutboxStore } from "./offline-outbox-store";

let store: EncryptedIndexedDbOutboxStore | null | undefined;

function getStore() {
  if (store === undefined) {
    store = typeof indexedDB !== "undefined" && globalThis.crypto?.subtle ? new EncryptedIndexedDbOutboxStore() : null;
  }
  return store;
}

const POLL_MS = 30_000;

/** Surfaces unsynced offline records that failed to decode, with retry and (caller-confirmed) delete. */
export function useOutboxQuarantine() {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCount((await getStore()?.listQuarantined())?.length ?? 0);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const run = useCallback(
    async (action: (target: EncryptedIndexedDbOutboxStore) => Promise<unknown>) => {
      const target = getStore();
      if (!target) return;
      setBusy(true);
      try {
        await action(target);
      } finally {
        setBusy(false);
        await refresh();
      }
    },
    [refresh],
  );

  return {
    count,
    busy,
    retry: () => run((target) => target.retryQuarantined()),
    discard: () => run((target) => target.deleteQuarantined()),
  };
}

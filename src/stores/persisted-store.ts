import { Store } from "@tanstack/store";

type PersistedStore<TValue> = {
  get: () => TValue;
  set: (value: TValue) => void;
  store: Store<TValue>;
};

const persistedStoreCache = new Map<string, PersistedStore<unknown>>();

export function createPersistedStore<TValue>(key: string, initialValue: TValue): PersistedStore<TValue> {
  const store = new Store(readInitialValue(key, initialValue));

  store.subscribe((value) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  });

  return {
    get: store.get,
    set: (value) => store.setState(() => value),
    store,
  };
}

export function getPersistedJsonValue<TValue>(key: string, fallback: TValue) {
  const store = getCachedPersistedStore(key, fallback);
  const latestValue = readInitialValue(key, fallback);

  if (JSON.stringify(store.get()) !== JSON.stringify(latestValue)) {
    store.store.setState(() => latestValue);
  }

  return store.get();
}

export function setPersistedJsonValue<TValue>(key: string, value: TValue) {
  getCachedPersistedStore<TValue | null>(key, null).set(value);
}

export function removePersistedJsonValue(key: string) {
  getCachedPersistedStore<unknown | null>(key, null).set(null);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key);
  }
}

export function listPersistedJsonKeys(prefix: string) {
  if (typeof window === "undefined") return [];

  return Object.keys(window.localStorage).filter((key) => key.startsWith(prefix));
}

function getCachedPersistedStore<TValue>(key: string, fallback: TValue) {
  const cachedStore = persistedStoreCache.get(key);
  if (cachedStore) return cachedStore as PersistedStore<TValue>;

  const store = createPersistedStore(key, fallback);
  persistedStoreCache.set(key, store as PersistedStore<unknown>);
  return store;
}

function readInitialValue<TValue>(key: string, initialValue: TValue) {
  if (typeof window === "undefined") return initialValue;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return initialValue;

    const parsedValue = JSON.parse(rawValue) as TValue;
    return parsedValue === null ? initialValue : parsedValue;
  } catch {
    const rawValue = window.localStorage.getItem(key);
    if (typeof initialValue === "string" && rawValue) return rawValue as TValue;

    return initialValue;
  }
}

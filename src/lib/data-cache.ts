const store = new Map<string, unknown>();

export function readCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function writeCache<T>(key: string, value: T) {
  store.set(key, value);
}

export function clearDataCache() {
  store.clear();
}

/** One-time migration from legacy WaBiz localStorage/sessionStorage keys. */
const LEGACY_LOCAL_PREFIX = 'wabiz_';
const LEGACY_EVENT_PREFIX = 'wabiz:';

function migrateStorage(store: Storage) {
  const keys: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (key) keys.push(key);
  }
  for (const key of keys) {
    if (!key.startsWith(LEGACY_LOCAL_PREFIX) && !key.startsWith(LEGACY_EVENT_PREFIX)) continue;
    const newKey = key
      .replace(/^wabiz_/, 'convosync_')
      .replace(/^wabiz:/, 'convosync:');
    if (!store.getItem(newKey)) {
      const value = store.getItem(key);
      if (value !== null) store.setItem(newKey, value);
    }
    store.removeItem(key);
  }
}

export function migrateLegacyStorage() {
  if (typeof window === 'undefined') return;
  migrateStorage(localStorage);
  migrateStorage(sessionStorage);
}

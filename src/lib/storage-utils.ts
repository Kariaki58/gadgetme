const STORAGE_KEY_PREFIX = 'storestack_';

export function getStorageData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.error('Failed to parse storage data', e);
    return null;
  }
}

export function setStorageData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
}

export function removeStorageData(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_PREFIX + key);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
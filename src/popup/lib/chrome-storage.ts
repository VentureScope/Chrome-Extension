export type StorageArea = "local" | "sync";

function getChrome() {
  return globalThis.chrome;
}

export async function storageGet<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  area: StorageArea = "local",
): Promise<Partial<T>> {
  const chrome = getChrome();
  if (!chrome?.storage?.[area]) return {};

  return await new Promise((resolve) => {
    chrome.storage[area].get(keys as string[], (result: Partial<T>) => resolve(result));
  });
}

export async function storageSet<T extends Record<string, unknown>>(
  values: Partial<T>,
  area: StorageArea = "local",
): Promise<void> {
  const chrome = getChrome();
  if (!chrome?.storage?.[area]) return;

  await new Promise<void>((resolve) => {
    chrome.storage[area].set(values as Record<string, unknown>, () => resolve());
  });
}

export async function storageRemove(
  keys: string[],
  area: StorageArea = "local",
): Promise<void> {
  const chrome = getChrome();
  if (!chrome?.storage?.[area]) return;

  await new Promise<void>((resolve) => {
    chrome.storage[area].remove(keys, () => resolve());
  });
}

